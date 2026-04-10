import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json(
      { error: 'Stripe not configured. Add STRIPE_SECRET_KEY to .env.local.' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
  const supabase = createServerClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let body: {
    activityId: string;
    activityTitle: string;
    unitPrice: number;
    pax: number;
    bookingDate: string;
    guestId: string | null;
    propertyId: string | null;
    providerId: string | null;
    meetingPoint: string | null;
    guestEmail: string | null;
    guestName: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { activityId, activityTitle, unitPrice, pax, bookingDate, guestId, propertyId, providerId, meetingPoint } = body;

  if (!activityId || !activityTitle || !unitPrice || !pax || !bookingDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const totalPrice = unitPrice * pax;

  // propertyId from session is a slug — look up the UUID
  let propertyUuid: string | null = null;
  if (propertyId) {
    const { data: prop } = await supabase
      .from('properties')
      .select('id')
      .eq('slug', propertyId)
      .single();
    propertyUuid = prop?.id ?? null;
  }

  // 1. Create pending booking in Supabase to get a confirmation code
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      item_type: 'activity',
      item_id: activityId,
      item_title: activityTitle,
      booking_date: bookingDate,
      pax,
      days: 1,
      unit_price: unitPrice,
      total_price: totalPrice,
      payment_method: 'stripe',
      status: 'pending',
      guest_id: guestId,
      property_id: propertyUuid,
      provider_id: providerId,
    })
    .select('id, confirmation_code')
    .single();

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: `Failed to create booking: ${bookingError?.message}` },
      { status: 500 }
    );
  }

  const { id: bookingId, confirmation_code: confirmationCode } = booking;

  // 2. Build success URL with all details for the confirmation page
  const successParams = new URLSearchParams({
    session_id: '{CHECKOUT_SESSION_ID}',
    code: confirmationCode,
    title: activityTitle,
    date: bookingDate,
    pax: String(pax),
    total: String(totalPrice),
    method: 'stripe',
    ...(meetingPoint ? { meeting: meetingPoint } : {}),
  });

  // 3. Create Stripe Checkout session
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: activityTitle },
            unit_amount: Math.round(unitPrice * 100), // Stripe uses cents
          },
          quantity: pax,
        },
      ],
      metadata: {
        bookingId,
        confirmationCode,
        ...(body.guestEmail ? { guestEmail: body.guestEmail } : {}),
        ...(body.guestName  ? { guestName:  body.guestName  } : {}),
      },
      success_url: `${appUrl}/booking/confirmation?${successParams.toString()}`,
      cancel_url: `${appUrl}/activities`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    // Stripe session failed — clean up the pending booking
    await supabase.from('bookings').delete().eq('id', bookingId);
    return NextResponse.json({ error: err.message ?? 'Stripe error' }, { status: 500 });
  }
}
