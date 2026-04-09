import { NextResponse } from 'next/server';
import { sendHostNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: { bookingId: string; guestName?: string; guestPhone?: string | null };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.bookingId) {
    return NextResponse.json({ error: 'bookingId required' }, { status: 400 });
  }

  // Fire-and-forget — errors are logged inside sendHostNotification, never surface to guest
  sendHostNotification(body.bookingId, {
    guestName: body.guestName,
    guestPhone: body.guestPhone,
  }).catch(err => console.error('notify-host unhandled:', err));

  return NextResponse.json({ ok: true });
}
