ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_number text,
  ADD COLUMN IF NOT EXISTS address_district text,
  ADD COLUMN IF NOT EXISTS address_city text,
  ADD COLUMN IF NOT EXISTS address_state text,
  ADD COLUMN IF NOT EXISTS address_cep text,
  ADD COLUMN IF NOT EXISTS theme_badge_gift text,
  ADD COLUMN IF NOT EXISTS theme_badge_sold text,
  ADD COLUMN IF NOT EXISTS theme_badge_reserved text;