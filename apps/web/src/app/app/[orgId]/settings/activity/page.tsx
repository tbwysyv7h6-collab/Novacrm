import { SettingsNav } from "@/components/workspace/settings-nav";
import { ActivityLogPanel } from "@/components/workspace/activity-log-panel";

export default async function ActivitySettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <SettingsNav orgId={orgId} />
      <ActivityLogPanel organizationId={orgId} />
    </div>
  );
}
