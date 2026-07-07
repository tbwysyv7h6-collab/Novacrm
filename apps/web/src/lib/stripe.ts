import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not set. Add it to your environment to enable billing.");
  }
  stripeClient ??= new Stripe(apiKey);
  return stripeClient;
}

export const PLAN_PRICE_ENV_KEYS = {
  STARTER: "STRIPE_PRICE_STARTER",
  PRO: "STRIPE_PRICE_PRO",
  BUSINESS: "STRIPE_PRICE_BUSINESS",
} as const;

export type PaidPlan = keyof typeof PLAN_PRICE_ENV_KEYS;

export function getPriceId(plan: PaidPlan): string {
  const priceId = process.env[PLAN_PRICE_ENV_KEYS[plan]];
  if (!priceId) {
    throw new Error(
      `${PLAN_PRICE_ENV_KEYS[plan]} is not set. Add your Stripe price ID for the ${plan} plan.`,
    );
  }
  return priceId;
}

export function planFromPriceId(priceId: string): PaidPlan | null {
  for (const plan of Object.keys(PLAN_PRICE_ENV_KEYS) as PaidPlan[]) {
    if (process.env[PLAN_PRICE_ENV_KEYS[plan]] === priceId) return plan;
  }
  return null;
}
