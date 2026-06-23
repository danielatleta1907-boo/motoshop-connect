
-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-create profile and assign admin role to first user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO is_first;
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Status enums
CREATE TYPE public.moto_status AS ENUM ('available', 'reserved', 'sold');
CREATE TYPE public.order_status AS ENUM ('pending', 'contacted', 'sold', 'cancelled');
CREATE TYPE public.receipt_type AS ENUM ('receipt', 'invoice');

-- Motorcycles
CREATE TABLE public.motorcycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  km INT NOT NULL DEFAULT 0,
  price_cash NUMERIC(12,2) NOT NULL,
  price_installment NUMERIC(12,2),
  installment_count INT,
  description TEXT,
  color TEXT,
  status public.moto_status NOT NULL DEFAULT 'available',
  stock_quantity INT NOT NULL DEFAULT 1,
  cost_price NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.motorcycles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.motorcycles TO authenticated;
GRANT ALL ON public.motorcycles TO service_role;
ALTER TABLE public.motorcycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view motorcycles" ON public.motorcycles FOR SELECT USING (true);
CREATE POLICY "Admins manage motorcycles" ON public.motorcycles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER motorcycles_updated_at BEFORE UPDATE ON public.motorcycles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Photos
CREATE TABLE public.motorcycle_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motorcycle_id UUID NOT NULL REFERENCES public.motorcycles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.motorcycle_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.motorcycle_photos TO authenticated;
GRANT ALL ON public.motorcycle_photos TO service_role;
ALTER TABLE public.motorcycle_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view photos" ON public.motorcycle_photos FOR SELECT USING (true);
CREATE POLICY "Admins manage photos" ON public.motorcycle_photos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motorcycle_id UUID NOT NULL REFERENCES public.motorcycles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  message TEXT,
  status public.order_status NOT NULL DEFAULT 'pending',
  sold_price NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create order" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Payment receipts / invoices
CREATE TABLE public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motorcycle_id UUID REFERENCES public.motorcycles(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  amount NUMERIC(12,2),
  doc_type public.receipt_type NOT NULL DEFAULT 'receipt',
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_receipts TO authenticated;
GRANT ALL ON public.payment_receipts TO service_role;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage receipts" ON public.payment_receipts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Store settings (singleton)
CREATE TABLE public.store_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name TEXT NOT NULL DEFAULT 'MotoStore',
  logo_url TEXT,
  motivational_phrase TEXT DEFAULT 'Sua próxima aventura começa aqui.',
  address TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  whatsapp TEXT,
  phone TEXT,
  email TEXT,
  instagram TEXT,
  facebook TEXT,
  business_hours JSONB DEFAULT '{}'::jsonb,
  about TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admins update settings" ON public.store_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert settings" ON public.store_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER store_settings_updated_at BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.store_settings (id, store_name, address, whatsapp, motivational_phrase, business_hours)
VALUES (
  1,
  'MotoStore Campina',
  'Av. Almirante Barroso, 1385 - Campina Grande, PB',
  '5583936180252',
  'Sua próxima aventura começa aqui.',
  '{"seg":"08:00-18:00","ter":"08:00-18:00","qua":"08:00-18:00","qui":"08:00-18:00","sex":"08:00-18:00","sab":"08:00-13:00","dom":"Fechado"}'::jsonb
);

CREATE INDEX idx_motorcycles_status ON public.motorcycles(status);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_photos_moto ON public.motorcycle_photos(motorcycle_id);
