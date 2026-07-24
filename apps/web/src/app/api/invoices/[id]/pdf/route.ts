import { NextResponse } from "next/server";
import { prisma } from "@novacrm/db";
import { auth } from "@/lib/auth";
import { requireMembership } from "@/server/membership";
import { renderInvoicePdf } from "@/server/invoicing/pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      lineItems: { orderBy: { position: "asc" } },
      organization: {
        select: { name: true, businessAddress: true, vatNumber: true, brandColor: true },
      },
    },
  });
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await requireMembership(session.user.id, invoice.organizationId);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pdfBuffer = await renderInvoicePdf({
    organization: invoice.organization,
    invoice: {
      number: invoice.number,
      status: invoice.status,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerAddress: invoice.customerAddress,
      issuedAt: invoice.issuedAt,
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

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
    },
  });
}
