import { NextRequest, NextResponse } from "next/server";
import { readdirSync } from "fs";
import { join } from "path";
import { getArticlesByDate } from "@/lib/content";

const ARTICLES_DIR = join(process.cwd(), "content", "articles");
const MAX_RESULTS = 50;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json(
      { error: "Query too short", message: "Provide ?q=keyword (min 2 chars)" },
      { status: 400 }
    );
  }

  const query = q.trim().toLowerCase();

  // Get all date files
  let dateFiles: string[];
  try {
    dateFiles = readdirSync(ARTICLES_DIR)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort()
      .reverse(); // newest first
  } catch {
    return NextResponse.json({ results: [], query: q });
  }

  const results: {
    id: string;
    title: string;
    url: string;
    feed_title: string;
    summary_zh: string;
    tags: string[];
    date: string;
  }[] = [];

  for (const file of dateFiles) {
    if (results.length >= MAX_RESULTS) break;

    const date = file.replace(".json", "");
    const data = getArticlesByDate(date);
    if (!data) continue;

    for (const article of data.articles) {
      if (results.length >= MAX_RESULTS) break;

      const match =
        article.title.toLowerCase().includes(query) ||
        article.summary_zh.toLowerCase().includes(query) ||
        article.feed_title.toLowerCase().includes(query) ||
        article.author.toLowerCase().includes(query) ||
        article.tags.some((t) => t.toLowerCase().includes(query));

      if (match) {
        results.push({
          id: article.id,
          title: article.title,
          url: article.url,
          feed_title: article.feed_title,
          summary_zh: article.summary_zh,
          tags: article.tags,
          date,
        });
      }
    }
  }

  return NextResponse.json({ results, query: q, count: results.length });
}
