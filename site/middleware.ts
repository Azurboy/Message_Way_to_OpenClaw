import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// --- Agent detection: redirect AI bots from HTML pages to /SKILL.md ---

const AI_BOT_PATTERNS = [
  /GPTBot/i, /ChatGPT-User/i, /OAI-SearchBot/i,
  /Claude-Web/i, /anthropic-ai/i, /ClaudeBot/i,
  /PerplexityBot/i, /Perplexity/i,
  /Google-Extended/i, /Bytespider/i,
  /CCBot/i, /cohere-ai/i, /Amazonbot/i,
  /YouBot/i, /Diffbot/i, /Applebot-Extended/i,
];

function isLikelyAgent(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent") ?? "";
  const secFetchMode = request.headers.get("sec-fetch-mode");
  const secFetchDest = request.headers.get("sec-fetch-dest");
  const accept = request.headers.get("accept") ?? "";

  let score = 0;

  // Known AI bot UA → definitive
  if (AI_BOT_PATTERNS.some((p) => p.test(ua))) score += 100;

  // Missing Sec-Fetch-Mode — modern browsers always send it on navigation
  if (!secFetchMode) score += 40;

  // Programmatic fetch modes
  if (secFetchMode === "cors" || secFetchMode === "no-cors") score += 30;

  // Generic accept header — browsers include text/html
  if (accept === "*/*" || accept === "") score += 20;

  // --- Negative signals (browser navigation) ---
  if (secFetchMode === "navigate") score -= 100;
  if (secFetchDest === "document") score -= 50;
  if (accept.includes("text/html")) score -= 10;

  return score >= 40;
}

function shouldInterceptForAgent(pathname: string): boolean {
  if (pathname === "/") return true;
  const prefixes = ["/home", "/about", "/feeds", "/archive", "/favorites", "/article/", "/articles/"];
  return prefixes.some((p) => pathname.startsWith(p));
}

// --- Existing API gate ---

// The passphrase is only documented in /SKILL.md — forces agents to read it
const SKILL_ACK_PARAM = "ack";
const SKILL_ACK_VALUE = "xinqidong";

// Paths that require the ?ack=xinqidong query parameter (agent-gated)
const GATED_PREFIXES = ["/api/articles", "/api/content", "/llms-full.txt"];

// Paths that additionally require a rationale parameter (cognitive lock)
// Note: /api/content does NOT require rationale - it's for Phase 2 deep reading
const RATIONALE_REQUIRED_PREFIXES = ["/api/articles"];

function isGatedPath(pathname: string): boolean {
  return GATED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function requiresRationale(pathname: string): boolean {
  return RATIONALE_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Agent interception: redirect likely AI agents from HTML pages to /SKILL.md
  if (
    !request.nextUrl.searchParams.has("human") &&
    shouldInterceptForAgent(pathname) &&
    isLikelyAgent(request)
  ) {
    return NextResponse.redirect(new URL("/SKILL.md", request.url));
  }

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

    // Cognitive lock: require rationale for article requests
    if (requiresRationale(pathname)) {
      const rationale = request.nextUrl.searchParams.get("rationale");
      if (!rationale || rationale.trim().length < 5) {
        return NextResponse.json(
          {
            error: "Rationale required",
            message:
              "You must provide a 'rationale' query parameter explaining WHY you chose these tags based on user context. " +
              "Example: ?tags=AI,devops&ack=xinqidong&rationale=user_debugging_kubernetes_deployment. " +
              "This ensures you have analyzed the user's context before requesting articles.",
            skill_url: "/SKILL.md",
            example: "/api/articles/latest?tags=AI&ack=xinqidong&rationale=user_working_on_llm_agents",
          },
          { status: 400 }
        );
      }
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
