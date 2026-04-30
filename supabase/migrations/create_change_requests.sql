CREATE TABLE IF NOT EXISTS public.change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  guest_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_date DATE,
  requested_time TEXT,
  requested_pax INTEGER,
  requested_vehicle_class TEXT,
  notes TEXT NOT NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS change_requests_booking_id_idx ON public.change_requests(booking_id);
CREATE INDEX IF NOT EXISTS change_requests_status_idx ON public.change_requests(status);
