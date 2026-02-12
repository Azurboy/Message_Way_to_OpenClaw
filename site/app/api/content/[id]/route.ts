import { NextRequest, NextResponse } from "next/server";
import { getArticleContent } from "@/lib/content";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate id format (hex string)
  if (!/^[a-f0-9]+$/i.test(id)) {
    return NextResponse.json({ error: "Invalid article ID" }, { status: 400 });
  }

  const content = getArticleContent(id);
  if (!content) {
    return NextResponse.json({ error: "Article content not found" }, { status: 404 });
  }

  return NextResponse.json(content);
}
