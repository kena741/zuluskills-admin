import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// In Next.js, only NEXT_PUBLIC_* env vars are exposed to the browser.
// This client is imported by client components/thunks, so use the public vars.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

// Export a nullable client so callers can handle demo/offline mode gracefully
export const supabase: SupabaseClient | null =
    supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
