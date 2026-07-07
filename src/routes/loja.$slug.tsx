import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { SiteHeader, SiteFooter, MotoCard, StoreMap, fetchTenantBySlug, type StoreSettings } from "@/components/site/site";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export const Route = createFileRoute("/loja/$slug")({
  ssr: false,
  head: () => ({ meta: [{ title: "Loja — MotoStore" }] }),
  component: PublicStore,
});

function PublicStore() {
  const { slug } = useParams({ from: "/loja/$slug" });
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantStatus, setTenantStatus] = useState<string>("");
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [motos, setMotos] = useState<any[]>([]);
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { tenant, settings: s } = await fetchTenantBySlug(slug);
      if (!tenant) { setLoading(false); return; }
      setTenantStatus(tenant.status);
      setTenantId(tenant.id);
      setSettings(s);
      if (tenant.status !== "active") { setLoading(false); return; }
      const { data } = await supabase
        .from("motorcycles")
        .select("*, motorcycle_photos(url, sort_order)")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });
      const list = data ?? [];
      setMotos(list);
      const c: Record<string, string> = {};
      await Promise.all(list.map(async (m: any) => {
        const ph = (m.motorcycle_photos || []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0];
        if (ph) c[m.id] = await signedUrl("motorcycle-photos", ph.url);
      }));
      setCovers(c);
      setLoading(false);
    })();
  }, [slug]);

  const brands = useMemo(() => Array.from(new Set(motos.map((m) => m.brand))).sort(), [motos]);
  const filtered = useMemo(() => motos.filter((m) =>
    (brand === "all" || m.brand === brand) &&
    (!q || `${m.brand} ${m.model}`.toLowerCase().includes(q.toLowerCase()))
  ), [motos, brand, q]);

  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Carregando…</div>;

  if (!tenantId) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-bold">Loja não encontrada</h1>
          <p className="mt-2 text-muted-foreground">A loja <code>/loja/{slug}</code> não existe.</p>
          <Link to="/" className="mt-4 inline-block text-primary underline">Voltar à home</Link>
        </div>
      </div>
    );
  }

  if (tenantStatus !== "active") {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold">Loja temporariamente indisponível</h1>
          <p className="mt-2 text-muted-foreground">
            Esta loja está {tenantStatus === "suspended" ? "suspensa" : "aguardando aprovação"}. Volte em breve.
          </p>
        </div>
      </div>
    );
  }

  const themeStyle = buildThemeStyle((settings as any)?.theme_color);
  const heroStyle: React.CSSProperties = themeStyle
    ? { background: `linear-gradient(140deg, ${shade((settings as any).theme_color, -55)} 0%, ${shade((settings as any).theme_color, -30)} 60%, ${(settings as any).theme_color} 100%)` }
    : {};

  return (
    <div className="min-h-screen bg-background text-foreground" style={themeStyle}>
      <SiteHeader settings={settings} slug={slug} />

      <section className="text-white" style={heroStyle}>
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              {settings?.store_name}
            </div>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">{settings?.motivational_phrase ?? "Sua próxima aventura começa aqui."}</h1>
            <p className="mt-4 max-w-xl text-white/80">Motos selecionadas, prontas para rodar. Encomende online, finalize na loja.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por marca ou modelo…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground">Nenhuma moto encontrada.</div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => <MotoCard key={m.id} moto={m} cover={covers[m.id] || ""} slug={slug} />)}
          </div>
        )}
      </section>

      {settings?.address && (
        <section className="mx-auto max-w-7xl px-4 py-10">
          <h2 className="mb-4 text-2xl font-bold">Onde estamos</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <StoreMap address={settings.address} lat={settings.latitude} lng={settings.longitude} />
            <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
              <div className="text-sm font-semibold uppercase tracking-wider text-primary">Endereço</div>
              <p className="mt-1 text-lg font-semibold">{settings.address}</p>
              {settings.whatsapp && <p className="mt-3 text-sm">WhatsApp: <span className="font-medium">{settings.whatsapp}</span></p>}
              {settings.phone && <p className="text-sm">Telefone: <span className="font-medium">{settings.phone}</span></p>}
              {settings.email && <p className="text-sm">{settings.email}</p>}
            </div>
          </div>
        </section>
      )}

      <SiteFooter settings={settings} />
    </div>
  );
}
