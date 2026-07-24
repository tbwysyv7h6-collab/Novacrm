# ValensCRM

The easiest CRM builder in the world. Build a fully custom CRM with drag-and-drop, or describe your business and let AI build it for you.

## Stack

- **Web app**: Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, dnd-kit
- **API**: tRPC + TanStack Query
- **Database**: PostgreSQL via Prisma — a dynamic object/field/record engine powers user-defined CRMs
- **Auth**: Auth.js (email/password, Google, Microsoft)
- **AI**: Claude (Anthropic) for the AI CRM Builder
- **Billing**: Stripe subscriptions
- **Monorepo**: Turborepo + pnpm workspaces (`apps/web`, `packages/db`)

## Getting started

### Prerequisites

- Node 20+, pnpm, a PostgreSQL database (local via Homebrew/Docker, or hosted via Neon/Supabase)

### Setup

```bash
pnpm install
cp .env.example apps/web/.env
cp packages/db/.env.example packages/db/.env
# fill in DATABASE_URL at minimum
pnpm --filter @novacrm/db db:push
pnpm dev
```

The app runs at http://localhost:3000.

### Environment variables

See `.env.example` for the full list. Only `DATABASE_URL` and `AUTH_SECRET` are required to run the app locally. Everything else unlocks optional functionality and degrades gracefully with a clear error message when unset:

| Feature | Required vars |
|---|---|
| Google/Microsoft sign-in | `GOOGLE_CLIENT_ID`/`SECRET`, `MICROSOFT_CLIENT_ID`/`SECRET` |
| AI CRM Builder | `ANTHROPIC_API_KEY` |
| Stripe billing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`/`PRO`/`BUSINESS` |
| Password reset / automation emails | none yet — see `apps/web/src/lib/mail.ts` (logs to console; swap in Resend/Postmark/SES before launch) |

### Useful scripts

```bash
pnpm dev              # run the web app
pnpm build             # build everything
pnpm lint              # lint everything
pnpm typecheck         # typecheck everything
pnpm test              # run unit tests (Vitest)
pnpm --filter @novacrm/db db:studio   # browse the database
```

## Architecture notes

- **Dynamic object engine** (`packages/db/prisma/schema.prisma`): `CrmObject`/`CrmField`/`CrmRecord`/`CrmView` let every tenant define their own tables and columns without a schema migration. Record data lives in a `Json` column keyed by field `apiName`.
- **Multi-tenancy**: every dynamic-engine row is scoped to an `Organization`; `Membership` links users to organizations with a role (`OWNER`/`ADMIN`/`MEMBER`/`VIEWER`).
- **Automations** (`apps/web/src/server/automations/run.ts`): run synchronously inside the record create/update mutation. Fine at small scale — swap in a durable queue (Inngest/Trigger.dev) before automations need retries or delays.
- **Integrations** (`apps/web/src/lib/integrations.ts`, `apps/web/src/server/routers/webhook.ts`): outbound webhooks are the first real connector; add new ones by extending the registry and wiring a handler alongside `dispatchWebhooks`.

## Deploying

1. Push to GitHub, import into Vercel.
2. Provision Postgres (Neon/Supabase) and set `DATABASE_URL`.
3. Set `NEXT_PUBLIC_SITE_URL` to your production domain (used for OG tags, sitemap, Stripe redirect URLs).
4. Add the OAuth/Stripe/Anthropic env vars for the features you want live.
5. Point your Stripe webhook endpoint at `https://<domain>/api/webhooks/stripe`.
