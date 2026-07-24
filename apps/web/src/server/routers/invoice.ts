import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma, type Invoice, type InvoiceLineItem } from "@novacrm/db";
import { router, protectedProcedure } from "../trpc";
import { requireMembership } from "../membership";
import { calculateInvoiceTotals } from "@/lib/invoice-calculations";
import { renderInvoicePdf } from "../invoicing/pdf";
import { sendInvoiceEmail } from "@/lib/mail";

const lineItemInputSchema = z.object({
  description: z.string().trim().min(1).max(200),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  vatRate: z.number().min(0).max(100),
});

function serializeInvoice(invoice: Invoice & { lineItems: InvoiceLineItem[] }) {
  return {
    ...invoice,
    subtotal: invoice.subtotal.toNumber(),
    vatAmount: invoice.vatAmount.toNumber(),
    total: invoice.total.toNumber(),
    lineItems: invoice.lineItems.map((item) => ({
      ...item,
      quantity: item.quantity.toNumber(),
      unitPrice: item.unitPrice.toNumber(),
      vatRate: item.vatRate.toNumber(),
      lineTotal: item.lineTotal.toNumber(),
    })),
  };
}

async function assertInvoiceAccess(userId: string, invoiceId: string, minRole?: "MEMBER" | "ADMIN") {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });
  await requireMembership(userId, invoice.organizationId, minRole);
  return invoice;
}

