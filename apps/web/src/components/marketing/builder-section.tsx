"use client";

import { motion } from "motion/react";
import {
  Layers,
  Link2,
  Palette,
  LayoutDashboard,
  FileText,
  Workflow,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Layers,
    title: "Custom objects & fields",
    description: "Model Contacts, Jobs, Properties, or anything else — your data, your shape.",
  },
  {
    icon: Link2,
    title: "Link databases together",
    description: "Relate Contacts to Companies, Jobs to Invoices, with drag-and-drop relations.",
  },
  {
    icon: Palette,
    title: "Colours, logos, branding",
    description: "Match your CRM to your business in a few clicks.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboards & reports",
    description: "Revenue, jobs completed, conversion rate — build the view you need.",
  },
  {
    icon: FileText,
    title: "Forms & pipelines",
    description: "Capture leads and move deals through stages you define.",
  },
  {
    icon: Workflow,
    title: "Workflows that update instantly",
    description: "Rearrange fields, add sections, and see changes live — no save button.",
  },
];

export function BuilderSection() {
  return (
    <section id="builder" className="border-t border-border/60 bg-muted/20 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Build your CRM like building a document
          </h2>
          <p className="mt-4 text-muted-foreground">
            Drag, drop, and rearrange — every table, field, and view updates
            instantly. No developers required.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className="h-full p-6">
                <feature.icon className="size-5 text-primary" />
                <h3 className="mt-4 font-medium">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
