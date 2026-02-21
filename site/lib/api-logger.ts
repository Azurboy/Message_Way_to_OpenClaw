import type { NextRequest } from "next/server";

const AGENT_UA_MAP: [RegExp, string][] = [
  [/GPTBot|ChatGPT-User|OAI-SearchBot/i, "ChatGPT"],
  [/Claude-Web|ClaudeBot|anthropic-ai/i, "Claude"],
  [/PerplexityBot|Perplexity/i, "Perplexity"],
  [/Google-Extended|Googlebot/i, "Google"],
  [/Bytespider/i, "ByteDance"],
  [/CCBot|cohere-ai/i, "Cohere"],
  [/Amazonbot/i, "Amazon"],
  [/YouBot/i, "You.com"],
  [/Diffbot/i, "Diffbot"],
  [/Applebot/i, "Apple"],
];

function parseAgentName(ua: string): string | null {
  for (const [pattern, name] of AGENT_UA_MAP) {
    if (pattern.test(ua)) return name;
  }
  return null;
}

/**
 * Log an API call to the api_logs table. Fire-and-forget (non-blocking).
 */
export function logApiCall(
  request: NextRequest,
  endpoint: string,
  method: string,
  statusCode: number,
  tokenOwnerId: string | null
): void {
  // Async, non-blocking — errors are silently ignored
  void doLog(request, endpoint, method, statusCode, tokenOwnerId);
}

async function doLog(
  request: NextRequest,
  endpoint: string,
  method: string,
  statusCode: number,
  tokenOwnerId: string | null
): Promise<void> {
  try {
    // Dynamic import to avoid importing service client in modules that don't need it
    const { getServiceClient } = await import("@/lib/supabase/service");
    const supabase = getServiceClient();

    const ua = request.headers.get("user-agent") ?? "";
    const agentName = parseAgentName(ua);

    // Collect query params but strip token for security
    const params: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      if (key !== "token") {
        params[key] = value;
      }
    });

    await supabase.from("api_logs").insert({
      endpoint,
      method,
      user_agent: ua.slice(0, 500),
      agent_name: agentName,
      token_owner_id: tokenOwnerId,
      query_params: Object.keys(params).length > 0 ? params : null,
      status_code: statusCode,
    });
  } catch {
    // Non-blocking — silently ignore logging failures
  }
}
