
DROP POLICY IF EXISTS "proofs_upload" ON storage.objects;
DROP POLICY IF EXISTS "proofs_select_own" ON storage.objects;
DROP POLICY IF EXISTS "proofs_super_all" ON storage.objects;

CREATE POLICY "proofs_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "proofs_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_super_admin()));
CREATE POLICY "proofs_super_all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'payment-proofs' AND public.is_super_admin())
  WITH CHECK (bucket_id = 'payment-proofs' AND public.is_super_admin());
