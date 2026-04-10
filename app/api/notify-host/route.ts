import { NextResponse } from 'next/server';
import { sendHostNotification, sendInternalNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: { bookingId: string; guestName?: string; guestPhone?: string | null; guestEmail?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.bookingId) {
    return NextResponse.json({ error: 'bookingId required' }, { status: 400 });
  }

  // Fire host + internal simultaneously — fire-and-forget, never surfaces to guest
  Promise.all([
    sendHostNotification(body.bookingId, { guestName: body.guestName, guestPhone: body.guestPhone }),
    sendInternalNotification(body.bookingId, { guestEmail: body.guestEmail }),
  ]).catch(err => console.error('notify-host unhandled:', err));

  return NextResponse.json({ ok: true });
}
