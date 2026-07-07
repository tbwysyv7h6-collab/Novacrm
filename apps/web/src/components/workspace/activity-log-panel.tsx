"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent } from "@/components/ui/card";

function humanizeAction(action: string): string {
  const label = action.split(".").pop() ?? action;
  return label.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function ActivityLogPanel({ organizationId }: { organizationId: string }) {
  const { data: logs = [] } = trpc.organization.auditLog.useQuery({ organizationId });

  if (logs.length === 0) {
    return <Card className="p-6 text-center text-sm text-muted-foreground">No activity yet.</Card>;
  }

  return (
    <div className="max-w-2xl space-y-2">
      {logs.map((log) => (
        <Card key={log.id}>
          <CardContent className="flex items-center justify-between py-3 text-sm">
            <div>
              <p className="font-medium">{humanizeAction(log.action)}</p>
              <p className="text-xs text-muted-foreground">
                {log.user?.name ?? log.user?.email ?? "System"} ·{" "}
                {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
