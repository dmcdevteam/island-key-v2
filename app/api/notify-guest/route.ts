import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendGuestConfirmation } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: { bookingId: string; guestEmail: string; guestName?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.bookingId || !body.guestEmail) {
    return NextResponse.json({ error: 'bookingId and guestEmail required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('item_title, booking_date, pax, total_price, confirmation_code, payment_method, guest_id')
    .eq('id', body.bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  let guestName = body.guestName ?? 'Guest';
  if (!body.guestName && booking.guest_id) {
    const { data: guest } = await supabase
      .from('guests')
      .select('first_name')
      .eq('id', booking.guest_id)
      .single();
    if (guest?.first_name) guestName = guest.first_name;
  }

  // Fire-and-forget — never blocks response
  sendGuestConfirmation({
    to: body.guestEmail,
    guestName,
    itemTitle: booking.item_title,
    bookingDate: booking.booking_date,
    pax: booking.pax,
    totalPrice: booking.total_price,
    confirmationCode: booking.confirmation_code,
    paymentMethod: booking.payment_method ?? 'whatsapp',
  }).catch(err => console.error('notify-guest unhandled:', err));

  return NextResponse.json({ ok: true });
}
