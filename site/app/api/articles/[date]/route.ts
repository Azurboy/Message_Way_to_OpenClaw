import { NextRequest, NextResponse } from "next/server";
import { getArticlesByDate, getArticlesByTags } from "@/lib/content";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const data = getArticlesByDate(date);
  if (!data) {
    return NextResponse.json({ error: "Articles not found" }, { status: 404 });
  }

  const tagsParam = request.nextUrl.searchParams.get("tags");
  if (tagsParam) {
    const tags = tagsParam.split(",").map((t) => t.trim()).filter(Boolean);
    const filtered = getArticlesByTags(data, tags);
    return NextResponse.json({
      ...data,
      articles: filtered,
      article_count: filtered.length,
    });
  }

  return NextResponse.json(data);
}
