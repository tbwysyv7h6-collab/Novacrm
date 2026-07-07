"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const EXAMPLES = [
  "I own a window cleaning business with 3 employees.",
  "I'm a solo electrician taking on residential jobs.",
  "We're a 5-person marketing agency serving local businesses.",
  "I run a small landscaping company with seasonal contracts.",
];

export default function AiBuilderPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [businessName, setBusinessName] = useState("");

  const generateCrm = trpc.ai.generateCrm.useMutation({
    onSuccess: (result) => {
      router.push(`/app/${result.organizationId}`);
    },
  });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-primary/15">
          <Sparkles className="size-5 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">AI CRM Builder</h1>
        <p className="text-muted-foreground">
          Describe your business in a sentence — NovaCRM builds the rest.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tell us about your business</CardTitle>
          <CardDescription>
            The more specific, the better the CRM we generate for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. I own a window cleaning business with 3 employees."
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          />
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Business name (optional)"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          />

          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setDescription(example)}
                className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              >
                {example}
              </button>
            ))}
          </div>

          {generateCrm.error && (
            <p className="text-sm text-destructive">{generateCrm.error.message}</p>
          )}

          <Button
            className="w-full"
            disabled={description.trim().length < 10 || generateCrm.isPending}
            onClick={() => generateCrm.mutate({ description: description.trim(), businessName: businessName.trim() || undefined })}
          >
            {generateCrm.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Building your CRM...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate my CRM
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
