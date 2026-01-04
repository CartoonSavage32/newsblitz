import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and key from environment
// Use server-side env vars if available, fallback to public vars
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window === 'undefined') {
    // Server-side: throw error
    throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY (or NEXT_PUBLIC_ variants)');
  }
  // Client-side: warn but don't throw (allows app to load)
  console.warn('Supabase environment variables not configured');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

