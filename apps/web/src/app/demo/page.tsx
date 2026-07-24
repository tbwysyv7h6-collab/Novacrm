import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@novacrm/db";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { DemoExplorer } from "./demo-explorer";

export const metadata: Metadata = {
  title: "Live Demo",
  description: "Explore a real ValensCRM workspace — no signup required.",
};

// Force request-time rendering instead of build-time prerendering. Without
// this, every production build queries the DB to prerender this page, and a
// Neon free-tier cold start (DB asleep) fails the *entire* build, not just
// this page.
export const dynamic = "force-dynamic";

export default async function DemoPage() {
  const organization = await prisma.organization.findUnique({
    where: { slug: "demo" },
    include: {
      objects: {
        orderBy: { position: "asc" },
        include: {
          fields: { orderBy: { position: "asc" } },
          views: { orderBy: { position: "asc" } },
          records: { orderBy: { createdAt: "asc" }, take: 25 },
        },
      },
    },
  });

  if (!organization) notFound();

  return (
    <>
      <SiteHeader />
      <DemoExplorer organization={organization} />
      <SiteFooter />
    </>
  );
}
