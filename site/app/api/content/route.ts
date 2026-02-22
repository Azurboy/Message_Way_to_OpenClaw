import { NextRequest, NextResponse } from "next/server";
import { getArticleContent } from "@/lib/content";
import { logApiCall } from "@/lib/api-logger";

const MAX_BATCH = 10;

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids");

  if (!idsParam) {
    logApiCall(request, "/api/content", "GET", 400, null);
    return NextResponse.json(
      { error: "Missing ids", message: "Provide ?ids=id1,id2,id3" },
      { status: 400 }
    );
  }

  const ids = idsParam.split(",").filter(Boolean);

  if (ids.length === 0) {
    logApiCall(request, "/api/content", "GET", 400, null);
    return NextResponse.json(
      { error: "Empty ids list" },
      { status: 400 }
    );
  }

  if (ids.length > MAX_BATCH) {
    logApiCall(request, "/api/content", "GET", 400, null);
    return NextResponse.json(
      { error: `Too many ids. Maximum ${MAX_BATCH} per request.` },
      { status: 400 }
    );
  }

  // Validate all ids are hex strings
  const invalid = ids.find((id) => !/^[a-f0-9]+$/i.test(id));
  if (invalid) {
    logApiCall(request, "/api/content", "GET", 400, null);
    return NextResponse.json(
      { error: `Invalid article ID: ${invalid}` },
      { status: 400 }
    );
  }

  const results = ids.map((id) => {
    const content = getArticleContent(id);
    return content ?? { id, error: "not_found" };
  });

  logApiCall(request, "/api/content", "GET", 200, null);
  return NextResponse.json({ articles: results });
}
