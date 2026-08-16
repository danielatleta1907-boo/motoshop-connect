
DROP POLICY IF EXISTS "Admin upload store assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin update store assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete store assets" ON storage.objects;

CREATE POLICY "Store owner upload store assets" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'store-assets' AND (
    public.is_super_admin() OR EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.owner_id = auth.uid() AND (storage.foldername(name))[1] = t.id::text
    )
  )
);

CREATE POLICY "Store owner update store assets" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'store-assets' AND (
    public.is_super_admin() OR EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.owner_id = auth.uid() AND (storage.foldername(name))[1] = t.id::text
    )
  )
)
WITH CHECK (
  bucket_id = 'store-assets' AND (
    public.is_super_admin() OR EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.owner_id = auth.uid() AND (storage.foldername(name))[1] = t.id::text
    )
  )
);

CREATE POLICY "Store owner delete store assets" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'store-assets' AND (
    public.is_super_admin() OR EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.owner_id = auth.uid() AND (storage.foldername(name))[1] = t.id::text
    )
  )
);
