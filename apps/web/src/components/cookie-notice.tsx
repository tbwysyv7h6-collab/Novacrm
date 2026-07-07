"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "novacrm-cookie-notice-dismissed";

export function CookieNotice() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) ref.current?.remove();
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    ref.current?.remove();
  }

  return (
    <div ref={ref} className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-4 text-sm sm:flex-row sm:justify-between">
        <p className="text-muted-foreground">
          We use only strictly necessary cookies to keep you signed in and remember your theme.
          No analytics or advertising cookies. See our{" "}
          <Link href="/privacy" className="font-medium text-foreground hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <Button size="sm" onClick={dismiss} className="shrink-0">
          Got it
        </Button>
      </div>
    </div>
  );
}
