"use client";

import { motion } from "motion/react";
import { ArrowRight, Mail, UserPlus, ListTodo, RefreshCcw, BellRing } from "lucide-react";
import { Card } from "@/components/ui/card";

const actions = [
  { icon: Mail, label: "Send email" },
  { icon: UserPlus, label: "Assign employee" },
  { icon: ListTodo, label: "Create task" },
  { icon: RefreshCcw, label: "Update status" },
  { icon: BellRing, label: "Schedule reminder" },
];

export function AutomationsSection() {
  return (
    <section id="automations" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto mb-14 max-w-xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Automations that run your business for you
        </h2>
        <p className="mt-4 text-muted-foreground">
          Set up IF/THEN rules once — no coding required — and let NovaCRM handle
          the busywork.
        </p>
      </div>

      <Card className="p-8">
        <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border border-border/60 bg-muted/40 px-6 py-5 lg:w-56 lg:shrink-0"
          >
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              If
            </p>
            <p className="mt-1 font-medium">New lead arrives</p>
          </motion.div>

          <ArrowRight className="mx-auto size-5 shrink-0 rotate-90 text-muted-foreground lg:rotate-0" />

          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {actions.map((action, i) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                className="flex flex-col items-center gap-2 rounded-xl border border-border/60 px-4 py-5 text-center"
              >
                <action.icon className="size-5 text-primary" />
                <p className="text-sm font-medium">{action.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}
