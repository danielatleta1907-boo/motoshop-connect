REVOKE EXECUTE ON FUNCTION public.approve_subscriber(uuid, text, text, uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reject_subscriber(uuid, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.renew_tenant(uuid, uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.suspend_overdue_tenants() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.owns_tenant_folder(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.self_provision_store(text, text) FROM anon;