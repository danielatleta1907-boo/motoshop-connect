import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { SiteHeader, SiteFooter, StoreMap, FloatingWhatsApp, type StoreSettings } from "@/components/site/site";
import { storeTheme } from "@/lib/store-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { brl, whatsappLink } from "@/lib/format";
import { ArrowLeft, MessageCircle, ShoppingBag, CheckCircle2, Shirt, Ruler, Palette, Gift, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/produto/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Detalhes da peça — Use Ame" },
      { name: "description", content: "Veja fotos, tamanho, tecido e valores desta peça e encomende para retirada na loja." },
      { property: "og:title", content: "Detalhes da peça — Use Ame" },
      { property: "og:description", content: "Fotos, tamanho, tecido e valores da peça, com encomenda e retirada na loja." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductDetail,
});

const orderSchema = z.object({
  customer_name: z.string().trim().min(2, "Nome muito curto").max(100),
  customer_phone: z.string().trim().min(8, "Telefone inválido").max(30),
  customer_email: z.string().trim().email("E-mail inválido").max(150),
  message: z.string().trim().max(500).optional(),
});

function ProductDetail() {
  const { id } = useParams({ from: "/produto/$id" });
  const [item, setItem] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [slug, setSlug] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ customer_name: "", customer_phone: "", customer_email: "", message: "" });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("motorcycles")
        .select("*, motorcycle_photos(url, sort_order), tenants(id, slug, status)")
        .eq("id", id)
        .maybeSingle();
      if (!data) return;
      setItem(data);
      setSlug((data as any).tenants?.slug || "");
      const sorted = (data.motorcycle_photos || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
      const urls = await Promise.all(sorted.map((p: any) => signedUrl("motorcycle-photos", p.url)));
      setPhotos(urls.filter(Boolean));
      if ((data as any).tenant_id) {
        const { data: s } = await supabase.from("store_settings").select("*").eq("tenant_id", (data as any).tenant_id).maybeSingle();
        setSettings(s as StoreSettings | null);
      }
    })();
  }, [id]);

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader settings={settings} slug={slug} />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">Carregando…</div>
      </div>
    );
  }

  const { themeStyle, headerStyle, footerStyle, buttonColor, buttonStyle, cardBgOverride } = storeTheme(settings);

  const wppMsg = `Olá! Tenho interesse na peça ${item.model}${item.size ? ` (tam. ${item.size})` : ""} anunciada por ${brl(Number(item.price_cash))}.`;

  async function submit() {
    const parsed = orderSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSubmitting(true);
    const { error } = await supabase.from("orders").insert({
      motorcycle_id: id,
      tenant_id: item.tenant_id,
      ...parsed.data,
    });
    setSubmitting(false);
    if (error) return toast.error("Não foi possível registrar sua encomenda.");
    setDone(true);
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={themeStyle}>
      {cardBgOverride && (
        <style>{`[data-store-root] .bg-card{background:${cardBgOverride} !important;}`}</style>
      )}
      <div data-store-root>
      <SiteHeader settings={settings} slug={slug} headerStyle={headerStyle} buttonColor={buttonColor} />
      <div className="mx-auto max-w-7xl px-4 py-6">
        {slug && (
          <Link to="/loja/$slug" params={{ slug }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Voltar ao catálogo
          </Link>
        )}
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="overflow-hidden rounded-2xl border border-border bg-muted shadow-soft">
            <div className="aspect-[4/3] bg-graphite">
              {photos[active] ? <img src={photos[active]} alt={item.model} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-muted-foreground">Sem foto</div>}
            </div>
          </div>
          {photos.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {photos.map((p, i) => (
                <button key={i} onClick={() => setActive(i)} className={`aspect-square overflow-hidden rounded-lg border-2 ${i === active ? "border-primary" : "border-transparent"}`}>
                  <img src={p} alt={`${item.model} foto ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {item.brand && <div className="text-sm font-semibold uppercase tracking-wider text-primary">{item.brand}</div>}
          <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">{item.model}</h1>

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            {item.piece_type && <Badge icon={<Shirt className="size-4" />}>{item.piece_type}</Badge>}
            {item.size && <Badge icon={<Ruler className="size-4" />}>Tam. {item.size}</Badge>}
            {item.color && <Badge icon={<Palette className="size-4" />}>{item.color}</Badge>}
            {item.material && <Badge icon={<Shirt className="size-4" />}>{item.material}</Badge>}
            {item.gender && <Badge icon={<Users className="size-4" />}>{item.gender}</Badge>}
          </div>

          {item.gift && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-semibold">
              <Gift className="size-4 text-primary" /> Vem com brinde: {item.gift}
            </div>
          )}

          <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="text-xs uppercase text-muted-foreground">À vista</div>
            <div className="text-3xl font-extrabold">{brl(Number(item.price_cash))}</div>
            {item.price_installment && (
              <div className="mt-2 text-sm">
                <span className="text-muted-foreground">Parcelado: </span>
                <span className="font-semibold">{brl(Number(item.price_installment))}</span>
                {item.installment_count && (
                  <span className="text-muted-foreground"> em até {item.installment_count}x de {brl(Number(item.price_installment) / item.installment_count)}</span>
                )}
              </div>
            )}
          </div>

          {item.description && <div className="mt-5 whitespace-pre-line text-sm text-muted-foreground">{item.description}</div>}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button size="lg" style={buttonStyle} className="bg-brand text-primary-foreground hover:opacity-90" onClick={() => { setOpen(true); setDone(false); }} disabled={item.status === "sold"}>
              <ShoppingBag className="mr-2 size-4" /> Encomendar
            </Button>
            {whatsappLink(settings?.whatsapp, wppMsg) && (
              <a href={whatsappLink(settings?.whatsapp, wppMsg)} target="_blank" rel="noreferrer">
                <Button size="lg" variant="outline" style={buttonStyle} className="w-full"><MessageCircle className="mr-2 size-4" /> WhatsApp</Button>
              </a>
            )}
          </div>

          {settings?.address && (
            <div className="mt-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Retire na loja</h2>
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
                <DialogTitle>Encomendar {item.model}</DialogTitle>
                <DialogDescription>Deixe seus dados que entraremos em contato.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div><Label>Nome completo</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
                <div><Label>Telefone / WhatsApp</Label><Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} /></div>
                <div><Label>E-mail</Label><Input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} /></div>
                <div><Label>Mensagem (opcional)</Label><Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
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
                O pagamento e a <strong>retirada acontecem na loja física</strong>. Nossa equipe entrará em contato para combinar tudo.
              </p>
              <Button className="mt-5" onClick={() => setOpen(false)}>Fechar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SiteFooter settings={settings} footerStyle={footerStyle} />
      <FloatingWhatsApp phone={settings?.whatsapp} message={wppMsg} buttonColor={buttonColor} />
      </div>
    </div>
  );
}

function Badge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">{icon} {children}</div>;
}
