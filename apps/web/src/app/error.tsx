"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const CHUNK_ERROR_PATTERN =
  /loading chunk|failed to fetch dynamically imported module|importing a module script failed|failed to import route module/i;

// A page left open across a deploy tries to fetch JS for the *old* build,
// which 404s once the new deploy's assets replace it. A full reload fetches
// the current build and resolves it — the user doesn't need to know that.
function isStaleBuildError(error: Error): boolean {
  return error.name === "ChunkLoadError" || CHUNK_ERROR_PATTERN.test(error.message);
}

const RELOAD_GUARD_KEY = "novacrm:stale-build-reload";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Guarded to once per tab session — if reloading doesn't fix it, it's a
  // real error, not a stale build, so fall through to the normal UI rather
  // than reload forever. Decided during the initial render (not an effect)
  // so the error UI never flashes before the reload kicks in.
  const [recovering] = useState(
    () =>
      typeof window !== "undefined" &&
      isStaleBuildError(error) &&
      !sessionStorage.getItem(RELOAD_GUARD_KEY),
  );

  useEffect(() => {
    console.error(error);

    if (recovering) {
      sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
      window.location.reload();
    }
  }, [error, recovering]);

  if (recovering) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-sm text-muted-foreground">
        An unexpected error occurred. You can try again, or head back to your dashboard.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
