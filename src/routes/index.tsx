import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { SiteHeader, SiteFooter, MotoCard, StoreMap } from "@/components/site/site";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MotoStore — Motos novas e seminovas em Campina Grande" },
      { name: "description", content: "Catálogo completo de motos com fotos, preços à vista e parcelados. Encomende online e retire na loja." },
      { property: "og:title", content: "MotoStore — Sua próxima moto está aqui" },
      { property: "og:description", content: "Catálogo de motos seminovas e novas em Campina Grande - PB." },
    ],
  }),
  component: Home,
});

function Home() {
  const [motos, setMotos] = useState<any[]>([]);
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState<string>("all");
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("motorcycles")
        .select("*, motorcycle_photos(url, sort_order)")
        .order("created_at", { ascending: false });
      const list = data ?? [];
      setMotos(list);
      const c: Record<string, string> = {};
      await Promise.all(
        list.map(async (m: any) => {
          const photos = (m.motorcycle_photos || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
          if (photos[0]) c[m.id] = await signedUrl("motorcycle-photos", photos[0].url);
        }),
      );
      setCovers(c);
    })();
    supabase.from("store_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => setSettings(data));
  }, []);

  const brands = useMemo(() => Array.from(new Set(motos.map((m) => m.brand))).sort(), [motos]);
  const filtered = useMemo(
    () =>
      motos.filter((m) => {
        if (brand !== "all" && m.brand !== brand) return false;
        if (q && !`${m.brand} ${m.model}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [motos, brand, q],
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-hero text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider uppercase">
              {settings?.store_name ?? "MotoStore"}
            </div>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              {settings?.motivational_phrase ?? "Sua próxima aventura começa aqui."}
            </h1>
            <p className="mt-4 max-w-xl text-white/80">
              Motos selecionadas, prontas para rodar. Encomende online, finalize na loja.
            </p>
          </div>
        </div>
      </section>

      {/* Filtros + catálogo */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por marca ou modelo…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
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
          <div className="rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground">
            Nenhuma moto encontrada.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => <MotoCard key={m.id} moto={m} cover={covers[m.id] || ""} />)}
          </div>
        )}
      </section>

      {/* Localização */}
      {settings && (
        <section className="mx-auto max-w-7xl px-4 py-10">
          <h2 className="mb-4 text-2xl font-bold">Onde estamos</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <StoreMap address={settings.address} lat={settings.latitude} lng={settings.longitude} />
            <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
              <div className="text-sm font-semibold text-primary uppercase tracking-wider">Endereço</div>
              <p className="mt-1 text-lg font-semibold">{settings.address}</p>
              {settings.whatsapp && <p className="mt-3 text-sm">WhatsApp: <span className="font-medium">{settings.whatsapp}</span></p>}
              {settings.phone && <p className="text-sm">Telefone: <span className="font-medium">{settings.phone}</span></p>}
              {settings.email && <p className="text-sm">{settings.email}</p>}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
