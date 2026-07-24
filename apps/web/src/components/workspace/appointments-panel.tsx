"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Copy, Check, X } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AvailabilitySettingsForm } from "@/components/workspace/availability-settings-form";
import type { PlanTier } from "@novacrm/db";

function formatAppointmentTime(date: string | Date) {
  return new Date(date).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BookingLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/book/${slug}` : `/book/${slug}`;

  return (
    <Card className="flex flex-wrap items-center justify-between gap-2 p-4">
      <div>
        <p className="text-sm font-medium">Your public booking page</p>
        <p className="text-sm text-muted-foreground">{url}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copied" : "Copy link"}
      </Button>
    </Card>
  );
}

function UpcomingAppointments({ organizationId }: { organizationId: string }) {
  const { data: appointments = [] } = trpc.appointment.list.useQuery({ organizationId });
  const utils = trpc.useUtils();
  const cancel = trpc.appointment.cancel.useMutation({
    onSuccess: () => utils.appointment.list.invalidate({ organizationId }),
  });

  if (appointments.length === 0) {
    return (
      <Card className="p-10 text-center text-muted-foreground">No upcoming appointments.</Card>
    );
  }

  return (
    <div className="space-y-2">
      {appointments.map((appointment) => (
        <Card key={appointment.id} className="flex items-center justify-between p-4">
          <div>
            <p className="font-medium">{formatAppointmentTime(appointment.startsAt)}</p>
            <p className="text-sm text-muted-foreground">
              {appointment.customerName} · {appointment.customerEmail}
              {appointment.customerPhone ? ` · ${appointment.customerPhone}` : ""}
            </p>
            {appointment.notes && (
              <p className="mt-1 text-sm text-muted-foreground">{appointment.notes}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => cancel.mutate({ appointmentId: appointment.id })}
            aria-label="Cancel appointment"
          >
            <X className="size-4" />
          </Button>
        </Card>
      ))}
    </div>
  );
}

export function AppointmentsPanel({
  organizationId,
  organization,
}: {
  organizationId: string;
  organization: {
    plan: PlanTier;
    slug: string;
    appointmentDurationMinutes: number;
    bookingWindowDays: number;
  };
}) {
  if (organization.plan === "FREE") {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <Lock className="size-6 text-muted-foreground" />
        <div>
          <p className="font-medium">Appointment booking is a Starter feature</p>
          <p className="text-sm text-muted-foreground">
            Upgrade to Starter or above to let customers book themselves in.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href={`/app/${organizationId}/settings/billing`} />}>
          Upgrade to Starter
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <BookingLink slug={organization.slug} />
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <UpcomingAppointments organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="availability">
          <AvailabilitySettingsForm organizationId={organizationId} organization={organization} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
