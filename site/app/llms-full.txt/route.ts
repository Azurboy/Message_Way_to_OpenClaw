import { NextResponse } from "next/server";
import { getLatestDigest, getDigestMarkdown } from "@/lib/content";

export async function GET() {
  const digest = getLatestDigest();
  if (!digest) {
    return new NextResponse("No digest available yet.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const md = getDigestMarkdown(digest.date);
  const content = md ?? `# 新启动 Daily - ${digest.date}\n\n${digest.summary_md}`;

  return new NextResponse(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
