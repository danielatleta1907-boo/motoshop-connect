ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS theme_button TEXT,
  ADD COLUMN IF NOT EXISTS theme_hero TEXT,
  ADD COLUMN IF NOT EXISTS theme_header TEXT,
  ADD COLUMN IF NOT EXISTS theme_footer TEXT;