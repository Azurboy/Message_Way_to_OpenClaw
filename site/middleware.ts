import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add AI agent discovery headers to all responses
  response.headers.set("X-Llms-Txt", "/llms.txt");
  response.headers.set("X-AI-Plugin", "/.well-known/ai-plugin.json");
  response.headers.set("X-Skill", "/SKILL.md");

  // Add Link headers (RFC 8288) for machine-readable discovery
  response.headers.append(
    "Link",
    '</llms.txt>; rel="ai-discovery"; type="text/plain"'
  );
  response.headers.append(
    "Link",
    '</SKILL.md>; rel="ai-skill"; type="text/markdown"'
  );
  response.headers.append(
    "Link",
    '</api/articles/latest>; rel="alternate"; type="application/json"'
  );

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static files and _next internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
