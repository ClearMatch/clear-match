import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
  },
  global: {
    headers: {
      'X-Client-Info': 'clear-match-app',
    },
  },
});

// Log authentication state on client side
if (typeof window !== 'undefined') {
  // Only run in browser environment
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Supabase auth event:', event);
    console.log('Session exists:', !!session);
    if (session) {
      console.log('User ID:', session.user.id);
    }
  });
}
