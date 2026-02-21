import { createClient } from "@/lib/supabase/server";

export type Tier = "free" | "pro";

export interface SubscriptionInfo {
  tier: Tier;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
}

export async function getUserSubscription(userId: string): Promise<SubscriptionInfo> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("tier, subscription_id, subscription_status")
    .eq("id", userId)
    .single();

  return {
    tier: (data?.tier as Tier) || "free",
    subscriptionId: data?.subscription_id || null,
    subscriptionStatus: data?.subscription_status || null,
  };
}

export function isPro(tier: string): boolean {
  return tier === "pro";
}

/**
 * Get the LemonSqueezy checkout URL.
 * Set LEMONSQUEEZY_CHECKOUT_URL in your env vars.
 * You can append ?checkout[custom][user_id]=xxx to link to your user.
 */
export function getCheckoutUrl(userId: string): string {
  const base = process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL || "#";
  if (base === "#") return base;

  const url = new URL(base);
  url.searchParams.set("checkout[custom][user_id]", userId);
  return url.toString();
}
