import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a safe client that won't crash the app if variables are missing
// but will instead fail gracefully when trying to make requests
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        signUp: async () => ({ error: { message: 'Supabase URL and Anon Key are missing. Please restart your Next.js development server.' } }),
        signInWithPassword: async () => ({ error: { message: 'Supabase URL and Anon Key are missing. Please restart your Next.js development server.' } })
      }
    };
