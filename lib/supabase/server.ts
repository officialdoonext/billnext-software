import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://eknexmgwtljqacsqftlnq.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function createClient() {
  const cookieStore = await cookies();

  const key = supabaseAnonKey && supabaseAnonKey !== "your-supabase-anon-key-here"
    ? supabaseAnonKey
    : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy";

  return createServerClient(supabaseUrl, key, {
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
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}

