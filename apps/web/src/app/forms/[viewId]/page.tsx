import { notFound } from "next/navigation";
import { prisma } from "@novacrm/db";
import { PublicFormClient } from "@/components/workspace/public-form-client";
import { isPublicFormField } from "@/lib/public-form";

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;

  const view = await prisma.crmView.findUnique({
    where: { id: viewId },
    include: {
      object: {
        include: {
          fields: { orderBy: { position: "asc" } },
          organization: { select: { name: true, brandColor: true, logoUrl: true, plan: true } },
        },
      },
    },
  });

  if (!view || view.type !== "FORM") notFound();

  const publicFields = view.object.fields.filter(isPublicFormField);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
        <div className="mb-6">
          {view.object.organization.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={view.object.organization.logoUrl} alt="" className="mb-3 h-8" />
          )}
          <h1 className="text-lg font-semibold">{view.name}</h1>
          <p className="text-sm text-muted-foreground">{view.object.organization.name}</p>
        </div>
        <PublicFormClient viewId={view.id} fields={publicFields} submitLabel="Submit" />
        {view.object.organization.plan === "FREE" && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Powered by{" "}
            <a href="https://www.novacrm.uk" className="font-medium hover:underline">
              NovaCRM
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
