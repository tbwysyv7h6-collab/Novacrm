"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ObjectTable } from "@/components/workspace/object-table";
import { KanbanBoard } from "@/components/workspace/kanban-board";
import { CalendarView } from "@/components/workspace/calendar-view";
import { FormViewPanel } from "@/components/workspace/form-view-panel";
import { AddViewDialog } from "@/components/workspace/add-view-dialog";
import type { CrmObject } from "@novacrm/db";
import type { RouterOutputs } from "@/lib/trpc/types";

type ObjectWithDetails = RouterOutputs["object"]["get"];

export function ViewSwitcher({
  object: initialObject,
  organizationId,
  relationTargets,
}: {
  object: ObjectWithDetails;
  organizationId: string;
  relationTargets: CrmObject[];
}) {
  const { data: object = initialObject } = trpc.object.get.useQuery(
    { objectId: initialObject.id },
    { initialData: initialObject },
  );
  const [activeViewId, setActiveViewId] = useState(object.views[0]?.id);
  const activeView = object.views.find((v) => v.id === activeViewId) ?? object.views[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={activeView?.id} onValueChange={setActiveViewId}>
          <TabsList>
            {object.views.map((view) => (
              <TabsTrigger key={view.id} value={view.id}>
                {view.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <AddViewDialog objectId={object.id} fields={object.fields} />
      </div>

      {activeView?.type === "TABLE" && (
        <ObjectTable object={object} organizationId={organizationId} relationTargets={relationTargets} />
      )}
      {activeView?.type === "KANBAN" && <KanbanBoard object={object} view={activeView} />}
      {activeView?.type === "CALENDAR" && <CalendarView object={object} view={activeView} />}
      {activeView?.type === "FORM" && <FormViewPanel view={activeView} />}
    </div>
  );
}
