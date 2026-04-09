import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';


// ─── Typed client interface ───────────────────────────────────────────────────
// @supabase/supabase-js v2.103 resolves GenericSchema from two different
// declaration files (.d.mts/.d.cts) when Next.js bridges CJS→ESM in its type
// generation step, breaking the `Database extends GenericSchema` constraint.
// We side-step this by casting to `any` here and relying on explicit per-file
// casts (already present throughout) for the handful of places that need them.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = ReturnType<typeof createSupabaseClient<any>>;

// ─── Browser / client-component client (anon key) ───
// Singleton is created lazily inside getClient() so env vars are read at
// call time, not at module-init time (avoids caching an undefined-URL client
// in environments where env vars aren't available at import).
let clientInstance: AnyClient | null = null;

export function createClient(): AnyClient {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as AnyClient;
}

export function getClient(): AnyClient {
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
}

// ─── Server client (service role — API routes only, never sent to browser) ───
export function createServerClient(): AnyClient {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) as AnyClient;
}
