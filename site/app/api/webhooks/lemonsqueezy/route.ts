import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// LemonSqueezy sends webhook events for subscription changes.
// We verify the signature and update the user's tier accordingly.

export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Verify HMAC signature
  const signature = request.headers.get("x-signature");
  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 401 });
  }

  const rawBody = await request.text();

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computed !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventName: string = payload.meta?.event_name ?? "";
  const customData = payload.meta?.custom_data ?? {};
  const userId: string | undefined = customData.user_id;

  if (!userId) {
    // No user_id in custom data — can't associate subscription
    return NextResponse.json({ ok: true, skipped: "no user_id" });
  }

  const subscriptionId: string =
    payload.data?.id?.toString() ?? "";
  const status: string =
    payload.data?.attributes?.status ?? "";

  const supabase = await createClient();

  // Map LemonSqueezy events to tier changes
  if (
    eventName === "subscription_created" ||
    eventName === "subscription_resumed" ||
    eventName === "subscription_updated"
  ) {
    const isActive = status === "active" || status === "on_trial";
    await supabase
      .from("profiles")
      .update({
        tier: isActive ? "pro" : "free",
        subscription_id: subscriptionId,
        subscription_status: status,
      })
      .eq("id", userId);
  } else if (
    eventName === "subscription_cancelled" ||
    eventName === "subscription_expired"
  ) {
    await supabase
      .from("profiles")
      .update({
        tier: "free",
        subscription_id: subscriptionId,
        subscription_status: status,
      })
      .eq("id", userId);
  } else if (eventName === "subscription_payment_success") {
    // Just ensure they're pro
    await supabase
      .from("profiles")
      .update({
        tier: "pro",
        subscription_id: subscriptionId,
        subscription_status: "active",
      })
      .eq("id", userId);
  }

  return NextResponse.json({ ok: true, event: eventName });
}
