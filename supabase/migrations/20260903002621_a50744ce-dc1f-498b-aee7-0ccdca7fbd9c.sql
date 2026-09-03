CREATE OR REPLACE FUNCTION public.tg_order_sold_decrement_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_qty integer;
BEGIN
  IF NEW.status = 'sold' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'sold') THEN
    UPDATE public.motorcycles
      SET stock_quantity = GREATEST(stock_quantity - 1, 0),
          updated_at = now()
    WHERE id = NEW.motorcycle_id
    RETURNING stock_quantity INTO v_qty;

    IF v_qty IS NOT NULL THEN
      IF v_qty = 0 THEN
        UPDATE public.motorcycles SET status = 'sold', updated_at = now() WHERE id = NEW.motorcycle_id;
      ELSE
        UPDATE public.motorcycles SET status = 'available', updated_at = now() WHERE id = NEW.motorcycle_id AND status = 'sold';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS orders_sold_decrement_stock ON public.orders;
CREATE TRIGGER orders_sold_decrement_stock
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.tg_order_sold_decrement_stock();

REVOKE EXECUTE ON FUNCTION public.tg_order_sold_decrement_stock() FROM anon, authenticated;