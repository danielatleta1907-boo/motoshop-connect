
-- Fix function search_path
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;

-- Restrict has_role / handle_new_user execution
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
-- Allow authenticated to execute (needed inside RLS policies it's already SECURITY DEFINER; policies run as definer so we can restrict)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;

-- Tighten orders insert (require name+phone+email non-empty)
DROP POLICY IF EXISTS "Anyone can create order" ON public.orders;
CREATE POLICY "Anyone can create order" ON public.orders FOR INSERT
  WITH CHECK (
    length(customer_name) > 1
    AND length(customer_phone) > 5
    AND length(customer_email) > 5
  );

-- Storage policies
-- motorcycle-photos: public read, admin write
CREATE POLICY "Public read motorcycle photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'motorcycle-photos');
CREATE POLICY "Admin upload motorcycle photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'motorcycle-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update motorcycle photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'motorcycle-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete motorcycle photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'motorcycle-photos' AND public.has_role(auth.uid(), 'admin'));

-- store-assets: public read, admin write
CREATE POLICY "Public read store assets" ON storage.objects FOR SELECT
  USING (bucket_id = 'store-assets');
CREATE POLICY "Admin upload store assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update store assets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'store-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete store assets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'store-assets' AND public.has_role(auth.uid(), 'admin'));

-- payment-receipts: admin only
CREATE POLICY "Admin read receipts" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-receipts' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin upload receipts" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-receipts' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update receipts" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'payment-receipts' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete receipts" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'payment-receipts' AND public.has_role(auth.uid(), 'admin'));
