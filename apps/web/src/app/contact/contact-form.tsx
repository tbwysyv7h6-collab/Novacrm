"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitContactRequest } from "./actions";

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  if (result?.ok) {
    return (
      <p className="text-sm text-muted-foreground">
        Thanks — we&apos;ve got your message and will be in touch shortly.
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
          const res = await submitContactRequest(formData);
          setResult(res.ok ? { ok: true } : { ok: false, error: res.error });
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="contact-name">Your name</Label>
        <Input id="contact-name" name="name" required autoFocus />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact-email">Work email</Label>
        <Input id="contact-email" name="email" type="email" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact-business">Business name</Label>
        <Input id="contact-business" name="businessName" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact-message">What can we help with? (optional)</Label>
        <textarea
          id="contact-message"
          name="message"
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>
      {result?.error && <p className="text-sm text-destructive">{result.error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
