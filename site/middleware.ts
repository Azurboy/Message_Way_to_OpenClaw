import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The passphrase is only documented in /SKILL.md — forces agents to read it
const SKILL_ACK_PARAM = "ack";
const SKILL_ACK_VALUE = "xinqidong";

// Paths that require the ?ack=xinqidong query parameter (agent-gated)
const GATED_PREFIXES = ["/api/articles", "/llms-full.txt"];

function isGatedPath(pathname: string): boolean {
  return GATED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check agent gate for protected API routes
  if (isGatedPath(pathname)) {
    const ackValue = request.nextUrl.searchParams.get(SKILL_ACK_PARAM);
    if (ackValue !== SKILL_ACK_VALUE) {
      return NextResponse.json(
        {
          error: "Skill acknowledgment required",
          message:
            "You must read /SKILL.md first. All API requests require the query parameter ?ack=<passphrase>. " +
            "The passphrase is documented in /SKILL.md. Fetch /SKILL.md to learn the access method and mandatory behavioral rules.",
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
