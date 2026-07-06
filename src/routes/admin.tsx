import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import {
  LogOut, Plus, Edit2, Trash2, Upload, ImagePlus, X, FileText,
  TrendingUp, Bike, Users, CheckCircle2, DollarSign, Settings as Cog,
  Clock, AlertTriangle, ShieldAlert, ExternalLink, RefreshCw, Share2, Copy, Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line,
} from "recharts";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Painel da loja — MotoStore" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, role, tenant, loading, signOut, reload } = useAuth();
  const navigate = useNavigate();
  const [renewOpen, setRenewOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Carregando…</div>;
  if (!user) return null;

  // Super admin → redireciona pro super painel
  if (role === "super_admin") {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <ShieldAlert className="mx-auto mb-3 size-12 text-primary" />
          <h2 className="text-xl font-bold">Você é Super Admin</h2>
          <Link to="/super-admin" className="mt-4 inline-block">
            <Button className="bg-brand text-primary-foreground hover:opacity-90">Ir para o painel do super admin</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Sem tenant ainda → aguardando aprovação
  if (!tenant || role !== "admin") {
    return (
      <PendingScreen
        email={user.email!}
        onSignOut={() => signOut().then(() => navigate({ to: "/auth" }))}
      />
    );
  }

  // Suspenso por atraso
  if (tenant.status === "suspended" || tenant.status === "cancelled") {
    return (
      <>
        <SuspendedScreen
          tenant={tenant}
          email={user.email!}
          onRenew={() => setRenewOpen(true)}
          onSignOut={() => signOut().then(() => navigate({ to: "/auth" }))}
        />
        <SubscribeDialog open={renewOpen} onOpenChange={setRenewOpen} mode="renew" tenantName={tenant.store_name} onSubmitted={reload} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-md bg-brand text-primary-foreground font-black">M</div>
            <div>
              <div className="text-sm font-bold">{tenant.store_name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DueBadge tenant={tenant} onRenew={() => setRenewOpen(true)} />
            <ShareStoreButton slug={tenant.slug} name={tenant.store_name} />
            <Link to="/loja/$slug" params={{ slug: tenant.slug }}>
              <Button variant="outline" size="sm"><ExternalLink className="mr-2 size-4" />Ver loja</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => signOut().then(() => navigate({ to: "/auth" }))}>
              <LogOut className="mr-2 size-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Tabs defaultValue="dashboard">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="dashboard"><TrendingUp className="mr-2 size-4" />Painel</TabsTrigger>
            <TabsTrigger value="stock"><Bike className="mr-2 size-4" />Estoque</TabsTrigger>
            <TabsTrigger value="leads"><Users className="mr-2 size-4" />Interessados</TabsTrigger>
            <TabsTrigger value="sold"><CheckCircle2 className="mr-2 size-4" />Vendidos</TabsTrigger>
            <TabsTrigger value="receipts"><FileText className="mr-2 size-4" />Comprovantes</TabsTrigger>
            <TabsTrigger value="settings"><Cog className="mr-2 size-4" />Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6"><DashboardTab tenantId={tenant.id} /></TabsContent>
          <TabsContent value="stock" className="mt-6"><StockTab tenantId={tenant.id} /></TabsContent>
          <TabsContent value="leads" className="mt-6"><LeadsTab /></TabsContent>
          <TabsContent value="sold" className="mt-6"><SoldTab /></TabsContent>
          <TabsContent value="receipts" className="mt-6"><ReceiptsTab tenantId={tenant.id} /></TabsContent>
          <TabsContent value="settings" className="mt-6"><SettingsTab tenantId={tenant.id} /></TabsContent>
        </Tabs>
      </main>

      <SubscribeDialog open={renewOpen} onOpenChange={setRenewOpen} mode="renew" tenantName={tenant.store_name} onSubmitted={reload} />
    </div>
  );
}

function ShareStoreButton({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/loja/${slug}` : `/loja/${slug}`;
  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); toast.success("Link copiado!"); setTimeout(() => setCopied(false), 2000); }
    catch { toast.error("Não foi possível copiar"); }
  }
  const wa = `https://wa.me/?text=${encodeURIComponent(`Confira nossa loja ${name}: ${url}`)}`;
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Share2 className="mr-2 size-4" />Compartilhar</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Compartilhar sua loja</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Envie este link para seus clientes. Ele abre a vitrine pública da sua loja.</p>
            <div className="flex gap-2">
              <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
              <Button onClick={copy} variant="outline">{copied ? <Check className="size-4" /> : <Copy className="size-4" />}</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a href={wa} target="_blank" rel="noreferrer"><Button variant="outline" className="w-full">WhatsApp</Button></a>
              <a href={`mailto:?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(url)}`}><Button variant="outline" className="w-full">E-mail</Button></a>
            </div>
            <img alt="QR Code" className="mx-auto mt-2 size-40 rounded-md border border-border" src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DueBadge({ tenant, onRenew }: { tenant: any; onRenew: () => void }) {
  if (!tenant.subscription_due_date) return null;
  const due = new Date(tenant.subscription_due_date);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
  const warn = days <= 5;
  return (
    <button onClick={onRenew} className={`hidden md:inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold ${warn ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border bg-card text-muted-foreground"}`}>
      <Clock className="size-3.5" />
      Assinatura: {due.toLocaleDateString("pt-BR")} {warn ? `(${days}d)` : ""}
      {warn && <span className="ml-1 underline">Renovar</span>}
    </button>
  );
}

function PendingScreen({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-hero p-6 text-center text-white">
      <div className="max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur">
        <Clock className="mx-auto mb-3 size-12 text-primary-foreground" />
        <h2 className="text-2xl font-bold">Aguardando aprovação</h2>
        <p className="mt-2 text-white/80">
          Olá, <strong>{email}</strong>. Seu cadastro foi recebido e está aguardando o super admin validar seu pagamento PIX.
        </p>
        <p className="mt-3 text-sm text-white/70">
          Se ainda não enviou o comprovante, volte à tela inicial e clique em <strong>"Assinar"</strong>.
        </p>
        <div className="mt-6 flex gap-2">
          <Link to="/" className="flex-1"><Button variant="outline" className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20">Voltar ao site</Button></Link>
          <Button onClick={onSignOut} variant="ghost" className="text-white">Sair</Button>
        </div>
      </div>
    </div>
  );
}

function SuspendedScreen({ tenant, email, onRenew, onSignOut }: any) {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div className="max-w-md rounded-2xl border border-destructive/40 bg-destructive/5 p-8">
        <AlertTriangle className="mx-auto mb-3 size-12 text-destructive" />
        <h2 className="text-2xl font-bold">Loja suspensa</h2>
        <p className="mt-2 text-muted-foreground">
          A loja <strong>{tenant.store_name}</strong> está suspensa por atraso no pagamento.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">Conta: {email}</p>
        <div className="mt-6 space-y-2">
          <Button onClick={onRenew} size="lg" className="w-full bg-brand text-primary-foreground hover:opacity-90">
            <RefreshCw className="mr-2 size-4" /> Pagar e reativar
          </Button>
          <Button onClick={onSignOut} variant="ghost" className="w-full">Sair</Button>
        </div>
      </div>
    </div>
  );
}

/* ============ DASHBOARD ============ */
function DashboardTab({ tenantId }: { tenantId: string }) {
  const [stats, setStats] = useState({ stock: 0, pending: 0, sold: 0, revenue: 0, cost: 0 });
  const [byMonth, setByMonth] = useState<{ month: string; sales: number; profit: number }[]>([]);

  useEffect(() => { load(); }, [tenantId]);
  async function load() {
    const [{ count: stock }, { count: pending }, { data: sold }] = await Promise.all([
      supabase.from("motorcycles").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "available"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "pending"),
      supabase.from("orders").select("sold_price, updated_at, motorcycle_id, motorcycles(cost_price)").eq("tenant_id", tenantId).eq("status", "sold"),
    ]);
    let revenue = 0; let cost = 0;
    const byM: Record<string, { sales: number; profit: number }> = {};
    (sold ?? []).forEach((o: any) => {
      const price = Number(o.sold_price) || 0;
      const c = Number(o.motorcycles?.cost_price) || 0;
      revenue += price; cost += c;
      const d = new Date(o.updated_at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byM[k] = byM[k] || { sales: 0, profit: 0 };
      byM[k].sales += price;
      byM[k].profit += price - c;
    });
    setStats({ stock: stock || 0, pending: pending || 0, sold: sold?.length || 0, revenue, cost });
    setByMonth(Object.entries(byM).sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v })));
  }
  const margin = stats.revenue > 0 ? ((stats.revenue - stats.cost) / stats.revenue) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Bike className="size-5" />} label="Em estoque" value={stats.stock} />
        <Stat icon={<Users className="size-5" />} label="Interessados ativos" value={stats.pending} />
        <Stat icon={<CheckCircle2 className="size-5" />} label="Motos vendidas" value={stats.sold} />
        <Stat icon={<DollarSign className="size-5" />} label="Faturamento" value={brl(stats.revenue)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="text-sm text-muted-foreground">Lucro bruto</div>
          <div className="mt-1 text-2xl font-extrabold text-primary">{brl(stats.revenue - stats.cost)}</div>
          <div className="mt-1 text-xs text-muted-foreground">Custo total: {brl(stats.cost)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="text-sm text-muted-foreground">Margem de lucro</div>
          <div className="mt-1 text-2xl font-extrabold">{margin.toFixed(1)}%</div>
          <div className="mt-1 text-xs text-muted-foreground">Lucro / Faturamento</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="text-sm text-muted-foreground">Ticket médio</div>
          <div className="mt-1 text-2xl font-extrabold">{brl(stats.sold > 0 ? stats.revenue / stats.sold : 0)}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h3 className="mb-3 font-semibold">Vendas por mês</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => brl(Number(v))} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="sales" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h3 className="mb-3 font-semibold">Lucro por mês</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => brl(Number(v))} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="profit" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
    </div>
  );
}

