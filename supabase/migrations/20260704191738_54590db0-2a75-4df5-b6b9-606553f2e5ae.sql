-- Restrict public read of store-assets to files linked to an active tenant's store settings
DROP POLICY IF EXISTS "Public read store assets" ON storage.objects;
CREATE POLICY "Public read store assets" ON storage.objects FOR SELECT
USING (
  bucket_id = 'store-assets'
  AND EXISTS (
    SELECT 1
    FROM public.store_settings ss
    JOIN public.tenants t ON t.id = ss.tenant_id
    WHERE t.status = 'active'
      AND ss.logo_url IS NOT NULL
      AND (
        ss.logo_url = storage.objects.name
        OR ss.logo_url LIKE '%/' || storage.objects.name
        OR position(storage.objects.name in ss.logo_url) > 0
      )
  )
);

-- Revoke direct API execute on privileged SECURITY DEFINER RPCs
REVOKE EXECUTE ON FUNCTION public.approve_subscriber(uuid, text, text, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reject_subscriber(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.renew_tenant(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.suspend_overdue_tenants() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_subscriber(uuid, text, text, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.reject_subscriber(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.renew_tenant(uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.suspend_overdue_tenants() TO service_role;