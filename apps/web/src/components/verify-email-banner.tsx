"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function VerifyEmailBanner() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  async function resend() {
    setStatus("sending");
    await fetch("/api/auth/resend-verification", { method: "POST" });
    setStatus("sent");
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-amber-500/10 px-6 py-2 text-sm">
      <span>
        {status === "sent"
          ? "Verification email sent — check your inbox."
          : "Please verify your email address."}
      </span>
      {status !== "sent" && (
        <Button variant="outline" size="sm" onClick={resend} disabled={status === "sending"}>
          {status === "sending" ? "Sending..." : "Resend email"}
        </Button>
      )}
    </div>
  );
}