/* ============ STOCK ============ */
const motoSchema = z.object({
  brand: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  year: z.number().int().min(1950).max(new Date().getFullYear() + 1),
  km: z.number().int().min(0).max(2_000_000),
  price_cash: z.number().min(0),
  price_installment: z.number().min(0).optional().nullable(),
  installment_count: z.number().int().min(1).max(120).optional().nullable(),
  cost_price: z.number().min(0).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  color: z.string().max(40).optional().nullable(),
  stock_quantity: z.number().int().min(0).max(999),
  status: z.enum(["available", "reserved", "sold"]),
});

function StockTab({ tenantId }: { tenantId: string }) {
  const [list, setList] = useState<any[]>([]);
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("motorcycles")
      .select("*, motorcycle_photos(url, sort_order)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setList(data ?? []);
    const c: Record<string, string> = {};
    await Promise.all((data ?? []).map(async (m: any) => {
      const p = (m.motorcycle_photos || []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0];
      if (p) c[m.id] = await signedUrl("motorcycle-photos", p.url);
    }));
    setCovers(c);
  }
  useEffect(() => { load(); }, [tenantId]);

  async function remove(id: string) {
    if (!confirm("Excluir esta moto e suas fotos?")) return;
    const { error } = await supabase.from("motorcycles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Moto removida"); load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Estoque</h2>
          <p className="text-sm text-muted-foreground">{list.length} motos cadastradas</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="bg-brand text-primary-foreground hover:opacity-90">
          <Plus className="mr-2 size-4" /> Nova moto
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((m) => (
          <div key={m.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
            <div className="aspect-[4/3] bg-muted">
              {covers[m.id] ? <img src={covers[m.id]} className="h-full w-full object-cover" alt="" /> : <div className="grid h-full place-items-center text-xs text-muted-foreground">Sem foto</div>}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase text-primary">{m.brand}</div>
                  <div className="font-bold">{m.model}</div>
                  <div className="text-xs text-muted-foreground">{m.year} · {m.km.toLocaleString("pt-BR")} km</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${m.status === "available" ? "bg-primary/15 text-primary" : m.status === "sold" ? "bg-muted text-muted-foreground" : "bg-accent text-accent-foreground"}`}>
                  {m.status === "available" ? "Disponível" : m.status === "sold" ? "Vendida" : "Reservada"}
                </span>
              </div>
              <div className="mt-2 font-bold">{brl(Number(m.price_cash))}</div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditing(m); setOpen(true); }}><Edit2 className="size-3.5" /></Button>
                <Button size="sm" variant="outline" onClick={() => remove(m.id)}><Trash2 className="size-3.5" /></Button>
                <Link to="/motos/$id" params={{ id: m.id }} className="ml-auto text-xs text-primary hover:underline self-center">Ver página →</Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <MotoFormDialog tenantId={tenantId} open={open} onOpenChange={setOpen} moto={editing} onSaved={() => { setOpen(false); load(); }} />
    </div>
  );
}

function MotoFormDialog({ tenantId, open, onOpenChange, moto, onSaved }: any) {
  const empty = {
    brand: "", model: "", year: new Date().getFullYear(), km: 0,
    price_cash: 0, price_installment: 0, installment_count: 12, cost_price: 0,
    description: "", color: "", stock_quantity: 1, status: "available" as const,
  };
  const [f, setF] = useState<any>(empty);
  const [photos, setPhotos] = useState<{ id?: string; url: string; signed: string; file?: File }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (moto) {
      setF({
        brand: moto.brand, model: moto.model, year: moto.year, km: moto.km,
        price_cash: Number(moto.price_cash), price_installment: Number(moto.price_installment) || 0,
        installment_count: moto.installment_count || 12, cost_price: Number(moto.cost_price) || 0,
        description: moto.description || "", color: moto.color || "",
        stock_quantity: moto.stock_quantity, status: moto.status,
      });
      const ph = (moto.motorcycle_photos || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
      Promise.all(ph.map(async (p: any) => ({ id: p.id, url: p.url, signed: await signedUrl("motorcycle-photos", p.url) })))
        .then(setPhotos);
    } else {
      setF(empty); setPhotos([]);
    }
  }, [open, moto]);

  async function onPhotos(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).map((file) => ({ url: "", signed: URL.createObjectURL(file), file }));
    setPhotos((p) => [...p, ...arr]);
  }
  async function removePhoto(idx: number) {
    const p = photos[idx];
    if (p.id) {
      await supabase.from("motorcycle_photos").delete().eq("id", p.id);
      if (p.url) await supabase.storage.from("motorcycle-photos").remove([p.url]);
    }
    setPhotos((arr) => arr.filter((_, i) => i !== idx));
  }

  async function save() {
    const parsed = motoSchema.safeParse({
      ...f,
      price_installment: f.price_installment || null,
      installment_count: f.installment_count || null,
      cost_price: f.cost_price || null,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    let id = moto?.id as string | undefined;
    if (id) {
      const { error } = await supabase.from("motorcycles").update(parsed.data).eq("id", id);
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      const { data, error } = await supabase.from("motorcycles").insert({ ...parsed.data, tenant_id: tenantId }).select("id").single();
      if (error || !data) { setSaving(false); return toast.error(error?.message || "Erro"); }
      id = data.id;
    }
    const news = photos.filter((p) => p.file);
    for (let i = 0; i < news.length; i++) {
      const p = news[i];
      const path = `${tenantId}/${id}/${Date.now()}_${i}_${p.file!.name.replace(/[^a-z0-9.\-_]/gi, "")}`;
      const { error } = await supabase.storage.from("motorcycle-photos").upload(path, p.file!);
      if (error) { toast.error("Falha no upload de foto"); continue; }
      await supabase.from("motorcycle_photos").insert({ motorcycle_id: id, url: path, sort_order: photos.indexOf(p) });
    }
    setSaving(false);
    toast.success("Salvo!"); onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{moto ? "Editar moto" : "Nova moto"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Marca"><Input value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} /></Field>
          <Field label="Modelo"><Input value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} /></Field>
          <Field label="Ano"><Input type="number" value={f.year} onChange={(e) => setF({ ...f, year: +e.target.value })} /></Field>
          <Field label="KM rodados"><Input type="number" value={f.km} onChange={(e) => setF({ ...f, km: +e.target.value })} /></Field>
          <Field label="Cor"><Input value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} /></Field>
          <Field label="Qtd. estoque"><Input type="number" value={f.stock_quantity} onChange={(e) => setF({ ...f, stock_quantity: +e.target.value })} /></Field>
          <Field label="Preço à vista (R$)"><Input type="number" step="0.01" value={f.price_cash} onChange={(e) => setF({ ...f, price_cash: +e.target.value })} /></Field>
          <Field label="Preço parcelado total (R$)"><Input type="number" step="0.01" value={f.price_installment} onChange={(e) => setF({ ...f, price_installment: +e.target.value })} /></Field>
          <Field label="Nº parcelas"><Input type="number" value={f.installment_count} onChange={(e) => setF({ ...f, installment_count: +e.target.value })} /></Field>
          <Field label="Preço de custo (privado)"><Input type="number" step="0.01" value={f.cost_price} onChange={(e) => setF({ ...f, cost_price: +e.target.value })} /></Field>
          <Field label="Status">
            <Select value={f.status} onValueChange={(v: any) => setF({ ...f, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="reserved">Reservada</SelectItem>
                <SelectItem value="sold">Vendida</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2"><Field label="Descrição"><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field></div>
          <div className="sm:col-span-2">
            <Label>Fotos</Label>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-md border border-border">
                  <img src={p.signed} className="h-full w-full object-cover" alt="" />
                  <button onClick={() => removePhoto(i)} className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground"><X className="size-3" /></button>
                </div>
              ))}
              <label className="grid aspect-square cursor-pointer place-items-center rounded-md border-2 border-dashed border-border text-muted-foreground hover:bg-muted">
                <ImagePlus className="size-6" />
                <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => onPhotos(e.target.files)} />
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving} className="bg-brand text-primary-foreground hover:opacity-90">{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="text-xs">{label}</Label><div className="mt-1">{children}</div></div>;
}

/* ============ LEADS ============ */
type OrderStatus = "pending" | "contacted" | "sold" | "cancelled";
function LeadsTab() { return <OrdersList filterStatus={["pending", "contacted"]} title="Interessados" allowSell />; }
function SoldTab() { return <OrdersList filterStatus={["sold"]} title="Vendidos" />; }

function OrdersList({ filterStatus, title, allowSell }: { filterStatus: OrderStatus[]; title: string; allowSell?: boolean }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [sellOrder, setSellOrder] = useState<any | null>(null);
  const [soldPrice, setSoldPrice] = useState<string>("");

  async function load() {
    const { data } = await supabase
      .from("orders")
      .select("*, motorcycles(brand, model, year, price_cash)")
      .in("status", filterStatus)
      .order("created_at", { ascending: false });
    setOrders(data ?? []);
  }
  useEffect(() => { load(); }, [filterStatus.join(",")]);

  async function updateStatus(id: string, status: OrderStatus) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado"); load();
  }

  async function confirmSell() {
    if (!sellOrder) return;
    const price = Number(soldPrice);
    if (!price || price <= 0) return toast.error("Informe um valor válido");
    const { error } = await supabase.from("orders").update({ status: "sold", sold_price: price }).eq("id", sellOrder.id);
    if (error) return toast.error(error.message);
    await supabase.from("motorcycles").update({ status: "sold" }).eq("id", sellOrder.motorcycle_id);
    toast.success("Venda registrada");
    setSellOrder(null); setSoldPrice(""); load();
  }

  const total = useMemo(() => orders.reduce((s, o) => s + (Number(o.sold_price) || 0), 0), [orders]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title} ({orders.length})</h2>
        {filterStatus.includes("sold") && <div className="text-sm text-muted-foreground">Total: <span className="font-bold text-foreground">{brl(total)}</span></div>}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead><TableHead>Contato</TableHead><TableHead>Moto</TableHead>
              <TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Nada por aqui</TableCell></TableRow>}
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <div className="font-semibold">{o.customer_name}</div>
                  {o.message && <div className="text-xs text-muted-foreground">{o.message}</div>}
                </TableCell>
                <TableCell><div className="text-sm">{o.customer_phone}</div><div className="text-xs text-muted-foreground">{o.customer_email}</div></TableCell>
                <TableCell>
                  <div className="text-sm font-medium">{o.motorcycles?.brand} {o.motorcycles?.model}</div>
                  <div className="text-xs text-muted-foreground">{o.motorcycles?.year} · {brl(Number(o.motorcycles?.price_cash))}</div>
                  {o.sold_price && <div className="text-xs font-semibold text-primary">Vendido: {brl(Number(o.sold_price))}</div>}
                </TableCell>
                <TableCell><span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold">{o.status}</span></TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {o.status === "pending" && <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, "contacted")}>Contatado</Button>}
                    {allowSell && o.status !== "sold" && <Button size="sm" className="bg-brand text-primary-foreground hover:opacity-90" onClick={() => { setSellOrder(o); setSoldPrice(String(o.motorcycles?.price_cash ?? "")); }}>Vender</Button>}
                    {o.status !== "cancelled" && o.status !== "sold" && <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, "cancelled")}>Cancelar</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!sellOrder} onOpenChange={(o) => !o && setSellOrder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar venda</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{sellOrder?.motorcycles?.brand} {sellOrder?.motorcycles?.model} para <strong>{sellOrder?.customer_name}</strong></p>
            <Field label="Valor da venda (R$)"><Input type="number" step="0.01" value={soldPrice} onChange={(e) => setSoldPrice(e.target.value)} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSellOrder(null)}>Cancelar</Button>
            <Button onClick={confirmSell} className="bg-brand text-primary-foreground hover:opacity-90">Confirmar venda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============ RECEIPTS ============ */
function ReceiptsTab({ tenantId }: { tenantId: string }) {
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [motos, setMotos] = useState<any[]>([]);
  const [f, setF] = useState<any>({ title: "", amount: "", doc_type: "receipt", notes: "", motorcycle_id: "" });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from("payment_receipts").select("*, motorcycles(brand, model)").order("created_at", { ascending: false });
    setList(data ?? []);
  }
  useEffect(() => {
    load();
    supabase.from("motorcycles").select("id, brand, model").eq("tenant_id", tenantId).then(({ data }) => setMotos(data ?? []));
  }, [tenantId]);

  async function save() {
    if (!file || !f.title) return toast.error("Informe título e arquivo");
    setSaving(true);
    const path = `${tenantId}/${Date.now()}_${file.name.replace(/[^a-z0-9.\-_]/gi, "")}`;
    const { error: upErr } = await supabase.storage.from("payment-receipts").upload(path, file);
    if (upErr) { setSaving(false); return toast.error(upErr.message); }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("payment_receipts").insert({
      tenant_id: tenantId,
      title: f.title,
      amount: f.amount ? Number(f.amount) : null,
      doc_type: f.doc_type,
      notes: f.notes || null,
      motorcycle_id: f.motorcycle_id || null,
      file_url: path,
      file_type: file.type.startsWith("image") ? "image" : file.type === "application/pdf" ? "pdf" : "other",
      uploaded_by: u.user?.id,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Comprovante salvo");
    setOpen(false); setF({ title: "", amount: "", doc_type: "receipt", notes: "", motorcycle_id: "" }); setFile(null);
    load();
  }

  async function open_(id: string) {
    const r = list.find((x) => x.id === id);
    const url = await signedUrl("payment-receipts", r.file_url, 60 * 60);
    window.open(url, "_blank");
  }

  async function del(r: any) {
    if (!confirm("Excluir comprovante?")) return;
    await supabase.storage.from("payment-receipts").remove([r.file_url]);
    await supabase.from("payment_receipts").delete().eq("id", r.id);
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Comprovantes e notas fiscais</h2>
        <Button onClick={() => setOpen(true)} className="bg-brand text-primary-foreground hover:opacity-90"><Plus className="mr-2 size-4" />Novo</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead><TableHead>Tipo</TableHead><TableHead>Moto</TableHead>
              <TableHead>Valor</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Nenhum documento</TableCell></TableRow>}
            {list.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>{r.doc_type === "invoice" ? "Nota fiscal" : "Comprovante"}</TableCell>
                <TableCell className="text-sm">{r.motorcycles ? `${r.motorcycles.brand} ${r.motorcycles.model}` : "—"}</TableCell>
                <TableCell>{r.amount ? brl(Number(r.amount)) : "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => open_(r.id)}>Abrir</Button>
                  <Button size="sm" variant="ghost" onClick={() => del(r)} className="ml-1"><Trash2 className="size-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo comprovante / NF</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Field label="Título"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
            <Field label="Tipo">
              <Select value={f.doc_type} onValueChange={(v) => setF({ ...f, doc_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receipt">Comprovante de pagamento</SelectItem>
                  <SelectItem value="invoice">Nota fiscal</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Moto (opcional)">
              <Select value={f.motorcycle_id || "none"} onValueChange={(v) => setF({ ...f, motorcycle_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {motos.map((m) => <SelectItem key={m.id} value={m.id}>{m.brand} {m.model}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Valor"><Input type="number" step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
            <Field label="Observações"><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
            <Field label="Arquivo (foto ou PDF)"><Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="bg-brand text-primary-foreground hover:opacity-90">
              <Upload className="mr-2 size-4" /> {saving ? "Enviando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============ SETTINGS ============ */
function SettingsTab({ tenantId }: { tenantId: string }) {
  const [s, setS] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from("store_settings").select("*").eq("tenant_id", tenantId).maybeSingle();
    if (data) {
      setS({ ...data, business_hours: data.business_hours || {} });
      if (data.logo_url) setLogoPreview(await signedUrl("store-assets", data.logo_url));
    }
  }
  useEffect(() => { load(); }, [tenantId]);

  if (!s) return <div className="text-muted-foreground">Carregando…</div>;

  function setHour(day: string, value: string) {
    setS({ ...s, business_hours: { ...s.business_hours, [day]: value } });
  }

  async function save() {
    setSaving(true);
    let logo_url = s.logo_url;
    if (logoFile) {
      const path = `${tenantId}/logo_${Date.now()}_${logoFile.name.replace(/[^a-z0-9.\-_]/gi, "")}`;
      const { error } = await supabase.storage.from("store-assets").upload(path, logoFile, { upsert: true });
      if (!error) logo_url = path;
    }
    const { error } = await supabase.from("store_settings").update({
      store_name: s.store_name,
      logo_url,
      motivational_phrase: s.motivational_phrase,
      address: s.address,
      latitude: s.latitude ? Number(s.latitude) : null,
      longitude: s.longitude ? Number(s.longitude) : null,
      whatsapp: s.whatsapp, phone: s.phone, email: s.email,
      instagram: s.instagram, facebook: s.facebook,
      business_hours: s.business_hours, about: s.about,
      theme_color: s.theme_color || null,
    }).eq("tenant_id", tenantId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas");
    setLogoFile(null); load();
  }

  const days: [string, string][] = [["seg","Segunda"],["ter","Terça"],["qua","Quarta"],["qui","Quinta"],["sex","Sexta"],["sab","Sábado"],["dom","Domingo"]];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h3 className="font-bold">Identidade</h3>
        <Field label="Nome da loja"><Input value={s.store_name || ""} onChange={(e) => setS({ ...s, store_name: e.target.value })} /></Field>
        <Field label="Frase motivadora (topo da loja)"><Input value={s.motivational_phrase || ""} onChange={(e) => setS({ ...s, motivational_phrase: e.target.value })} /></Field>
        <div>
          <Label>Logo</Label>
          <div className="mt-2 flex items-center gap-3">
            {logoPreview && <img src={logoPreview} className="size-16 rounded-lg border border-border object-cover" alt="" />}
            <Input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setLogoFile(f);
              if (f) setLogoPreview(URL.createObjectURL(f));
            }} />
          </div>
        </div>
        <Field label="Sobre"><Textarea rows={3} value={s.about || ""} onChange={(e) => setS({ ...s, about: e.target.value })} /></Field>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h3 className="font-bold">Contato e localização</h3>
        <Field label="Endereço"><Input value={s.address || ""} onChange={(e) => setS({ ...s, address: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude (opcional)"><Input type="number" step="0.0000001" value={s.latitude || ""} onChange={(e) => setS({ ...s, latitude: e.target.value })} /></Field>
          <Field label="Longitude (opcional)"><Input type="number" step="0.0000001" value={s.longitude || ""} onChange={(e) => setS({ ...s, longitude: e.target.value })} /></Field>
        </div>
        <p className="text-xs text-muted-foreground">Se não informar lat/lng, o mapa usa o endereço.</p>
        <Field label="WhatsApp (com DDD)"><Input value={s.whatsapp || ""} onChange={(e) => setS({ ...s, whatsapp: e.target.value })} /></Field>
        <Field label="Telefone"><Input value={s.phone || ""} onChange={(e) => setS({ ...s, phone: e.target.value })} /></Field>
        <Field label="E-mail"><Input value={s.email || ""} onChange={(e) => setS({ ...s, email: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Instagram"><Input value={s.instagram || ""} onChange={(e) => setS({ ...s, instagram: e.target.value })} /></Field>
          <Field label="Facebook"><Input value={s.facebook || ""} onChange={(e) => setS({ ...s, facebook: e.target.value })} /></Field>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-5 lg:col-span-2">
        <h3 className="font-bold">Horário de funcionamento</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {days.map(([k, label]) => (
            <Field key={k} label={label}>
              <Input value={s.business_hours[k] || ""} onChange={(e) => setHour(k, e.target.value)} placeholder="08:00-18:00 ou Fechado" />
            </Field>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-brand text-primary-foreground hover:opacity-90">{saving ? "Salvando…" : "Salvar tudo"}</Button>
      </div>
    </div>
  );
}
