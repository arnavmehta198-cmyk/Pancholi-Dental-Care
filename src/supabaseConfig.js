// Zero-dependency config module. Anything that only needs to know *whether*
// Supabase is wired up should import from here — importing supabaseClient.js
// instead would pull the whole ~2 MB @supabase/supabase-js SDK into that
// module's chunk, and onto the critical path if it's reachable from App.jsx.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
