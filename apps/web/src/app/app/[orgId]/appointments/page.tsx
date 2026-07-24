import { prisma } from "@novacrm/db";
import { AppointmentsPanel } from "@/components/workspace/appointments-panel";

export default async function AppointmentsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: {
      plan: true,
      slug: true,
      appointmentDurationMinutes: true,
      bookingWindowDays: true,
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
        <p className="text-muted-foreground">
          Set your availability and let customers book themselves in.
        </p>
      </div>
      <AppointmentsPanel organizationId={orgId} organization={organization} />
    </div>
  );
}
