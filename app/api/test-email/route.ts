import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: 'bookings@islandkey.gr',
    to: 'islandkeygr@gmail.com',
    subject: 'Island Key — Resend test',
    html: '<p>If you receive this, Resend is working correctly from <strong>bookings@islandkey.gr</strong>.</p>',
  });

  if (error) {
    console.error('[TEST EMAIL] Resend error:', error);
    return NextResponse.json({ error }, { status: 500 });
  }

  console.log('[TEST EMAIL] Sent OK, id:', data?.id);
  return NextResponse.json({ ok: true, id: data?.id });
}
