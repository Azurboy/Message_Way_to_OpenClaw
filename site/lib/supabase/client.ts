import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a stub that won't crash but won't do anything
    // This allows the app to work without Supabase configured
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithOtp: async () => ({ data: null, error: null }),
        signInWithOAuth: async () => ({ data: { url: null, provider: "github" as const }, error: null }),
        signOut: async () => ({ error: null }),
        exchangeCodeForSession: async () => ({ data: { user: null, session: null }, error: null }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ order: () => ({ then: (fn: (v: { data: null }) => void) => fn({ data: null }) }), then: (fn: (v: { data: null }) => void) => fn({ data: null }) }), then: (fn: (v: { data: null }) => void) => fn({ data: null }) }),
        upsert: () => ({ then: (fn: (v: unknown) => void) => fn({}) }),
        delete: () => ({ eq: () => ({ eq: () => ({ then: (fn: (v: unknown) => void) => fn({}) }) }) }),
        insert: () => ({ then: (fn: (v: unknown) => void) => fn({}) }),
      }),
    } as unknown as SupabaseClient;
  }

  client = createBrowserClient(url, key);
  return client;
}
