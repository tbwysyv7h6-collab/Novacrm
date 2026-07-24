"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Organization } from "@novacrm/db";

export function InvoicingSettingsForm({ organization }: { organization: Organization }) {
  const [businessAddress, setBusinessAddress] = useState(organization.businessAddress ?? "");
  const [vatNumber, setVatNumber] = useState(organization.vatNumber ?? "");
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
        updateBranding.mutate({ organizationId: organization.id, businessAddress, vatNumber });
      }}
      className="max-w-md space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        Shown on the header of every invoice you send.
      </p>
      <div className="grid gap-2">
        <Label htmlFor="business-address">Business address</Label>
        <Input
          id="business-address"
          value={businessAddress}
          onChange={(e) => setBusinessAddress(e.target.value)}
          placeholder="12 High Street, Anytown, AB1 2CD"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="vat-number">VAT number (optional)</Label>
        <Input
          id="vat-number"
          value={vatNumber}
          onChange={(e) => setVatNumber(e.target.value)}
          placeholder="GB123456789"
        />
      </div>
      <Button type="submit" disabled={updateBranding.isPending}>
        {updateBranding.isPending ? "Saving..." : saved ? "Saved" : "Save changes"}
      </Button>
    </form>
  );
}
