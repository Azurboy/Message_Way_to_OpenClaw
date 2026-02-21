import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import { listFeeds, addFeed, removeFeed } from "@/lib/feeds-manager";
import { logApiCall } from "@/lib/api-logger";

/**
 * Authenticate via token query param. Returns user_id or error response.
 */
async function authenticateToken(
  request: NextRequest
): Promise<{ userId: string } | NextResponse> {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Missing token", message: "Provide ?token=YOUR_API_TOKEN" },
      { status: 401 }
    );
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("api_token", token)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 }
    );
  }

  return { userId: data.id };
}

export async function GET(request: NextRequest) {
  const auth = await authenticateToken(request);
  if (auth instanceof NextResponse) {
    logApiCall(request, "/api/agent/feeds", "GET", auth.status, null);
    return auth;
  }

  const supabase = getServiceClient();
  const feeds = await listFeeds(supabase, auth.userId);

  logApiCall(request, "/api/agent/feeds", "GET", 200, auth.userId);
  return NextResponse.json(feeds);
}

export async function POST(request: NextRequest) {
  const auth = await authenticateToken(request);
  if (auth instanceof NextResponse) {
    logApiCall(request, "/api/agent/feeds", "POST", auth.status, null);
    return auth;
  }

  let body: { feed_url?: string; feed_title?: string };
  try {
    body = await request.json();
  } catch {
    logApiCall(request, "/api/agent/feeds", "POST", 400, auth.userId);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { feed_url, feed_title } = body;

  if (!feed_url || typeof feed_url !== "string") {
    logApiCall(request, "/api/agent/feeds", "POST", 400, auth.userId);
    return NextResponse.json(
      { error: "feed_url is required" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();
  const result = await addFeed(supabase, auth.userId, feed_url, feed_title);

  if (result.error) {
    logApiCall(request, "/api/agent/feeds", "POST", result.status, auth.userId);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  logApiCall(request, "/api/agent/feeds", "POST", 201, auth.userId);
  return NextResponse.json(result.data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticateToken(request);
  if (auth instanceof NextResponse) {
    logApiCall(request, "/api/agent/feeds", "DELETE", auth.status, null);
    return auth;
  }

  let body: { type?: string; id?: string };
  try {
    body = await request.json();
  } catch {
    logApiCall(request, "/api/agent/feeds", "DELETE", 400, auth.userId);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, id } = body;

  if (!id) {
    logApiCall(request, "/api/agent/feeds", "DELETE", 400, auth.userId);
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const result = await removeFeed(supabase, auth.userId, type || "custom", id);

  if (result.error) {
    logApiCall(request, "/api/agent/feeds", "DELETE", result.status, auth.userId);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  logApiCall(request, "/api/agent/feeds", "DELETE", 200, auth.userId);
  return NextResponse.json({ ok: true });
}
