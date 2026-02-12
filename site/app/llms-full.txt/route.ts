import { NextResponse } from "next/server";
import { getLatestArticles } from "@/lib/content";

export async function GET() {
  const data = getLatestArticles();
  if (!data) {
    return new NextResponse("No articles available yet.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  let md = `# DailyBit - ${data.date}\n\n`;
  md += `${data.article_count} 篇文章 · AI Model: ${data.ai_model}\n\n`;

  for (const article of data.articles) {
    md += `## ${article.title}\n`;
    md += `- 来源: ${article.feed_title}`;
    if (article.author) md += ` · ${article.author}`;
    md += `\n`;
    md += `- 链接: ${article.url}\n`;
    md += `- 标签: ${article.tags.join(", ")}\n`;
    md += `\n${article.summary_zh}\n\n---\n\n`;
  }

  return new NextResponse(md, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
