import type { SupabaseClient } from "@supabase/supabase-js";
import { getFeedsData } from "@/lib/content";

export interface FeedItem {
  type: "default" | "custom";
  id: string; // xml_url for defaults, uuid for custom
  feed_url: string;
  feed_title: string | null;
  html_url?: string;
  category?: string;
}

/**
 * List all feeds for a user: preset feeds (minus hidden) + custom feeds.
 */
export async function listFeeds(
  supabase: SupabaseClient,
  userId: string
): Promise<FeedItem[]> {
  const [hiddenRes, customRes] = await Promise.all([
    supabase
      .from("user_hidden_defaults")
      .select("feed_xml_url")
      .eq("user_id", userId),
    supabase
      .from("user_feeds")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const hiddenUrls = new Set(
    (hiddenRes.data ?? []).map((r: { feed_xml_url: string }) => r.feed_xml_url)
  );

  const feedsData = getFeedsData();
  const presetItems: FeedItem[] = (feedsData?.feeds ?? [])
    .filter((f) => !hiddenUrls.has(f.xml_url))
    .map((f) => ({
      type: "default" as const,
      id: f.xml_url,
      feed_url: f.xml_url,
      feed_title: f.title,
      html_url: f.html_url,
      category: f.category,
    }));

  const customItems: FeedItem[] = (customRes.data ?? []).map(
    (f: { id: string; feed_url: string; feed_title: string | null }) => ({
      type: "custom" as const,
      id: f.id,
      feed_url: f.feed_url,
      feed_title: f.feed_title,
    })
  );

  return [...presetItems, ...customItems];
}

/**
 * Add a feed for a user. If it's a hidden preset, unhide it instead.
 */
export async function addFeed(
  supabase: SupabaseClient,
  userId: string,
  feedUrl: string,
  feedTitle?: string
): Promise<{ data: FeedItem | null; error: string | null; status: number }> {
  const trimmedUrl = feedUrl.trim();

  // Check if this URL is a hidden preset — if so, just unhide it
  const feedsData = getFeedsData();
  const preset = feedsData?.feeds?.find((f) => f.xml_url === trimmedUrl);

  if (preset) {
    await supabase
      .from("user_hidden_defaults")
      .delete()
      .eq("user_id", userId)
      .eq("feed_xml_url", trimmedUrl);

    return {
      data: {
        type: "default",
        id: preset.xml_url,
        feed_url: preset.xml_url,
        feed_title: preset.title,
        html_url: preset.html_url,
        category: preset.category,
      },
      error: null,
      status: 201,
    };
  }

  // Check custom feed count limit (200)
  const { count } = await supabase
    .from("user_feeds")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) >= 200) {
    return { data: null, error: "最多添加 200 个自定义源", status: 400 };
  }

  const { data, error } = await supabase
    .from("user_feeds")
    .insert({
      user_id: userId,
      feed_url: trimmedUrl,
      feed_title: feedTitle || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: "此 RSS 源已存在", status: 409 };
    }
    return { data: null, error: error.message, status: 500 };
  }

  return {
    data: {
      type: "custom",
      id: data.id,
      feed_url: data.feed_url,
      feed_title: data.feed_title,
    },
    error: null,
    status: 201,
  };
}

/**
 * Remove (or hide) a feed for a user.
 */
export async function removeFeed(
  supabase: SupabaseClient,
  userId: string,
  type: string,
  id: string
): Promise<{ error: string | null; status: number }> {
  if (type === "default") {
    const { error } = await supabase
      .from("user_hidden_defaults")
      .upsert(
        { user_id: userId, feed_xml_url: id },
        { onConflict: "user_id,feed_xml_url" }
      );

    if (error) {
      return { error: error.message, status: 500 };
    }
  } else {
    const { error } = await supabase
      .from("user_feeds")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return { error: error.message, status: 500 };
    }
  }

  return { error: null, status: 200 };
}
