-- Helper: caller owns the tenant folder referenced in the object path
CREATE OR REPLACE FUNCTION public.owns_tenant_folder(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.owner_id = auth.uid()
      AND (storage.foldername(object_name))[1] = t.id::text
  )
$$;

REVOKE ALL ON FUNCTION public.owns_tenant_folder(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_tenant_folder(text) TO authenticated, service_role;

-- motorcycle-photos
DROP POLICY IF EXISTS "Admin upload motorcycle photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin update motorcycle photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete motorcycle photos" ON storage.objects;

CREATE POLICY "Tenant owner upload motorcycle photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'motorcycle-photos' AND (public.is_super_admin() OR public.owns_tenant_folder(name)));

CREATE POLICY "Tenant owner update motorcycle photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'motorcycle-photos' AND (public.is_super_admin() OR public.owns_tenant_folder(name)))
  WITH CHECK (bucket_id = 'motorcycle-photos' AND (public.is_super_admin() OR public.owns_tenant_folder(name)));

CREATE POLICY "Tenant owner delete motorcycle photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'motorcycle-photos' AND (public.is_super_admin() OR public.owns_tenant_folder(name)));

CREATE POLICY "Tenant owner read motorcycle photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'motorcycle-photos' AND (public.is_super_admin() OR public.owns_tenant_folder(name)));

-- payment-receipts
DROP POLICY IF EXISTS "Admin read receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admin update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete receipts" ON storage.objects;

CREATE POLICY "Tenant owner read receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'payment-receipts' AND (public.is_super_admin() OR public.owns_tenant_folder(name)));

CREATE POLICY "Tenant owner upload receipts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-receipts' AND (public.is_super_admin() OR public.owns_tenant_folder(name)));

CREATE POLICY "Tenant owner update receipts" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'payment-receipts' AND (public.is_super_admin() OR public.owns_tenant_folder(name)))
  WITH CHECK (bucket_id = 'payment-receipts' AND (public.is_super_admin() OR public.owns_tenant_folder(name)));

CREATE POLICY "Tenant owner delete receipts" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'payment-receipts' AND (public.is_super_admin() OR public.owns_tenant_folder(name)));

-- store-assets: ensure owner-scoped authenticated read as well
DROP POLICY IF EXISTS "Store owner read store assets" ON storage.objects;
CREATE POLICY "Store owner read store assets" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'store-assets' AND (public.is_super_admin() OR public.owns_tenant_folder(name)));