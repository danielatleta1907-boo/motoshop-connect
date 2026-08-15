CREATE TABLE IF NOT EXISTS public.product_costs (
  motorcycle_id uuid PRIMARY KEY REFERENCES public.motorcycles(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cost_price numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_costs TO authenticated;
GRANT ALL ON public.product_costs TO service_role;

ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY costs_owner_all ON public.product_costs FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = product_costs.tenant_id AND (t.owner_id = auth.uid() OR public.is_super_admin())))
WITH CHECK (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = product_costs.tenant_id AND (t.owner_id = auth.uid() OR public.is_super_admin())));

INSERT INTO public.product_costs (motorcycle_id, tenant_id, cost_price)
SELECT m.id, m.tenant_id, m.cost_price FROM public.motorcycles m
WHERE m.tenant_id IS NOT NULL AND m.cost_price IS NOT NULL
ON CONFLICT (motorcycle_id) DO NOTHING;

ALTER TABLE public.motorcycles DROP COLUMN cost_price;

CREATE TRIGGER product_costs_updated_at BEFORE UPDATE ON public.product_costs
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();