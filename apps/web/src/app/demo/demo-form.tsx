"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitDemoRequest } from "./actions";

export function DemoForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  if (result?.ok) {
    return (
      <p className="text-sm text-muted-foreground">
        Thanks — we&apos;ve got your request and will be in touch shortly to find a time.
      </p>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await submitDemoRequest(formData);
          setResult(res.ok ? { ok: true } : { ok: false, error: res.error });
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="demo-name">Your name</Label>
        <Input id="demo-name" name="name" required autoFocus />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="demo-email">Work email</Label>
        <Input id="demo-email" name="email" type="email" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="demo-business">Business name</Label>
        <Input id="demo-business" name="businessName" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="demo-message">What are you hoping to use NovaCRM for? (optional)</Label>
        <textarea
          id="demo-message"
          name="message"
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>
      {result?.error && <p className="text-sm text-destructive">{result.error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sending..." : "Request a demo"}
      </Button>
    </form>
  );
}
