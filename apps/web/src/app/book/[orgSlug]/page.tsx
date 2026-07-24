import { notFound } from "next/navigation";
import { prisma } from "@novacrm/db";
import { getAvailableSlots } from "@/server/booking/slots";
import { BookingCalendar } from "@/components/booking/booking-calendar";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const organization = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!organization) notFound();

  if (organization.plan === "FREE") {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-lg px-6 py-24 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{organization.name}</h1>
          <p className="mt-3 text-muted-foreground">
            This business isn&apos;t accepting online bookings yet.
          </p>
        </main>
        <SiteFooter />
      </>
    );
  }

  const [rules, blocks, existingAppointments] = await Promise.all([
    prisma.availabilityRule.findMany({ where: { organizationId: organization.id } }),
    prisma.availabilityBlock.findMany({ where: { organizationId: organization.id } }),
    prisma.appointment.findMany({
      where: { organizationId: organization.id, status: "CONFIRMED" },
      select: { startsAt: true },
    }),
  ]);

  const slots = getAvailableSlots(
    rules,
    blocks,
    existingAppointments,
    organization.appointmentDurationMinutes,
    organization.bookingWindowDays,
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Book an appointment with {organization.name}
          </h1>
          <p className="mt-2 text-muted-foreground">Pick a time that works for you.</p>
        </div>
        <BookingCalendar
          orgSlug={orgSlug}
          slots={slots.map((s) => s.toISOString())}
          durationMinutes={organization.appointmentDurationMinutes}
        />
      </main>
      <SiteFooter />
    </>
  );
}
