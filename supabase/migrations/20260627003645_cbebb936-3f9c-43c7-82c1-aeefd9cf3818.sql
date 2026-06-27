
-- ===== tenants =====
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  store_name TEXT NOT NULL,
  status tenant_status NOT NULL DEFAULT 'pending',
  subscription_due_date DATE,
  monthly_price NUMERIC(10,2) NOT NULL DEFAULT 65.90,
  grace_days INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT SELECT ON public.tenants TO anon;
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
$$;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated;

CREATE POLICY "tenants_owner_select" ON public.tenants FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "tenants_anon_active_select" ON public.tenants FOR SELECT TO anon
  USING (status = 'active');
CREATE POLICY "tenants_owner_update" ON public.tenants FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "tenants_super_all" ON public.tenants FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE TRIGGER tenants_set_updated BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ===== payment_proofs =====
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  file_url TEXT,
  file_type TEXT,
  status proof_status NOT NULL DEFAULT 'pending',
  period_months INTEGER NOT NULL DEFAULT 1,
  desired_slug TEXT,
  desired_store_name TEXT,
  notes TEXT,
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.payment_proofs TO authenticated;
GRANT ALL ON public.payment_proofs TO service_role;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proofs_owner_select" ON public.payment_proofs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "proofs_owner_insert" ON public.payment_proofs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "proofs_super_update" ON public.payment_proofs FOR UPDATE TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ===== add tenant_id =====
ALTER TABLE public.motorcycles    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.orders         ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS motorcycles_tenant_idx ON public.motorcycles(tenant_id);
CREATE INDEX IF NOT EXISTS orders_tenant_idx ON public.orders(tenant_id);
CREATE INDEX IF NOT EXISTS receipts_tenant_idx ON public.payment_receipts(tenant_id);

-- ===== store_settings rebuilt =====
DROP TABLE IF EXISTS public.store_settings CASCADE;
CREATE TABLE public.store_settings (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL DEFAULT 'Minha Loja',
  logo_url TEXT,
  motivational_phrase TEXT DEFAULT 'Sua próxima aventura começa aqui.',
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  whatsapp TEXT,
  phone TEXT,
  email TEXT,
  instagram TEXT,
  facebook TEXT,
  business_hours JSONB DEFAULT '{}'::jsonb,
  about TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_settings TO authenticated;
GRANT SELECT ON public.store_settings TO anon;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_owner_all" ON public.store_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND (t.owner_id = auth.uid() OR public.is_super_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND (t.owner_id = auth.uid() OR public.is_super_admin())));
CREATE POLICY "settings_anon_active" ON public.store_settings FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND t.status = 'active'));

CREATE TRIGGER settings_set_updated BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ===== drop old policies =====
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND tablename IN ('motorcycles','motorcycle_photos','orders','payment_receipts','user_roles','profiles')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- motorcycles
CREATE POLICY "moto_owner_all" ON public.motorcycles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND (t.owner_id = auth.uid() OR public.is_super_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND (t.owner_id = auth.uid() OR public.is_super_admin())));
CREATE POLICY "moto_anon_active" ON public.motorcycles FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND t.status = 'active'));
CREATE POLICY "moto_auth_active_read" ON public.motorcycles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND t.status = 'active'));

-- motorcycle_photos
CREATE POLICY "photo_owner_all" ON public.motorcycle_photos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.motorcycles m JOIN public.tenants t ON t.id = m.tenant_id WHERE m.id = motorcycle_id AND (t.owner_id = auth.uid() OR public.is_super_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.motorcycles m JOIN public.tenants t ON t.id = m.tenant_id WHERE m.id = motorcycle_id AND (t.owner_id = auth.uid() OR public.is_super_admin())));
CREATE POLICY "photo_anon_active" ON public.motorcycle_photos FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.motorcycles m JOIN public.tenants t ON t.id = m.tenant_id WHERE m.id = motorcycle_id AND t.status = 'active'));
CREATE POLICY "photo_auth_active_read" ON public.motorcycle_photos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.motorcycles m JOIN public.tenants t ON t.id = m.tenant_id WHERE m.id = motorcycle_id AND t.status = 'active'));

-- orders
CREATE POLICY "order_owner_all" ON public.orders FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND (t.owner_id = auth.uid() OR public.is_super_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND (t.owner_id = auth.uid() OR public.is_super_admin())));
CREATE POLICY "order_anon_create" ON public.orders FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND t.status = 'active'));
CREATE POLICY "order_auth_create" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND t.status = 'active'));

-- payment_receipts
CREATE POLICY "receipt_owner_all" ON public.payment_receipts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND (t.owner_id = auth.uid() OR public.is_super_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND (t.owner_id = auth.uid() OR public.is_super_admin())));

-- user_roles
CREATE POLICY "roles_self_select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "roles_super_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- profiles
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_super_admin());
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- ===== new-user trigger =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') INTO is_first;
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== admin RPCs =====
CREATE OR REPLACE FUNCTION public.approve_subscriber(
  p_user_id UUID, p_slug TEXT, p_store_name TEXT, p_proof_id UUID, p_months INTEGER DEFAULT 1
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tenant_id UUID;
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;

  INSERT INTO public.tenants (owner_id, slug, store_name, status, subscription_due_date)
  VALUES (p_user_id, p_slug, p_store_name, 'active', (CURRENT_DATE + (p_months || ' month')::interval)::date)
  ON CONFLICT (owner_id) DO UPDATE SET
    status='active',
    subscription_due_date=(GREATEST(COALESCE(public.tenants.subscription_due_date, CURRENT_DATE), CURRENT_DATE) + (p_months || ' month')::interval)::date,
    updated_at=now()
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.store_settings (tenant_id, store_name) VALUES (v_tenant_id, p_store_name)
    ON CONFLICT (tenant_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (p_user_id, 'admin')
    ON CONFLICT DO NOTHING;

  UPDATE public.payment_proofs SET status='approved', reviewed_by=auth.uid(), reviewed_at=now(), tenant_id=v_tenant_id
    WHERE id = p_proof_id;
  RETURN v_tenant_id;
END $$;
GRANT EXECUTE ON FUNCTION public.approve_subscriber(UUID,TEXT,TEXT,UUID,INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_subscriber(p_user_id UUID, p_proof_id UUID, p_reason TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.payment_proofs SET status='rejected', reviewer_notes=p_reason, reviewed_by=auth.uid(), reviewed_at=now()
    WHERE id = p_proof_id;
  DELETE FROM auth.users WHERE id = p_user_id;
END $$;
GRANT EXECUTE ON FUNCTION public.reject_subscriber(UUID,UUID,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.suspend_overdue_tenants()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INTEGER;
BEGIN
  UPDATE public.tenants SET status='suspended', updated_at=now()
    WHERE status='active' AND subscription_due_date + (grace_days || ' day')::interval < CURRENT_DATE;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.renew_tenant(p_tenant_id UUID, p_proof_id UUID, p_months INTEGER DEFAULT 1)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.tenants SET
    status='active',
    subscription_due_date=(GREATEST(COALESCE(subscription_due_date, CURRENT_DATE), CURRENT_DATE) + (p_months || ' month')::interval)::date,
    updated_at=now()
  WHERE id = p_tenant_id;
  UPDATE public.payment_proofs SET status='approved', reviewed_by=auth.uid(), reviewed_at=now(), tenant_id=p_tenant_id
    WHERE id = p_proof_id;
END $$;
GRANT EXECUTE ON FUNCTION public.renew_tenant(UUID,UUID,INTEGER) TO authenticated;
