import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://eknexmgwtljqacsqftlnq.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function createClient() {
  // If anon key is not set, use a fallback dummy key so browser client doesn't crash on initialize
  const key = supabaseAnonKey && supabaseAnonKey !== "your-supabase-anon-key-here"
    ? supabaseAnonKey
    : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy";

  return createBrowserClient(supabaseUrl, key);
}

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseAnonKey &&
    supabaseAnonKey.length > 20 &&
    supabaseAnonKey !== "your-supabase-anon-key-here"
  );
};

