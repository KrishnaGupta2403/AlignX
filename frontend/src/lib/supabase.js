import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom fetch that uses AbortController to kill frozen TCP sockets after tab hibernation.
// Unlike Promise.race (which just ignores the hung request), AbortController actually
// cancels the underlying connection so the NEXT retry gets a fresh socket.
const fetchWithTimeout = (input, init) => {
  const controller = new AbortController();
  const url = typeof input === 'string' ? input : (input?.url || 'Supabase');
  const timeoutId = setTimeout(() => {
    console.warn(`[Supabase Connection] Request to ${url} timed out after 3.5s. Aborting stale TCP socket to force fresh reconnection...`);
    controller.abort();
  }, 3500);
  return fetch(input, { ...init, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
};

// Create a safe client that won't crash the app if variables are missing
// but will instead fail gracefully when trying to make requests
const client = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: fetchWithTimeout,
      },
      auth: {
        // Custom no-op lock to completely bypass navigator.locks deadlocking on tab switch
        lock: async (_name, _acquireTimeout, fn) => {
          return await fn();
        }
      }
    })
  : {
      auth: {
        signUp: async () => ({ data: { user: null }, error: { message: 'Supabase URL and Anon Key are missing. Please restart your Next.js development server.' } }),
        signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Supabase URL and Anon Key are missing. Please restart your Next.js development server.' } })
      }
    };

export const supabase = /** @type {any} */ (client);
