import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { waNumber } from "@/lib/format";
import { LogIn, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export type StoreSettings = {
  tenant_id: string;
  store_name: string;
  logo_url: string | null;
  motivational_phrase: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  business_hours: Record<string, string> | null;
  about: string | null;
};

export function SiteHeader({ settings, slug, headerStyle, buttonColor }: { settings: StoreSettings | null; slug?: string; headerStyle?: React.CSSProperties; buttonColor?: string }) {
  const [logoSrc, setLogoSrc] = useState<string>("");
  useEffect(() => {
    if (settings?.logo_url) signedUrl("store-assets", settings.logo_url).then(setLogoSrc);
    else setLogoSrc("");
  }, [settings?.logo_url]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md" style={headerStyle}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to={slug ? "/loja/$slug" : "/"} params={slug ? { slug } : undefined as any} className="flex items-center gap-3">
          {logoSrc ? (
            <img src={logoSrc} alt="" className="h-11 w-11 rounded-lg object-cover ring-1 ring-border" />
          ) : (
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand text-primary-foreground font-black">M</div>
          )}
          <div className="leading-tight">
            <div className="text-base font-bold tracking-tight">{settings?.store_name ?? "MotoStore"}</div>
            <div className="hidden text-xs text-muted-foreground sm:block">
              {settings?.motivational_phrase ?? "Sua próxima aventura começa aqui."}
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {settings?.whatsapp && (
            <a
              href={`https://wa.me/${waNumber(settings.whatsapp)}`}
              target="_blank"
              rel="noreferrer"
              style={buttonColor ? { backgroundColor: buttonColor, color: "#fff", borderColor: buttonColor } : undefined}
              className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:opacity-90 md:inline-flex"
            >
              <Phone className="size-4" style={buttonColor ? { color: "#fff" } : undefined} /> WhatsApp
            </a>
          )}
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogIn className="size-4" /> <span className="hidden sm:inline">Lojista</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ settings, footerStyle }: { settings: StoreSettings | null; footerStyle?: React.CSSProperties }) {
  if (!settings) return null;
  const hours = settings.business_hours || {};
  const days: [string, string][] = [
    ["seg", "Segunda"], ["ter", "Terça"], ["qua", "Quarta"], ["qui", "Quinta"],
    ["sex", "Sexta"], ["sab", "Sábado"], ["dom", "Domingo"],
  ];
  return (
    <footer className="mt-20 border-t border-border bg-secondary text-secondary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="text-lg font-bold">{settings.store_name}</div>
          <p className="mt-2 text-sm opacity-80">{settings.motivational_phrase}</p>
          {settings.about && <p className="mt-3 text-sm opacity-70">{settings.about}</p>}
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <MapPin className="size-4 text-primary" /> Localização
          </div>
          <p className="text-sm opacity-80">{settings.address}</p>
          {settings.whatsapp && <p className="mt-1 text-sm opacity-80">WhatsApp: {settings.whatsapp}</p>}
          {settings.phone && <p className="text-sm opacity-80">Telefone: {settings.phone}</p>}
          {settings.email && <p className="text-sm opacity-80">{settings.email}</p>}
        </div>
        <div>
          <div className="mb-2 font-semibold">Horário</div>
          <ul className="space-y-1 text-sm opacity-80">
            {days.map(([k, label]) => (
              <li key={k} className="flex justify-between gap-4">
                <span>{label}</span>
                <span className="font-mono">{hours[k] || "—"}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs opacity-60">
        © {new Date().getFullYear()} {settings.store_name} · Powered by MotoStore SaaS
      </div>
    </footer>
  );
}

export function StoreMap({ address, lat, lng }: { address?: string | null; lat?: number | null; lng?: number | null }) {
  const hasCoords = typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng);
  const q = hasCoords ? `${lat},${lng}` : (address || "").trim();
  if (!q) return null;
  const src = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${(lng as number) - 0.005}%2C${(lat as number) - 0.005}%2C${(lng as number) + 0.005}%2C${(lat as number) + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`
    : `https://maps.google.com/maps?q=${encodeURIComponent(q)}&hl=pt-BR&z=16&output=embed`;
  const externalHref = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-soft">
      <iframe title="Mapa da loja" src={src} className="h-72 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      <a href={externalHref} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 border-t border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted">
        <MapPin className="size-4 text-primary" /> Abrir no Google Maps
      </a>
    </div>
  );
}

export function MotoCard({ moto, cover, slug }: { moto: any; cover: string; slug?: string }) {
  return (
    <Link
      to="/motos/$id"
      params={{ id: moto.id }}
      search={slug ? { slug } as any : undefined}
      className="group block overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {cover ? (
          <img src={cover} alt={`${moto.brand} ${moto.model}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">Sem foto</div>
        )}
        {moto.status !== "available" && (
          <div className="absolute right-2 top-2 rounded-md bg-secondary/95 px-2 py-1 text-xs font-semibold text-secondary-foreground">
            {moto.status === "sold" ? "Vendida" : "Reservada"}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">{moto.brand}</div>
        <h3 className="mt-0.5 truncate text-lg font-bold">{moto.model}</h3>
        <div className="mt-1 text-xs text-muted-foreground">
          {moto.year} · {moto.km.toLocaleString("pt-BR")} km
        </div>
        <div className="mt-3 text-xl font-extrabold text-foreground">
          {Number(moto.price_cash).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </div>
        {moto.price_installment && (
          <div className="text-xs text-muted-foreground">
            ou {moto.installment_count || 12}x de{" "}
            {(Number(moto.price_installment) / (moto.installment_count || 12)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        )}
      </div>
    </Link>
  );
}

export async function fetchTenantBySlug(slug: string) {
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, slug, store_name, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!tenant) return { tenant: null, settings: null };
  const { data: settings } = await supabase.from("store_settings").select("*").eq("tenant_id", tenant.id).maybeSingle();
  return { tenant, settings: settings as StoreSettings | null };
}

export function PrimaryButton(props: React.ComponentProps<typeof Button>) {
  return <Button {...props} className={`bg-brand text-primary-foreground hover:opacity-90 ${props.className ?? ""}`} />;
}
