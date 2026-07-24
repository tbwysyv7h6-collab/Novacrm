"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  LayoutDashboard,
  Workflow,
  Settings,
  Plus,
  GripVertical,
  Database,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { CrmObject, Organization } from "@novacrm/db";

const navItems = (orgId: string) => [
  { href: `/app/${orgId}`, label: "Dashboard", icon: LayoutDashboard },
  { href: `/app/${orgId}/automations`, label: "Automations", icon: Workflow },
  { href: `/app/${orgId}/settings`, label: "Settings", icon: Settings },
];

function SortableObjectRow({ object, orgId }: { object: CrmObject; orgId: string }) {
  const pathname = usePathname();
  const isActive = pathname === `/app/${orgId}/objects/${object.id}`;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: object.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group flex items-center gap-1 rounded-md", isDragging && "opacity-50")}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100"
        aria-label="Reorder"
      >
        <GripVertical className="size-3.5" />
      </button>
      <Link
        href={`/app/${orgId}/objects/${object.id}`}
        className={cn(
          "flex flex-1 items-center gap-2 truncate rounded-md px-2 py-1.5 text-sm transition-colors",
          isActive ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        <span className="w-4 shrink-0 text-center">{object.icon || <Database className="size-3.5" />}</span>
        <span className="truncate">{object.name}</span>
      </Link>
    </div>
  );
}

function AddObjectDialog({ organizationId }: { organizationId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const utils = trpc.useUtils();

  const createObject = trpc.object.create.useMutation({
    onSuccess: async () => {
      await utils.object.list.invalidate({ organizationId });
      setOpen(false);
      setName("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Add object" />
        }
      >
        <Plus className="size-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New object</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) createObject.mutate({ organizationId, name: name.trim() });
          }}
          className="space-y-4"
        >
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jobs, Properties, Invoices"
          />
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || createObject.isPending}>
              {createObject.isPending ? "Creating..." : "Create object"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NavLinks({ orgId, onNavigate }: { orgId: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5">
      {navItems(orgId).map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              isActive
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function BrandingBadge({ organization }: { organization: Organization }) {
  if (organization.plan !== "FREE") return null;
  return (
    <Link
      href={`/app/${organization.id}/settings/billing`}
      className="rounded-md border border-dashed px-2 py-2 text-center text-xs text-muted-foreground hover:text-foreground"
    >
      Powered by ValensCRM — <span className="underline">upgrade to remove</span>
    </Link>
  );
}

function SidebarHeader({ orgName }: { orgName: string }) {
  return (
    <>
      <Link
        href="/app"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" />
        All CRMs
      </Link>
      <h1 className="truncate text-base font-semibold tracking-tight">{orgName}</h1>
    </>
  );
}

function DesktopObjectList({
  organization,
  initialObjects,
}: {
  organization: Organization;
  initialObjects: CrmObject[];
}) {
  const { data: objects = initialObjects } = trpc.object.list.useQuery(
    { organizationId: organization.id },
    { initialData: initialObjects },
  );
  const utils = trpc.useUtils();
  const reorder = trpc.object.reorder.useMutation();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = objects.findIndex((o) => o.id === active.id);
    const newIndex = objects.findIndex((o) => o.id === over.id);
    const reordered = arrayMove(objects, oldIndex, newIndex);
    utils.object.list.setData({ organizationId: organization.id }, reordered);
    reorder.mutate({ organizationId: organization.id, objectIds: reordered.map((o) => o.id) });
  }

  return (
    <div className="flex-1 space-y-1 overflow-y-auto">
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Objects
        </span>
        <AddObjectDialog organizationId={organization.id} />
      </div>
      <DndContext
        id="workspace-objects-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={objects.map((o) => o.id)} strategy={verticalListSortingStrategy}>
          {objects.map((object) => (
            <SortableObjectRow key={object.id} object={object} orgId={organization.id} />
          ))}
        </SortableContext>
      </DndContext>
      {objects.length === 0 && (
        <p className="px-2 py-1.5 text-xs text-muted-foreground">No objects yet.</p>
      )}
    </div>
  );
}

function MobileObjectList({
  organization,
  initialObjects,
  onNavigate,
}: {
  organization: Organization;
  initialObjects: CrmObject[];
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const { data: objects = initialObjects } = trpc.object.list.useQuery(
    { organizationId: organization.id },
    { initialData: initialObjects },
  );

  return (
    <div className="flex-1 space-y-1 overflow-y-auto">
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Objects
        </span>
        <AddObjectDialog organizationId={organization.id} />
      </div>
      {objects.map((object) => {
        const href = `/app/${organization.id}/objects/${object.id}`;
        const isActive = pathname === href;
        return (
          <Link
            key={object.id}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 truncate rounded-md px-2 py-1.5 text-sm transition-colors",
              isActive
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <span className="w-4 shrink-0 text-center">
              {object.icon || <Database className="size-3.5" />}
            </span>
            <span className="truncate">{object.name}</span>
          </Link>
        );
      })}
      {objects.length === 0 && (
        <p className="px-2 py-1.5 text-xs text-muted-foreground">No objects yet.</p>
      )}
    </div>
  );
}

function MobileNav({
  organization,
  initialObjects,
}: {
  organization: Organization;
  initialObjects: CrmObject[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 border-b bg-muted/20 px-4 py-3 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Open menu" />}>
          <Menu className="size-4" />
        </SheetTrigger>
        <SheetContent side="left" className="flex w-72 flex-col gap-4 p-4">
          <SidebarHeader orgName={organization.name} />
          <NavLinks orgId={organization.id} onNavigate={() => setOpen(false)} />
          <MobileObjectList
            organization={organization}
            initialObjects={initialObjects}
            onNavigate={() => setOpen(false)}
          />
          <BrandingBadge organization={organization} />
        </SheetContent>
      </Sheet>
      <span className="truncate text-sm font-medium">{organization.name}</span>
    </div>
  );
}

export function WorkspaceSidebar({
  organization,
  initialObjects,
}: {
  organization: Organization;
  initialObjects: CrmObject[];
}) {
  return (
    <>
      <MobileNav organization={organization} initialObjects={initialObjects} />
      <aside className="sticky top-[53px] hidden h-[calc(100vh-53px)] w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r bg-muted/20 p-4 md:flex">
        <SidebarHeader orgName={organization.name} />
        <NavLinks orgId={organization.id} />
        <DesktopObjectList organization={organization} initialObjects={initialObjects} />
        <BrandingBadge organization={organization} />
      </aside>
    </>
  );
}
