ALTER TABLE public.transfer_prices
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS discount_label TEXT;
