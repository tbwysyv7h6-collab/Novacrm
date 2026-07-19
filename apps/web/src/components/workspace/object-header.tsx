"use client";

import { motion } from "motion/react";

export function ObjectHeader({ icon, name }: { icon: string | null; name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative flex items-center gap-3"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-4 -left-4 -z-10 size-20 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--primary)_25%,transparent),transparent_70%)]"
      />
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-muted/40 text-lg shadow-sm">
        {icon || "📋"}
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
    </motion.div>
  );
}
