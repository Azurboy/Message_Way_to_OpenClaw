import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";

export async function GET() {
  // Auth check via session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = getServiceClient();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [todayRes, weekRes, monthRes, byAgentRes, byEndpointRes, recentRes] =
    await Promise.all([
      service
        .from("api_logs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStart),
      service
        .from("api_logs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekStart),
      service
        .from("api_logs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", monthStart),
      service.rpc("count_by_agent", { since: weekStart }).select(),
      service.rpc("count_by_endpoint", { since: weekStart }).select(),
      service
        .from("api_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  return NextResponse.json({
    counts: {
      today: todayRes.count ?? 0,
      week: weekRes.count ?? 0,
      month: monthRes.count ?? 0,
    },
    by_agent: byAgentRes.data ?? [],
    by_endpoint: byEndpointRes.data ?? [],
    recent: recentRes.data ?? [],
  });
}
