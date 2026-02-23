import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

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
  // Next.js RSC client-side navigation — definitely a browser, never an agent
  if (request.headers.get("rsc") || request.headers.get("next-router-state-tree")) {
    return false;
  }

  const ua = request.headers.get("user-agent") ?? "";
  const secFetchMode = request.headers.get("sec-fetch-mode");
  const secFetchDest = request.headers.get("sec-fetch-dest");
  const secFetchSite = request.headers.get("sec-fetch-site");
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
  // same-origin fetch = browser JS on the same site (e.g. Next.js client nav)
  if (secFetchSite === "same-origin") score -= 60;
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
const GATED_PREFIXES = ["/api/articles", "/api/content", "/api/agent", "/llms-full.txt"];

// Paths that additionally require rationale + pstate (cognitive lock)
// Note: /api/content does NOT require these - it's for Phase 2 deep reading
const RATIONALE_REQUIRED_PREFIXES = ["/api/articles"];

const VALID_PSTATES = ["has_token", "no_token", "anonymous"];

function isGatedPath(pathname: string): boolean {
  return GATED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function requiresRationale(pathname: string): boolean {
  return RATIONALE_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// Paths that need Supabase session refresh (auth-aware pages)
const AUTH_PREFIXES = [
  "/dashboard",
  "/auth",
  "/feeds",
  "/favorites",
  "/api/user",
  "/api/webhooks",
  "/article/",
  "/pricing",
];

function needsAuth(pathname: string): boolean {
  return AUTH_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
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
        },
        { status: 403 }
      );
    }

    // Cognitive lock: require rationale + pstate for article requests
    if (requiresRationale(pathname)) {
      const rationale = request.nextUrl.searchParams.get("rationale");
      if (!rationale || rationale.trim().length < 5) {
        return NextResponse.json(
          {
            error: "Rationale required",
            message:
              "You must provide a 'rationale' query parameter explaining WHY you chose these tags based on user context. " +
              "Example: ?tags=AI,devops&ack=xinqidong&rationale=user_debugging_kubernetes_deployment&pstate=no_token",
            skill_url: "/SKILL.md",
          },
          { status: 400 }
        );
      }

      const pstate = request.nextUrl.searchParams.get("pstate");
      if (!pstate || !VALID_PSTATES.includes(pstate)) {
        return NextResponse.json(
          {
            error: "pstate required",
            message:
              "You must provide a 'pstate' query parameter declaring the user's auth state. " +
              "Valid values: has_token, no_token, anonymous. Read /SKILL.md for details.",
            skill_url: "/SKILL.md",
          },
          { status: 400 }
        );
      }

      // Consistency check: has_token must come with an actual token
      if (pstate === "has_token" && !request.nextUrl.searchParams.get("token")) {
        return NextResponse.json(
          {
            error: "Token missing",
            message:
              "pstate=has_token requires a 'token' parameter. " +
              "If you don't have the user's token, use pstate=no_token or pstate=anonymous.",
            skill_url: "/SKILL.md",
          },
          { status: 400 }
        );
      }
    }
  }

  // Only refresh Supabase session on auth-aware routes (avoids unnecessary
  // network calls that cause AbortError on Turbopack dev server)
  let response: NextResponse;
  if (needsAuth(pathname)) {
    response = await updateSession(request);
  } else {
    response = NextResponse.next({ request });
  }

  // Add AI agent discovery headers to all responses
  response.headers.set("X-Skill", "/SKILL.md");
  response.headers.append(
    "Link",
    '</SKILL.md>; rel="ai-skill"; type="text/markdown"'
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|robots.txt|sitemap.xml|SKILL\\.md|llms\\.txt|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)).*)",
  ],
};
