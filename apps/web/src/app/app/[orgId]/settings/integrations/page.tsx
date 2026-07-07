import { SettingsNav } from "@/components/workspace/settings-nav";
import { WebhooksPanel } from "@/components/workspace/webhooks-panel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COMING_SOON_INTEGRATIONS } from "@/lib/integrations";

export default async function IntegrationsSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <SettingsNav orgId={orgId} />

      <WebhooksPanel organizationId={orgId} />

      <div>
        <h3 className="mb-3 font-medium">More integrations</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COMING_SOON_INTEGRATIONS.map((integration) => (
            <Card key={integration.id} className="p-4 opacity-70">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{integration.name}</p>
                  <p className="text-sm text-muted-foreground">{integration.description}</p>
                </div>
                <Badge variant="outline">Coming soon</Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
