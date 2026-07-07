const audiences = [
  "Window cleaners",
  "Plumbers",
  "Electricians",
  "Landscapers",
  "Estate agents",
  "Marketing agencies",
  "Cleaning companies",
  "Construction firms",
  "Freelancers",
  "Sales teams",
];

export function AudienceStrip() {
  return (
    <section className="border-y border-border/60 bg-muted/30 py-8">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-5 text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Built for every kind of service business
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {audiences.map((name) => (
            <span key={name} className="text-sm font-medium text-muted-foreground/80">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
