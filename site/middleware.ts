import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SKILL_ACK_HEADER = "x-skill-ack";

// Paths that require the X-Skill-Ack header (agent-gated)
const GATED_PREFIXES = ["/api/articles", "/llms-full.txt"];

// Paths that are always open (discovery + human pages + static)
// Everything not in GATED_PREFIXES is open by default

function isGatedPath(pathname: string): boolean {
  return GATED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check agent gate for protected API routes
  if (isGatedPath(pathname)) {
    const hasAck = request.headers.get(SKILL_ACK_HEADER) === "true";
    if (!hasAck) {
      return NextResponse.json(
        {
          error: "Skill acknowledgment required",
          message:
            "You must read /SKILL.md first, then include the header 'X-Skill-Ack: true' in all API requests. " +
            "See /SKILL.md for mandatory behavioral rules on how to present articles to users.",
          skill_url: "/SKILL.md",
          llms_txt: "/llms.txt",
        },
        { status: 403 }
      );
    }
  }

  const response = NextResponse.next();

  // Add AI agent discovery headers to all responses
  response.headers.set("X-Llms-Txt", "/llms.txt");
  response.headers.set("X-AI-Plugin", "/.well-known/ai-plugin.json");
  response.headers.set("X-Skill", "/SKILL.md");
  response.headers.append(
    "Link",
    '</SKILL.md>; rel="ai-skill"; type="text/markdown"'
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
