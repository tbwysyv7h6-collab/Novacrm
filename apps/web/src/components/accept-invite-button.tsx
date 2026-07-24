"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const acceptInvite = trpc.organization.acceptInvite.useMutation({
    onSuccess: ({ organizationId }) => router.push(`/app/${organizationId}`),
    onError: (err) => setError(err.message),
  });

  return (
    <div className="w-full space-y-3">
      <Button
        className="w-full"
        onClick={() => acceptInvite.mutate({ token })}
        disabled={acceptInvite.isPending}
      >
        {acceptInvite.isPending ? "Joining..." : "Accept invite"}
      </Button>
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}
