import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './supabaseConfig.js';

// IMPORTANT: importing this module pulls in the full @supabase/supabase-js SDK.
// Never import it statically from anything reachable at first paint — use
// `await import('./supabaseClient.js')` at the call site instead, and import
// the `isSupabaseConfigured` flag from ./supabaseConfig.js when that's all you need.
export { isSupabaseConfigured };

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

// Convenience helper: resolves to the client, or null when unconfigured.
export default supabase;
