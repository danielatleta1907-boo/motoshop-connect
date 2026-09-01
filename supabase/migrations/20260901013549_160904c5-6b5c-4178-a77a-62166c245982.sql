CREATE OR REPLACE FUNCTION public.self_provision_store(p_store_name text, p_slug text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tenant_id uuid;
  v_base text;
  v_slug text;
  v_i int := 0;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT id INTO v_tenant_id FROM public.tenants WHERE owner_id = v_uid;
  IF v_tenant_id IS NOT NULL THEN
    UPDATE public.tenants SET status = 'active', subscription_due_date = NULL, updated_at = now()
      WHERE id = v_tenant_id AND status = 'pending';
    INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'admin') ON CONFLICT DO NOTHING;
    RETURN v_tenant_id;
  END IF;

  v_base := regexp_replace(lower(coalesce(nullif(trim(p_slug), ''), nullif(trim(p_store_name), ''), 'loja')), '[^a-z0-9]+', '-', 'g');
  v_base := trim(both '-' from v_base);
  IF v_base = '' THEN v_base := 'loja'; END IF;
  v_slug := v_base;
  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = v_slug) LOOP
    v_i := v_i + 1;
    v_slug := v_base || '-' || v_i::text;
  END LOOP;

  INSERT INTO public.tenants (owner_id, slug, store_name, status, subscription_due_date)
  VALUES (v_uid, v_slug, coalesce(nullif(trim(p_store_name), ''), 'Minha loja'), 'active', NULL)
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.store_settings (tenant_id, store_name)
  VALUES (v_tenant_id, coalesce(nullif(trim(p_store_name), ''), 'Minha loja'))
  ON CONFLICT (tenant_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'admin') ON CONFLICT DO NOTHING;

  RETURN v_tenant_id;
END $$;

REVOKE ALL ON FUNCTION public.self_provision_store(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.self_provision_store(text, text) TO authenticated;