export const invoiceRouter = router({
  list: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId);
      const invoices = await prisma.invoice.findMany({
        where: { organizationId: input.organizationId },
        include: { lineItems: true },
        orderBy: { createdAt: "desc" },
      });
      return invoices.map(serializeInvoice);
    }),

  get: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await assertInvoiceAccess(ctx.userId, input.invoiceId);
      return serializeInvoice(invoice);
    }),

  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        customerName: z.string().trim().min(1).max(120),
        customerEmail: z.string().email().optional().or(z.literal("")),
        customerAddress: z.string().trim().max(500).optional(),
        crmRecordId: z.string().optional(),
        notes: z.string().trim().max(1000).optional(),
        dueAt: z.string().datetime().optional(),
        lineItems: z.array(lineItemInputSchema).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.userId, input.organizationId, "MEMBER");

      const organization = await prisma.organization.findUniqueOrThrow({
        where: { id: input.organizationId },
        select: { plan: true },
      });
      if (organization.plan === "FREE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invoicing requires the Starter plan or above. Upgrade to start sending invoices.",
        });
      }

      const totals = calculateInvoiceTotals(input.lineItems);

      const invoice = await prisma.$transaction(async (tx) => {
        const org = await tx.organization.update({
          where: { id: input.organizationId },
          data: { invoiceCounter: { increment: 1 } },
        });
        const number = `INV-${String(org.invoiceCounter).padStart(4, "0")}`;

        return tx.invoice.create({
          data: {
            organizationId: input.organizationId,
            number,
            customerName: input.customerName,
            customerEmail: input.customerEmail || null,
            customerAddress: input.customerAddress || null,
            crmRecordId: input.crmRecordId,
            notes: input.notes,
            dueAt: input.dueAt ? new Date(input.dueAt) : null,
            createdById: ctx.userId,
            subtotal: totals.subtotal,
            vatAmount: totals.vatAmount,
            total: totals.total,
            lineItems: {
              create: totals.lineItems.map((item, position) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                vatRate: item.vatRate,
                lineTotal: item.lineTotal,
                position,
              })),
            },
          },
          include: { lineItems: { orderBy: { position: "asc" } } },
        });
      });

      return serializeInvoice(invoice);
    }),

  update: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        customerName: z.string().trim().min(1).max(120),
        customerEmail: z.string().email().optional().or(z.literal("")),
        customerAddress: z.string().trim().max(500).optional(),
        notes: z.string().trim().max(1000).optional(),
        dueAt: z.string().datetime().optional(),
        lineItems: z.array(lineItemInputSchema).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await assertInvoiceAccess(ctx.userId, input.invoiceId, "MEMBER");
      if (existing.status !== "DRAFT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft invoices can be edited. Void this invoice and create a new one instead.",
        });
      }

      const totals = calculateInvoiceTotals(input.lineItems);

      const invoice = await prisma.$transaction(async (tx) => {
        await tx.invoiceLineItem.deleteMany({ where: { invoiceId: input.invoiceId } });
        return tx.invoice.update({
          where: { id: input.invoiceId },
          data: {
            customerName: input.customerName,
            customerEmail: input.customerEmail || null,
            customerAddress: input.customerAddress || null,
            notes: input.notes,
            dueAt: input.dueAt ? new Date(input.dueAt) : null,
            subtotal: totals.subtotal,
            vatAmount: totals.vatAmount,
            total: totals.total,
            lineItems: {
              create: totals.lineItems.map((item, position) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                vatRate: item.vatRate,
                lineTotal: item.lineTotal,
                position,
              })),
            },
          },
          include: { lineItems: { orderBy: { position: "asc" } } },
        });
      });

      return serializeInvoice(invoice);
    }),

  send: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await prisma.invoice.findUniqueOrThrow({
        where: { id: input.invoiceId },
        include: {
          lineItems: { orderBy: { position: "asc" } },
          organization: {
            select: { name: true, businessAddress: true, vatNumber: true, brandColor: true },
          },
        },
      });
      await requireMembership(ctx.userId, invoice.organizationId, "MEMBER");

      if (invoice.status === "VOID") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A voided invoice can't be sent." });
      }
      if (!invoice.customerEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invoice has no customer email address to send to.",
        });
      }

      const pdfBuffer = await renderInvoicePdf({
        organization: invoice.organization,
        invoice: {
          number: invoice.number,
          status: invoice.status,
          customerName: invoice.customerName,
          customerEmail: invoice.customerEmail,
          customerAddress: invoice.customerAddress,
          issuedAt: invoice.issuedAt ?? new Date(),
          dueAt: invoice.dueAt,
          notes: invoice.notes,
          subtotal: invoice.subtotal.toNumber(),
          vatAmount: invoice.vatAmount.toNumber(),
          total: invoice.total.toNumber(),
          lineItems: invoice.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity.toNumber(),
            unitPrice: item.unitPrice.toNumber(),
            vatRate: item.vatRate.toNumber(),
            lineTotal: item.lineTotal.toNumber(),
          })),
        },
      });

      await sendInvoiceEmail({
        to: invoice.customerEmail,
        businessName: invoice.organization.name,
        invoiceNumber: invoice.number,
        total: invoice.total.toNumber(),
        dueAt: invoice.dueAt,
        pdfBuffer,
      });

      const updated = await prisma.invoice.update({
        where: { id: input.invoiceId },
        data:
          invoice.status === "DRAFT" ? { status: "SENT", issuedAt: new Date() } : {},
        include: { lineItems: { orderBy: { position: "asc" } } },
      });

      return serializeInvoice(updated);
    }),

  markPaid: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await assertInvoiceAccess(ctx.userId, input.invoiceId, "MEMBER");
      if (existing.status === "VOID") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A voided invoice can't be marked paid." });
      }
      const invoice = await prisma.invoice.update({
        where: { id: input.invoiceId },
        data: { status: "PAID", paidAt: new Date() },
        include: { lineItems: { orderBy: { position: "asc" } } },
      });
      return serializeInvoice(invoice);
    }),

  void: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertInvoiceAccess(ctx.userId, input.invoiceId, "MEMBER");
      const invoice = await prisma.invoice.update({
        where: { id: input.invoiceId },
        data: { status: "VOID" },
        include: { lineItems: { orderBy: { position: "asc" } } },
      });
      return serializeInvoice(invoice);
    }),

  delete: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await assertInvoiceAccess(ctx.userId, input.invoiceId, "ADMIN");
      if (existing.status !== "DRAFT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft invoices can be deleted. Void a sent invoice instead.",
        });
      }
      await prisma.invoice.delete({ where: { id: input.invoiceId } });
      return { ok: true };
    }),
});
