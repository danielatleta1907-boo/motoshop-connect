CREATE TABLE public.profit_cycles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  label text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  closed_at timestamp with time zone,
  revenue numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  profit numeric NOT NULL DEFAULT 0,
  sales_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profit_cycles TO authenticated;
GRANT ALL ON public.profit_cycles TO service_role;

ALTER TABLE public.profit_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cycles_owner_all" ON public.profit_cycles FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = profit_cycles.tenant_id AND (t.owner_id = auth.uid() OR public.is_super_admin())))
WITH CHECK (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = profit_cycles.tenant_id AND (t.owner_id = auth.uid() OR public.is_super_admin())));

CREATE UNIQUE INDEX profit_cycles_one_open_per_tenant ON public.profit_cycles (tenant_id) WHERE closed_at IS NULL;
CREATE INDEX profit_cycles_tenant_started_idx ON public.profit_cycles (tenant_id, started_at DESC);

CREATE TRIGGER profit_cycles_set_updated_at BEFORE UPDATE ON public.profit_cycles
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();