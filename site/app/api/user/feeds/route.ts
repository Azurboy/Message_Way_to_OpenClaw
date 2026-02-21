import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listFeeds, addFeed, removeFeed } from "@/lib/feeds-manager";

// Re-export the type so existing imports still work
export type { FeedItem } from "@/lib/feeds-manager";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feeds = await listFeeds(supabase, user.id);
  return NextResponse.json(feeds);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { feed_url, feed_title } = body;

  if (!feed_url || typeof feed_url !== "string") {
    return NextResponse.json(
      { error: "feed_url is required" },
      { status: 400 }
    );
  }

  const result = await addFeed(supabase, user.id, feed_url, feed_title);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, id } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const result = await removeFeed(supabase, user.id, type, id);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
