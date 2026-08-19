-- Acesso vitalício: limpa vencimentos existentes
UPDATE public.tenants SET subscription_due_date = NULL, updated_at = now() WHERE subscription_due_date IS NOT NULL;

-- Remove agendamento automático de suspensão, se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE command ILIKE '%suspend_overdue_tenants%';
  END IF;
END $$;

-- Suspensão automática desativada (acesso vitalício)
CREATE OR REPLACE FUNCTION public.suspend_overdue_tenants()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Acesso vitalício: nenhuma loja é suspensa automaticamente.
  RETURN 0;
END $function$;

-- Reativação manual/solicitada: ativa sem cobrança e sem vencimento
CREATE OR REPLACE FUNCTION public.renew_tenant(p_tenant_id uuid, p_proof_id uuid, p_months integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.tenants SET
    status = 'active',
    subscription_due_date = NULL,
    updated_at = now()
  WHERE id = p_tenant_id;
  UPDATE public.payment_proofs SET status='approved', reviewed_by=auth.uid(), reviewed_at=now(), tenant_id=p_tenant_id
    WHERE id = p_proof_id;
END $function$;

REVOKE ALL ON FUNCTION public.suspend_overdue_tenants() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.renew_tenant(uuid, uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.renew_tenant(uuid, uuid, integer) TO authenticated;