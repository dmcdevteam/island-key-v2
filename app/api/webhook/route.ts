import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';
import { sendHostNotification, sendGuestConfirmation, sendInternalNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;

    if (!bookingId) {
      // Not an Island Key booking — ignore
      return NextResponse.json({ received: true });
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        stripe_session_id: session.id,
        stripe_payment_id: session.payment_intent as string ?? null,
      })
      .eq('id', bookingId);

    if (error) {
      // Log but return 200 — Stripe shouldn't retry on app-level errors
      console.error('Webhook: failed to update booking', bookingId, error.message);
    } else {
      const guestEmail = session.metadata?.guestEmail;
      const guestName  = session.metadata?.guestName ?? 'Guest';

      // Fetch booking once for guest confirmation (host + internal fetch their own data)
      const { data: b } = await createServerClient()
        .from('bookings')
        .select('item_title, booking_date, pax, total_price, confirmation_code, payment_method')
        .eq('id', bookingId)
        .single();

      const emails: Promise<void>[] = [
        sendHostNotification(bookingId),
        sendInternalNotification(bookingId, { guestEmail }),
      ];

      if (guestEmail && b) {
        emails.push(sendGuestConfirmation({
          to: guestEmail,
          guestName,
          itemTitle: b.item_title,
          bookingDate: b.booking_date,
          pax: b.pax,
          totalPrice: b.total_price,
          confirmationCode: b.confirmation_code,
          paymentMethod: b.payment_method ?? 'stripe',
        }));
      }

      // Fire all simultaneously — fire-and-forget, never blocks webhook response
      Promise.all(emails).catch(err =>
        console.error('Webhook: email batch failed', err)
      );
    }
  }

  return NextResponse.json({ received: true });
}
