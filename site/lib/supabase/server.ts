import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Stub for environments without Supabase configured
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        exchangeCodeForSession: async () => ({ data: { user: null, session: null }, error: null }),
      },
      from: () => ({
        upsert: () => ({ then: (fn: (v: unknown) => void) => fn({}) }),
        select: () => ({ eq: () => ({ then: (fn: (v: { data: null }) => void) => fn({ data: null }) }) }),
      }),
    } as unknown as SupabaseClient;
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll called from Server Component — safe to ignore.
          // Session refresh is handled by middleware.
        }
      },
    },
  });
}
