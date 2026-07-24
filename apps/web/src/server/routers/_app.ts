import { router } from "../trpc";
import { organizationRouter } from "./organization";
import { objectRouter } from "./object";
import { fieldRouter } from "./field";
import { recordRouter } from "./record";
import { viewRouter } from "./view";
import { automationRouter } from "./automation";
import { aiRouter } from "./ai";
import { billingRouter } from "./billing";
import { webhookRouter } from "./webhook";
import { invoiceRouter } from "./invoice";

export const appRouter = router({
  organization: organizationRouter,
  object: objectRouter,
  field: fieldRouter,
  record: recordRouter,
  view: viewRouter,
  automation: automationRouter,
  ai: aiRouter,
  billing: billingRouter,
  webhook: webhookRouter,
  invoice: invoiceRouter,
});

export type AppRouter = typeof appRouter;
