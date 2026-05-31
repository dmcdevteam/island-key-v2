import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface GuestPayload {
  first_name: string | null;
  property_id: string | null;
  accommodation_name: string | null;
  tier: string | null;
  region: string | null;
  check_in: string | null;
  check_out: string | null;
  group_type: string | null;
  group_size: number | null;
  adults: number | null;
  children: number | null;
  whatsapp_opted_in: boolean;
  whatsapp_number: string | null;
  user_agent: string | null;
}

export async function POST(req: Request) {
  let body: GuestPayload;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('guests')
    .insert({
      first_name: body.first_name,
      property_id: body.property_id,
      accommodation_name: body.accommodation_name,
      tier: body.tier,
      region: body.region,
      check_in: body.check_in,
      check_out: body.check_out,
      group_type: body.group_type,
      group_size: body.group_size,
      adults: body.adults,
      children: body.children,
      whatsapp_opted_in: body.whatsapp_opted_in,
      whatsapp_number: body.whatsapp_number,
      user_agent: body.user_agent,
    } as never)
    .select('id')
    .single();

  if (error) {
    console.error('guests insert error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const row = data as unknown as { id: string };
  return NextResponse.json({ id: row.id });
}
