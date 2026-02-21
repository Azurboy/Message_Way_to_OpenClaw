import { NextRequest, NextResponse } from "next/server";
import { getArticleContent } from "@/lib/content";
import { logApiCall } from "@/lib/api-logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate id format (hex string)
  if (!/^[a-f0-9]+$/i.test(id)) {
    logApiCall(request, `/api/content/${id}`, "GET", 400, null);
    return NextResponse.json({ error: "Invalid article ID" }, { status: 400 });
  }

  const content = getArticleContent(id);
  if (!content) {
    logApiCall(request, `/api/content/${id}`, "GET", 404, null);
    return NextResponse.json({ error: "Article content not found" }, { status: 404 });
  }

  logApiCall(request, `/api/content/${id}`, "GET", 200, null);
  return NextResponse.json(content);
}
