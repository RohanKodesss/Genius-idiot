// The only place the Supabase client is created. Only lib/repository.js uses it.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Demo mode is explicit, or implied when no project is configured — so a fresh
// clone runs with zero setup. See docs/ARCHITECTURE.md §5.3.
export const DEMO_MODE =
  import.meta.env.VITE_DEMO_MODE === 'true' || !url || !anonKey;

export const supabase = DEMO_MODE ? null : createClient(url, anonKey);
