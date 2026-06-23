import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { SiteHeader, SiteFooter, StoreMap } from "@/components/site/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { brl, km, whatsappLink } from "@/lib/format";
import { ArrowLeft, MessageCircle, ShoppingBag, CheckCircle2, Calendar, Gauge, Palette } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/motos/$id")({
  head: () => ({ meta: [{ title: "Detalhes da moto — MotoStore" }] }),
  component: MotoDetail,
});

const orderSchema = z.object({
  customer_name: z.string().trim().min(2, "Nome muito curto").max(100),
  customer_phone: z.string().trim().min(8, "Telefone inválido").max(30),
  customer_email: z.string().trim().email("E-mail inválido").max(150),
  message: z.string().trim().max(500).optional(),
});

function MotoDetail() {
  const { id } = useParams({ from: "/motos/$id" });
  const [moto, setMoto] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [settings, setSettings] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ customer_name: "", customer_phone: "", customer_email: "", message: "" });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("motorcycles")
        .select("*, motorcycle_photos(url, sort_order)")
        .eq("id", id)
        .maybeSingle();
      if (!data) return;
      setMoto(data);
      const sorted = (data.motorcycle_photos || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
      const urls = await Promise.all(sorted.map((p: any) => signedUrl("motorcycle-photos", p.url)));
      setPhotos(urls.filter(Boolean));
    })();
    supabase.from("store_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => setSettings(data));
  }, [id]);

  if (!moto) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">Carregando…</div>
      </div>
    );
  }

  const wppMsg = `Olá! Tenho interesse na ${moto.brand} ${moto.model} ${moto.year} anunciada por ${brl(Number(moto.price_cash))}.`;

  async function submit() {
    const parsed = orderSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("orders").insert({
      motorcycle_id: id,
      ...parsed.data,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível registrar sua encomenda. Tente novamente.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Voltar ao catálogo
        </Link>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="overflow-hidden rounded-2xl border border-border bg-muted shadow-soft">
            <div className="aspect-[4/3] bg-graphite">
              {photos[active] ? (
                <img src={photos[active]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground">Sem foto</div>
              )}
            </div>
          </div>
          {photos.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {photos.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${i === active ? "border-primary" : "border-transparent"}`}
                >
                  <img src={p} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wider text-primary">{moto.brand}</div>
          <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">{moto.model}</h1>

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Badge icon={<Calendar className="size-4" />}>{moto.year}</Badge>
            <Badge icon={<Gauge className="size-4" />}>{km(moto.km)}</Badge>
            {moto.color && <Badge icon={<Palette className="size-4" />}>{moto.color}</Badge>}
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="text-xs uppercase text-muted-foreground">À vista</div>
            <div className="text-3xl font-extrabold">{brl(Number(moto.price_cash))}</div>
            {moto.price_installment && (
              <div className="mt-2 text-sm">
                <span className="text-muted-foreground">Parcelado: </span>
                <span className="font-semibold">{brl(Number(moto.price_installment))}</span>
                {moto.installment_count && (
                  <span className="text-muted-foreground">
                    {" "}em até {moto.installment_count}x de{" "}
                    {brl(Number(moto.price_installment) / moto.installment_count)}
                  </span>
                )}
              </div>
            )}
          </div>

          {moto.description && (
            <div className="mt-5 whitespace-pre-line text-sm text-muted-foreground">{moto.description}</div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button
              size="lg"
              className="bg-brand text-primary-foreground hover:opacity-90"
              onClick={() => { setOpen(true); setDone(false); }}
              disabled={moto.status === "sold"}
            >
              <ShoppingBag className="mr-2 size-4" /> Encomendar
            </Button>
            {settings?.whatsapp && (
              <a href={whatsappLink(settings.whatsapp, wppMsg)} target="_blank" rel="noreferrer">
                <Button size="lg" variant="outline" className="w-full">
                  <MessageCircle className="mr-2 size-4" /> WhatsApp
                </Button>
              </a>
            )}
          </div>

          {settings && (
            <div className="mt-8">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Retire na loja</h3>
              <StoreMap address={settings.address} lat={settings.latitude} lng={settings.longitude} />
              <p className="mt-2 text-sm text-muted-foreground">{settings.address}</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {!done ? (
            <>
              <DialogHeader>
                <DialogTitle>Encomendar {moto.brand} {moto.model}</DialogTitle>
                <DialogDescription>Deixe seus dados que entraremos em contato.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div>
                  <Label>Nome completo</Label>
                  <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
                </div>
                <div>
                  <Label>Telefone / WhatsApp</Label>
                  <Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
                </div>
                <div>
                  <Label>Mensagem (opcional)</Label>
                  <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>
                <Button onClick={submit} disabled={submitting} className="bg-brand text-primary-foreground hover:opacity-90">
                  {submitting ? "Enviando…" : "Confirmar encomenda"}
                </Button>
              </div>
            </>
          ) : (
            <div className="py-4 text-center">
              <CheckCircle2 className="mx-auto mb-3 size-14 text-primary" />
              <h3 className="text-xl font-bold">Encomenda registrada!</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Os pagamentos são realizados <strong>somente na loja física</strong>, após análise e aprovação do seu pedido.
                Nossa equipe entrará em contato pelo telefone ou e-mail informado. Obrigado!
              </p>
              <Button className="mt-5" onClick={() => setOpen(false)}>Fechar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}

function Badge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">
      {icon} {children}
    </div>
  );
}
