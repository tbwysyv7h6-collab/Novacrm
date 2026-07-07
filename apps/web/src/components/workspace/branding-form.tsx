"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Organization } from "@novacrm/db";

export function BrandingForm({ organization }: { organization: Organization }) {
  const [name, setName] = useState(organization.name);
  const [logoUrl, setLogoUrl] = useState(organization.logoUrl ?? "");
  const [brandColor, setBrandColor] = useState(organization.brandColor ?? "#6366f1");
  const [saved, setSaved] = useState(false);

  const updateBranding = trpc.organization.updateBranding.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        updateBranding.mutate({ organizationId: organization.id, name, logoUrl, brandColor });
      }}
      className="max-w-md space-y-4"
    >
      <div className="grid gap-2">
        <Label htmlFor="org-name">Workspace name</Label>
        <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="org-logo">Logo URL</Label>
        <Input
          id="org-logo"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="org-color">Brand colour</Label>
        <div className="flex items-center gap-2">
          <input
            id="org-color"
            type="color"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="size-9 cursor-pointer rounded-md border bg-transparent"
          />
          <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={updateBranding.isPending}>
        {updateBranding.isPending ? "Saving..." : saved ? "Saved" : "Save changes"}
      </Button>
    </form>
  );
}
