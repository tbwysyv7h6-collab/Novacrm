"use server";

import { headers } from "next/headers";
import { Prisma, prisma } from "@novacrm/db";
import { getAvailableSlots } from "@/server/booking/slots";
import { checkRateLimit } from "@/server/rate-limit";
import { sendBookingConfirmationEmail, sendBookingNotificationEmail } from "@/lib/mail";

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headerList.get("x-real-ip") ?? "unknown";
}

export async function bookAppointment(
  orgSlug: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ip = await getClientIp();
  const rateLimit = checkRateLimit(`public-booking:${orgSlug}:${ip}`, 10, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { ok: false, error: "Too many booking attempts. Please try again later." };
  }

  const organization = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!organization || organization.plan === "FREE") {
    return { ok: false, error: "This business isn't accepting online bookings." };
  }

  const startsAtRaw = formData.get("startsAt");
  const customerName = formData.get("customerName");
  const customerEmail = formData.get("customerEmail");
  const customerPhone = formData.get("customerPhone");
  const notes = formData.get("notes");

  if (typeof startsAtRaw !== "string" || !startsAtRaw) {
    return { ok: false, error: "Please choose a time slot." };
  }
  if (typeof customerName !== "string" || !customerName.trim()) {
    return { ok: false, error: "Your name is required." };
  }
  if (typeof customerEmail !== "string" || !customerEmail.trim()) {
    return { ok: false, error: "Your email is required." };
  }

  const startsAt = new Date(startsAtRaw);

  const [rules, blocks, existingAppointments] = await Promise.all([
    prisma.availabilityRule.findMany({ where: { organizationId: organization.id } }),
    prisma.availabilityBlock.findMany({ where: { organizationId: organization.id } }),
    prisma.appointment.findMany({
      where: { organizationId: organization.id, status: "CONFIRMED" },
      select: { startsAt: true },
    }),
  ]);

  const availableSlots = getAvailableSlots(
    rules,
    blocks,
    existingAppointments,
    organization.appointmentDurationMinutes,
    organization.bookingWindowDays,
  );

  const stillAvailable = availableSlots.some((slot) => slot.getTime() === startsAt.getTime());
  if (!stillAvailable) {
    return { ok: false, error: "That slot is no longer available. Please choose another." };
  }

  const endsAt = new Date(startsAt.getTime() + organization.appointmentDurationMinutes * 60 * 1000);

  try {
    await prisma.appointment.create({
      data: {
        organizationId: organization.id,
        startsAt,
        endsAt,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: typeof customerPhone === "string" && customerPhone.trim() ? customerPhone.trim() : null,
        notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "That slot was just taken. Please choose another." };
    }
    throw err;
  }

  await sendBookingConfirmationEmail({
    to: customerEmail.trim(),
    businessName: organization.name,
    startsAt,
  });

  const owner = await prisma.membership.findFirst({
    where: { organizationId: organization.id, role: "OWNER" },
    include: { user: { select: { email: true } } },
  });
  if (owner?.user.email) {
    await sendBookingNotificationEmail({
      to: owner.user.email,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: typeof customerPhone === "string" && customerPhone.trim() ? customerPhone.trim() : null,
      startsAt,
    });
  }

  return { ok: true };
}
