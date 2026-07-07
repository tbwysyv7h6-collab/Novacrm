import { prisma } from "@novacrm/db";
import { Database, DollarSign, TrendingUp, Users } from "lucide-react";
import { MetricCard } from "@/components/workspace/metric-card";
import {
  GrowthChart,
  RecordsPerObjectChart,
  StageDistributionChart,
} from "@/components/workspace/dashboard-charts";
import {
  computeRecordsCreatedByDay,
  computeRecordsInLastDays,
  computeRecordsPerObject,
  computeStageDistribution,
  computeTotalRevenue,
} from "@/lib/dashboard";

export default async function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  const objects = await prisma.crmObject.findMany({
    where: { organizationId: orgId },
    include: { fields: true },
    orderBy: { position: "asc" },
  });
  const records = await prisma.crmRecord.findMany({
    where: { organizationId: orgId },
    take: 5000,
    orderBy: { createdAt: "desc" },
  });

  if (objects.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Create your first object to start seeing metrics here.
        </p>
      </div>
    );
  }

  const recordsPerObject = computeRecordsPerObject(objects, records);
  const totalRevenue = computeTotalRevenue(objects, records);
  const growth = computeRecordsCreatedByDay(records, 14);
  const stageDistribution = computeStageDistribution(objects, records);
  const newThisWeek = computeRecordsInLastDays(records, 7);

  const primaryObject =
    objects.find((o) => /contact|customer|client/i.test(o.name)) ?? objects[0];
  const primaryCount = recordsPerObject.find((r) => r.name === primaryObject.name)?.count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">A live look at how your CRM is performing.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total records" value={records.length.toLocaleString()} icon={Database} />
        <MetricCard
          label={`${primaryObject.name}`}
          value={primaryCount.toLocaleString()}
          icon={Users}
        />
        <MetricCard
          label="Revenue tracked"
          value={totalRevenue.toLocaleString(undefined, { style: "currency", currency: "GBP" })}
          icon={DollarSign}
        />
        <MetricCard label="New this week" value={newThisWeek.toLocaleString()} icon={TrendingUp} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecordsPerObjectChart data={recordsPerObject} />
        <GrowthChart data={growth} />
        {stageDistribution && <StageDistributionChart data={stageDistribution} />}
      </div>
    </div>
  );
}
