"use client";

import { motion } from "motion/react";
import { Check, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

const generated = [
  "Customer database",
  "Quote system",
  "Job scheduler",
  "Invoice tracker",
  "Payment tracker",
  "Employee management",
  "Reminder system",
  "Dashboard",
  "Sales pipeline",
];

export function AiBuilderSection() {
  return (
    <section id="ai" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto mb-14 max-w-xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Describe your business. Get a CRM.
        </h2>
        <p className="mt-4 text-muted-foreground">
          The AI CRM Builder reads a single sentence and generates a fully working
          CRM tailored to your business — in under a minute.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col justify-center gap-4 p-8">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="size-4 text-primary" />
            Tell NovaCRM about your business
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/40 p-5 text-lg leading-relaxed">
            &ldquo;I own a window cleaning business with 3 employees.&rdquo;
          </div>
          <p className="text-sm text-muted-foreground">
            That&apos;s it. No forms, no configuration wizard — the AI infers the
            objects, fields, pipeline stages, and dashboards a window cleaning
            business actually needs.
          </p>
        </Card>

        <Card className="p-8">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            Generated for you in under 60 seconds
          </p>
          <ul className="space-y-3">
            {generated.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-background px-4 py-2.5 text-sm"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="size-3.5" />
                </span>
                {item}
              </motion.li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}
