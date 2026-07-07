"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateWorkspaceDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const utils = trpc.useUtils();

  const createOrg = trpc.organization.create.useMutation({
    onSuccess: async (org) => {
      await utils.organization.list.invalidate();
      setOpen(false);
      setName("");
      router.push(`/app/${org.id}`);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        New CRM
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new CRM</DialogTitle>
          <DialogDescription>
            Give your workspace a name. You can build out objects, fields, and
            pipelines right after.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) createOrg.mutate({ name: name.trim() });
          }}
          className="space-y-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Crystal Clear Window Cleaning"
              autoFocus
            />
          </div>
          {createOrg.error && (
            <p className="text-sm text-destructive">{createOrg.error.message}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || createOrg.isPending}>
              {createOrg.isPending ? "Creating..." : "Create CRM"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
