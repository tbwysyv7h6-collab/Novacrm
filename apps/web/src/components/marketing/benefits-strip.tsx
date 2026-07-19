"use client";

import { motion } from "motion/react";
import { Clock, PoundSterling, Zap } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    stat: "5+ hrs/week",
    label: "Saved on admin and spreadsheet busywork",
  },
  {
    icon: Zap,
    stat: "10 minutes",
    label: "From sign-up to a working CRM built around your business",
  },
  {
    icon: PoundSterling,
    stat: "From £19/mo",
    label: "A fraction of what legacy CRM software costs — no setup fees",
  },
];

export function BenefitsStrip() {
  return (
    <section className="border-y border-border/60 py-14">
      <div className="mx-auto grid max-w-5xl gap-8 px-6 sm:grid-cols-3">
        {benefits.map((benefit, i) => (
          <motion.div
            key={benefit.stat}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="flex flex-col items-center gap-2 text-center"
          >
            <benefit.icon className="size-5 text-primary" />
            <p className="text-2xl font-semibold tracking-tight">{benefit.stat}</p>
            <p className="text-sm text-muted-foreground">{benefit.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
