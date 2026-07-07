"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitPublicForm } from "@/app/forms/[viewId]/actions";
import type { CrmField } from "@novacrm/db";

function FieldInput({ field }: { field: CrmField }) {
  const options = (field.options as { choices?: string[] } | null) ?? {};

  switch (field.type) {
    case "LONG_TEXT":
      return (
        <textarea
          name={field.apiName}
          required={field.isRequired}
          rows={4}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
        />
      );
    case "BOOLEAN":
      return <input type="checkbox" name={field.apiName} className="size-4 accent-primary" />;
    case "NUMBER":
    case "CURRENCY":
      return <Input type="number" name={field.apiName} required={field.isRequired} />;
    case "DATE":
      return <Input type="date" name={field.apiName} required={field.isRequired} />;
    case "DATETIME":
      return <Input type="datetime-local" name={field.apiName} required={field.isRequired} />;
    case "EMAIL":
      return <Input type="email" name={field.apiName} required={field.isRequired} />;
    case "PHONE":
      return <Input type="tel" name={field.apiName} required={field.isRequired} />;
    case "URL":
      return <Input type="url" name={field.apiName} required={field.isRequired} />;
    case "SELECT":
      return (
        <select
          name={field.apiName}
          required={field.isRequired}
          defaultValue=""
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
        >
          <option value="" disabled>
            Select...
          </option>
          {(options.choices ?? []).map((choice) => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
        </select>
      );
    case "MULTI_SELECT":
      return (
        <div className="space-y-1.5">
          {(options.choices ?? []).map((choice) => (
            <label key={choice} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={field.apiName} value={choice} className="size-4 accent-primary" />
              {choice}
            </label>
          ))}
        </div>
      );
    default:
      return <Input name={field.apiName} required={field.isRequired} />;
  }
}

export function PublicFormClient({
  viewId,
  fields,
  submitLabel,
}: {
  viewId: string;
  fields: CrmField[];
  submitLabel: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  if (result?.ok) {
    return <p className="text-sm text-muted-foreground">Thanks — we&apos;ve received your submission.</p>;
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await submitPublicForm(viewId, formData);
          setResult(res.ok ? { ok: true } : { ok: false, error: res.error });
        });
      }}
    >
      {fields.map((field) => (
        <div key={field.id} className="grid gap-2">
          <Label htmlFor={field.apiName}>
            {field.name}
            {field.isRequired && <span className="text-destructive"> *</span>}
          </Label>
          <FieldInput field={field} />
        </div>
      ))}
      {result?.error && <p className="text-sm text-destructive">{result.error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Submitting..." : submitLabel}
      </Button>
    </form>
  );
}
