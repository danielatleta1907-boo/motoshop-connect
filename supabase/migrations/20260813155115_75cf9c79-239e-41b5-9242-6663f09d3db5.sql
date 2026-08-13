ALTER TABLE public.motorcycles
  ALTER COLUMN year DROP NOT NULL,
  ALTER COLUMN km DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS piece_type text,
  ADD COLUMN IF NOT EXISTS size text,
  ADD COLUMN IF NOT EXISTS material text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS gift text;

ALTER TABLE public.motorcycles ALTER COLUMN year DROP DEFAULT;
ALTER TABLE public.motorcycles ALTER COLUMN km SET DEFAULT 0;

ALTER TABLE public.tenants ALTER COLUMN subscription_due_date DROP NOT NULL;
UPDATE public.tenants SET subscription_due_date = NULL WHERE status = 'active';