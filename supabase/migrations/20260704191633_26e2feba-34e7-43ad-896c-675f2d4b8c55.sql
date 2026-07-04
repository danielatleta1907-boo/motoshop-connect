DROP POLICY IF EXISTS "Public read motorcycle photos" ON storage.objects;
CREATE POLICY "Public read motorcycle photos" ON storage.objects FOR SELECT
USING (
  bucket_id = 'motorcycle-photos'
  AND EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.id::text = split_part(storage.objects.name, '/', 1)
      AND t.status = 'active'
  )
);