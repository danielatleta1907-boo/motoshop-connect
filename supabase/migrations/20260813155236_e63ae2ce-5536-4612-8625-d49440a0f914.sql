CREATE OR REPLACE FUNCTION public.approve_subscriber(p_user_id uuid, p_slug text, p_store_name text, p_proof_id uuid, p_months integer DEFAULT 1)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_tenant_id UUID;
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;

  INSERT INTO public.tenants (owner_id, slug, store_name, status, subscription_due_date)
  VALUES (p_user_id, p_slug, p_store_name, 'active', NULL)
  ON CONFLICT (owner_id) DO UPDATE SET
    status='active',
    subscription_due_date=NULL,
    updated_at=now()
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.store_settings (tenant_id, store_name) VALUES (v_tenant_id, p_store_name)
    ON CONFLICT (tenant_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (p_user_id, 'admin')
    ON CONFLICT DO NOTHING;

  UPDATE public.payment_proofs SET status='approved', reviewed_by=auth.uid(), reviewed_at=now(), tenant_id=v_tenant_id
    WHERE id = p_proof_id;
  RETURN v_tenant_id;
END $function$;

REVOKE ALL ON FUNCTION public.approve_subscriber(uuid, text, text, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_subscriber(uuid, text, text, uuid, integer) TO authenticated;