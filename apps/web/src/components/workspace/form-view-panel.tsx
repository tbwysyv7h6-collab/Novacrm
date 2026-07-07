"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CrmView } from "@novacrm/db";

export function FormViewPanel({ view }: { view: CrmView }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/forms/${view.id}` : "";

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="text-base">Share this form</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Anyone with this link can submit a new record — great for lead capture forms on your
          website or in an email signature.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-md border bg-muted/40 px-3 py-2 text-xs">
            {url}
          </code>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Copy link"
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
