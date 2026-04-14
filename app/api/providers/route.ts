import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServerClient(); // service role — bypasses RLS

  const { data, error } = await supabase
    .from('providers')
    .select('id, name, type, category, region, contact_phone, whatsapp, commission_rate, notes')
    .eq('is_active', true)
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
