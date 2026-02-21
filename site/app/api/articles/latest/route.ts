import { NextRequest, NextResponse } from "next/server";
import { getLatestArticles, getArticlesByTags } from "@/lib/content";
import { logApiCall } from "@/lib/api-logger";

export async function GET(request: NextRequest) {
  const data = getLatestArticles();
  if (!data) {
    logApiCall(request, "/api/articles/latest", "GET", 404, null);
    return NextResponse.json({ error: "No articles available" }, { status: 404 });
  }

  const tagsParam = request.nextUrl.searchParams.get("tags");
  if (tagsParam) {
    const tags = tagsParam.split(",").map((t) => t.trim()).filter(Boolean);
    const filtered = getArticlesByTags(data, tags);
    logApiCall(request, "/api/articles/latest", "GET", 200, null);
    return NextResponse.json({
      ...data,
      articles: filtered,
      article_count: filtered.length,
    });
  }

  logApiCall(request, "/api/articles/latest", "GET", 200, null);
  return NextResponse.json(data);
}
