import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(not set)';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '(not set)';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '(not set)';

  console.log('[/api/test] NEXT_PUBLIC_SUPABASE_URL:', url.slice(0, 20));
  console.log('[/api/test] SERVICE_ROLE_KEY set:', serviceKey !== '(not set)');
  console.log('[/api/test] ANON_KEY set:', anonKey !== '(not set)');

  let supabaseResult: unknown = null;
  let supabaseError: unknown = null;

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('properties')
      .select('id, slug, name')
      .limit(1);

    if (error) {
      console.error('[/api/test] Supabase error:', error.message, error.code);
      supabaseError = { message: error.message, code: error.code, hint: error.hint };
    } else {
      console.log('[/api/test] Supabase OK — rows returned:', data?.length ?? 0);
      supabaseResult = data;
    }
  } catch (err: any) {
    console.error('[/api/test] Exception:', err?.message ?? String(err));
    supabaseError = { exception: err?.message ?? String(err) };
  }

  return NextResponse.json({
    env: {
      supabase_url_prefix: url.slice(0, 20),
      service_key_set: serviceKey !== '(not set)',
      anon_key_set: anonKey !== '(not set)',
    },
    supabase: supabaseError
      ? { ok: false, error: supabaseError }
      : { ok: true, rows: supabaseResult },
  });
}
