-- Transfer settings: key/value store for admin-configurable settings
CREATE TABLE IF NOT EXISTS public.transfer_settings (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  key         TEXT        UNIQUE NOT NULL,
  value       JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Default return trip pricing (same price, per-leg + total display)
INSERT INTO public.transfer_settings (key, value)
VALUES (
  'return_trip_pricing',
  '{"mode":"same","discount_percent":100,"display_mode":"per_leg_and_total","discount_label":null}'::jsonb
)
ON CONFLICT (key) DO NOTHING;
