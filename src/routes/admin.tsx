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
  TrendingUp, Shirt, Users, CheckCircle2, DollarSign, Settings as Cog,
  Clock, AlertTriangle, ShieldAlert, ExternalLink, RefreshCw, Share2, Copy, Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line,
} from "recharts";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel da loja — Moda & Estilo" },
      { name: "description", content: "Gerencie peças, encomendas, vendas, comprovantes e as configurações da sua loja de roupas." },
      { property: "og:title", content: "Painel da loja — Moda & Estilo" },
      { property: "og:description", content: "Gerencie peças, encomendas, vendas e configurações da sua loja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
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
            <div className="grid size-9 place-items-center rounded-md bg-brand text-primary-foreground font-black">A</div>
            <div>
              <div className="text-sm font-bold">{tenant.store_name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            <TabsTrigger value="stock"><Shirt className="mr-2 size-4" />Peças</TabsTrigger>
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

function PendingScreen({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-hero p-6 text-center text-white">
      <div className="max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur">
        <Clock className="mx-auto mb-3 size-12 text-primary-foreground" />
        <h2 className="text-2xl font-bold">Aguardando aprovação</h2>
        <p className="mt-2 text-white/80">
          Olá, <strong>{email}</strong>. Seu cadastro foi recebido e está aguardando a liberação do administrador.
        </p>
        <p className="mt-3 text-sm text-white/70">
          A liberação acontece em até <strong>12 horas</strong>. O uso do Moda & Estilo é totalmente gratuito.
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
          A loja <strong>{tenant.store_name}</strong> está suspensa pelo administrador.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">Conta: {email}</p>
        <div className="mt-6 space-y-2">
          <Button onClick={onRenew} size="lg" className="w-full bg-brand text-primary-foreground hover:opacity-90">
            <RefreshCw className="mr-2 size-4" /> Solicitar reativação
          </Button>
          <Button onClick={onSignOut} variant="ghost" className="w-full">Sair</Button>
        </div>
      </div>
    </div>
  );
}

/* ============ DASHBOARD ============ */
type Cycle = {
  id: string; tenant_id: string; label: string | null; started_at: string; closed_at: string | null;
  revenue: number; cost: number; profit: number; sales_count: number;
};

const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

function DashboardTab({ tenantId }: { tenantId: string }) {
  const [stats, setStats] = useState({ stock: 0, pending: 0, sold: 0, revenue: 0, cost: 0 });
  const [byMonth, setByMonth] = useState<{ month: string; sales: number; profit: number; count: number }[]>([]);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [history, setHistory] = useState<Cycle[]>([]);
  const [histOpen, setHistOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, [tenantId]);

  async function ensureCycle(): Promise<Cycle | null> {
    const { data: open } = await supabase
      .from("profit_cycles").select("*").eq("tenant_id", tenantId).is("closed_at", null).maybeSingle();
    if (open) return open as Cycle;
    const { data: created } = await supabase
      .from("profit_cycles")
      .insert({ tenant_id: tenantId, label: monthLabel(new Date().toISOString().slice(0, 7)) })
      .select("*").maybeSingle();
    return (created as Cycle) ?? null;
  }

  async function load() {
    const cur = await ensureCycle();
    setCycle(cur);

    const [{ count: stock }, { count: pending }, { data: sold }, { data: costs }, { data: closed }] = await Promise.all([
      supabase.from("motorcycles").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "available"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "pending"),
      supabase.from("orders").select("sold_price, updated_at, motorcycle_id").eq("tenant_id", tenantId).eq("status", "sold"),
      supabase.from("product_costs").select("motorcycle_id, cost_price").eq("tenant_id", tenantId),
      supabase.from("profit_cycles").select("*").eq("tenant_id", tenantId).not("closed_at", "is", null).order("started_at", { ascending: false }),
    ]);

    setHistory((closed ?? []) as Cycle[]);

    const costMap: Record<string, number> = {};
    (costs ?? []).forEach((c: any) => { costMap[c.motorcycle_id] = Number(c.cost_price) || 0; });

    const cycleStart = cur ? new Date(cur.started_at).getTime() : 0;
    let revenue = 0; let cost = 0; let soldCount = 0;
    const byM: Record<string, { sales: number; profit: number; count: number }> = {};

    (sold ?? []).forEach((o: any) => {
      const price = Number(o.sold_price) || 0;
      const c = costMap[o.motorcycle_id] || 0;
      const d = new Date(o.updated_at);
      // painel atual = somente vendas do ciclo aberto
      if (d.getTime() >= cycleStart) { revenue += price; cost += c; soldCount += 1; }
      // histórico completo por mês (nunca é zerado)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byM[k] = byM[k] || { sales: 0, profit: 0, count: 0 };
      byM[k].sales += price;
      byM[k].profit += price - c;
      byM[k].count += 1;
    });

    setStats({ stock: stock || 0, pending: pending || 0, sold: soldCount, revenue, cost });
    setByMonth(Object.entries(byM).sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v })));
  }

  async function resetProfit() {
    if (!cycle) return;
    setBusy(true);
    const profit = stats.revenue - stats.cost;
    const { error: closeErr } = await supabase.from("profit_cycles").update({
      closed_at: new Date().toISOString(),
      revenue: stats.revenue, cost: stats.cost, profit, sales_count: stats.sold,
    }).eq("id", cycle.id);
    if (closeErr) { setBusy(false); return toast.error(closeErr.message); }
    const { error: newErr } = await supabase.from("profit_cycles").insert({
      tenant_id: tenantId,
      label: monthLabel(new Date().toISOString().slice(0, 7)),
    });
    setBusy(false);
    setResetOpen(false);
    if (newErr) return toast.error(newErr.message);
    toast.success("Painel de lucros zerado. O histórico foi preservado.");
    load();
  }

  const margin = stats.revenue > 0 ? ((stats.revenue - stats.cost) / stats.revenue) * 100 : 0;
  const allTimeProfit = byMonth.reduce((a, m) => a + m.profit, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
        <div className="text-sm">
          <div className="font-semibold">Período atual de lucros</div>
          <div className="text-muted-foreground">
            Desde {cycle ? new Date(cycle.started_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setHistOpen(true)}>
            <Clock className="mr-2 size-4" /> Histórico de lucros (mês a mês)
          </Button>
          <Button size="sm" className="bg-brand text-primary-foreground hover:opacity-90" onClick={() => setResetOpen(true)}>
            <RefreshCw className="mr-2 size-4" /> Iniciar novo mês (zerar lucros)
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Shirt className="size-5" />} label="Peças em estoque" value={stats.stock} />
        <Stat icon={<Users className="size-5" />} label="Interessados ativos" value={stats.pending} />
        <Stat icon={<CheckCircle2 className="size-5" />} label="Vendas no período" value={stats.sold} />
        <Stat icon={<DollarSign className="size-5" />} label="Faturamento do período" value={brl(stats.revenue)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="text-sm text-muted-foreground">Lucro do período</div>
          <div className="mt-1 text-2xl font-extrabold text-primary">{brl(stats.revenue - stats.cost)}</div>
          <div className="mt-1 text-xs text-muted-foreground">Custo total: {brl(stats.cost)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="text-sm text-muted-foreground">Margem de lucro</div>
          <div className="mt-1 text-2xl font-extrabold">{margin.toFixed(1)}%</div>
          <div className="mt-1 text-xs text-muted-foreground">Lucro / Faturamento</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="text-sm text-muted-foreground">Lucro total desde a abertura</div>
          <div className="mt-1 text-2xl font-extrabold">{brl(allTimeProfit)}</div>
          <div className="mt-1 text-xs text-muted-foreground">Nunca é zerado</div>
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

      {/* Histórico mês a mês */}
      <Dialog open={histOpen} onOpenChange={setHistOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Histórico de lucros desde a abertura da loja</DialogTitle></DialogHeader>
          {byMonth.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma venda registrada ainda.</p>
          ) : (
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Faturamento</TableHead>
                    <TableHead>Lucro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...byMonth].reverse().map((m) => (
                    <TableRow key={m.month}>
                      <TableCell className="capitalize">{monthLabel(m.month)}</TableCell>
                      <TableCell>{m.count}</TableCell>
                      <TableCell>{brl(m.sales)}</TableCell>
                      <TableCell className="font-semibold text-primary">{brl(m.profit)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {history.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <div className="mb-2 text-sm font-semibold">Períodos fechados pelo lojista</div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {history.map((c) => (
                  <li key={c.id} className="flex justify-between gap-4">
                    <span>
                      {new Date(c.started_at).toLocaleDateString("pt-BR")} → {c.closed_at ? new Date(c.closed_at).toLocaleDateString("pt-BR") : "—"}
                    </span>
                    <span className="font-semibold text-foreground">{brl(Number(c.profit))}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmar zerar */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Iniciar novo mês?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            O painel de lucros voltará a zero para as próximas vendas. O lucro atual de{" "}
            <strong className="text-foreground">{brl(stats.revenue - stats.cost)}</strong> será guardado no histórico e continuará
            visível no botão “Histórico de lucros”.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancelar</Button>
            <Button disabled={busy} className="bg-brand text-primary-foreground hover:opacity-90" onClick={resetProfit}>
              {busy ? "Zerando…" : "Zerar e começar novo mês"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
const pieceSchema = z.object({
  brand: z.string().trim().max(60).default(""),
  model: z.string().trim().min(1, "Informe o nome da peça").max(80),
  piece_type: z.string().trim().max(40).optional().nullable(),
  size: z.string().trim().max(20).optional().nullable(),
  material: z.string().trim().max(60).optional().nullable(),
  gender: z.string().trim().max(30).optional().nullable(),
  gift: z.string().trim().max(120).optional().nullable(),
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
    if (!confirm("Excluir esta peça e suas fotos?")) return;
    const { error } = await supabase.from("motorcycles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Peça removida"); load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Peças</h2>
          <p className="text-sm text-muted-foreground">{list.length} peças cadastradas</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="bg-brand text-primary-foreground hover:opacity-90">
          <Plus className="mr-2 size-4" /> Nova peça
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
                  {m.brand && <div className="text-xs font-semibold uppercase text-primary">{m.brand}</div>}
                  <div className="font-bold">{m.model}</div>
                  <div className="text-xs text-muted-foreground">
                    {[m.piece_type, m.size ? `Tam. ${m.size}` : null, m.color].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${m.status === "available" ? "bg-primary/15 text-primary" : m.status === "sold" ? "bg-muted text-muted-foreground" : "bg-accent text-accent-foreground"}`}>
                  {m.status === "available" ? "Disponível" : m.status === "sold" ? "Vendida" : "Reservada"}
                </span>
              </div>
              <div className="mt-2 font-bold">{brl(Number(m.price_cash))}</div>
              <div className={`mt-1 text-xs font-semibold ${Number(m.stock_quantity) > 0 ? "text-primary" : "text-muted-foreground"}`}>
                {Number(m.stock_quantity) > 0
                  ? `${m.stock_quantity} ${Number(m.stock_quantity) === 1 ? "peça disponível" : "peças disponíveis"}`
                  : "Sem estoque"}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditing(m); setOpen(true); }}><Edit2 className="size-3.5" /></Button>
                <Button size="sm" variant="outline" onClick={() => remove(m.id)}><Trash2 className="size-3.5" /></Button>
                <Link to="/produto/$id" params={{ id: m.id }} className="ml-auto text-xs text-primary hover:underline self-center">Ver página →</Link>
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
    brand: "", model: "", piece_type: "", size: "", material: "", gender: "", gift: "",
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
        brand: moto.brand || "", model: moto.model,
        piece_type: moto.piece_type || "", size: moto.size || "",
        material: moto.material || "", gender: moto.gender || "", gift: moto.gift || "",
        price_cash: Number(moto.price_cash), price_installment: Number(moto.price_installment) || 0,
        installment_count: moto.installment_count || 12, cost_price: 0,
        description: moto.description || "", color: moto.color || "",
        stock_quantity: moto.stock_quantity, status: moto.status,
      });
      supabase.from("product_costs").select("cost_price").eq("motorcycle_id", moto.id).maybeSingle()
        .then(({ data }) => { if (data) setF((prev: any) => ({ ...prev, cost_price: Number(data.cost_price) || 0 })); });
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
    const parsed = pieceSchema.safeParse({
      ...f,
      brand: f.brand || "",
      piece_type: f.piece_type || null,
      size: f.size || null,
      material: f.material || null,
      gender: f.gender || null,
      gift: f.gift || null,
      price_installment: f.price_installment || null,
      installment_count: f.installment_count || null,
      cost_price: f.cost_price || null,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    // cost_price fica em tabela privada (product_costs), nunca no catálogo público
    const { cost_price, ...productData } = parsed.data;
    let id = moto?.id as string | undefined;
    if (id) {
      const { error } = await supabase.from("motorcycles").update(productData).eq("id", id);
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      const { data, error } = await supabase.from("motorcycles").insert({ ...productData, tenant_id: tenantId }).select("id").single();
      if (error || !data) { setSaving(false); return toast.error(error?.message || "Erro"); }
      id = data.id;
    }
    if (cost_price == null) {
      await supabase.from("product_costs").delete().eq("motorcycle_id", id);
    } else {
      await supabase.from("product_costs").upsert({ motorcycle_id: id, tenant_id: tenantId, cost_price }, { onConflict: "motorcycle_id" });
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
        <DialogHeader><DialogTitle>{moto ? "Editar peça" : "Nova peça"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome da peça"><Input value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} placeholder="Vestido midi floral" /></Field>
          <Field label="Tipo de peça">
            <Select value={f.piece_type || "none"} onValueChange={(v) => setF({ ...f, piece_type: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não informar</SelectItem>
                {["Vestido","Blusa","Camisa","Camiseta","Short","Calça","Saia","Conjunto","Macacão","Jaqueta","Body","Biquíni","Pijama","Acessório","Calçado"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Tamanho"><Input value={f.size} onChange={(e) => setF({ ...f, size: e.target.value })} placeholder="P, M, G, 38, 40…" /></Field>
          <Field label="Marca (opcional)"><Input value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} /></Field>
          <Field label="Cor"><Input value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} /></Field>
          <Field label="Tecido / material"><Input value={f.material} onChange={(e) => setF({ ...f, material: e.target.value })} placeholder="Algodão, viscose, linho…" /></Field>
          <Field label="Gênero">
            <Select value={f.gender || "none"} onValueChange={(v) => setF({ ...f, gender: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não informar</SelectItem>
                {["Feminino","Masculino","Unissex","Infantil"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Brinde incluso (opcional)"><Input value={f.gift} onChange={(e) => setF({ ...f, gift: e.target.value })} placeholder="Ex.: par de brincos" /></Field>
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
      .select("*, motorcycles(brand, model, piece_type, size, price_cash)")
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
              <TableHead>Cliente</TableHead><TableHead>Contato</TableHead><TableHead>Peça</TableHead>
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
                  <div className="text-sm font-medium">{o.motorcycles?.model}</div>
                  <div className="text-xs text-muted-foreground">
                    {[o.motorcycles?.piece_type, o.motorcycles?.size ? `Tam. ${o.motorcycles.size}` : null].filter(Boolean).join(" · ")} · {brl(Number(o.motorcycles?.price_cash))}
                  </div>
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
            <p className="text-sm text-muted-foreground">{sellOrder?.motorcycles?.model} para <strong>{sellOrder?.customer_name}</strong></p>
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
    supabase.from("motorcycles").select("id, model").eq("tenant_id", tenantId).then(({ data }) => setMotos(data ?? []));
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
              <TableHead>Título</TableHead><TableHead>Tipo</TableHead><TableHead>Peça</TableHead>
              <TableHead>Valor</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Nenhum documento</TableCell></TableRow>}
            {list.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>{r.doc_type === "invoice" ? "Nota fiscal" : "Comprovante"}</TableCell>
                <TableCell className="text-sm">{r.motorcycles ? r.motorcycles.model : "—"}</TableCell>
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
            <Field label="Peça (opcional)">
              <Select value={f.motorcycle_id || "none"} onValueChange={(v) => setF({ ...f, motorcycle_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {motos.map((m) => <SelectItem key={m.id} value={m.id}>{m.model}</SelectItem>)}
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
      const ext = (logoFile.name.split(".").pop() || "png").replace(/[^a-z0-9]/gi, "").toLowerCase();
      const path = `${tenantId}/logo_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("store-assets")
        .upload(path, logoFile, { upsert: true, contentType: logoFile.type || undefined, cacheControl: "3600" });
      if (upErr) {
        setSaving(false);
        return toast.error(`Não foi possível enviar a logo: ${upErr.message}`);
      }
      logo_url = path;
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
      theme_bg: s.theme_bg || null,
      theme_text: s.theme_text || null,
      theme_card: s.theme_card || null,
      theme_button: s.theme_button || null,
      theme_hero: s.theme_hero || null,
      theme_header: s.theme_header || null,
      theme_footer: s.theme_footer || null,
    }).eq("tenant_id", tenantId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(logoFile ? "Configurações e logo salvas" : "Configurações salvas");
    setLogoFile(null);
    setS((prev: any) => ({ ...prev, logo_url }));
    if (logo_url) setLogoPreview(await signedUrl("store-assets", logo_url));
    load();
  }

  async function removeLogo() {
    const { error } = await supabase.from("store_settings").update({ logo_url: null }).eq("tenant_id", tenantId);
    if (error) return toast.error(error.message);
    setLogoFile(null); setLogoPreview(""); setS({ ...s, logo_url: null });
    toast.success("Logo removida");
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
            {logoPreview && <img src={logoPreview} className="size-16 rounded-lg border border-border object-cover" alt="Logo atual da loja" />}
            <Input type="file" accept="image/*,.png,.jpg,.jpeg,.webp,.avif,.gif,.svg,.bmp,.heic,.heif" onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setLogoFile(f);
              if (f) setLogoPreview(URL.createObjectURL(f));
            }} />
            {(logoPreview || s.logo_url) && (
              <Button variant="ghost" size="sm" onClick={removeLogo}>Remover</Button>
            )}
          </div>
          {logoFile && <p className="mt-1 text-xs text-primary">Clique em “Salvar tudo” para aplicar a nova logo na loja.</p>}
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

      <div className="space-y-4 rounded-xl border border-border bg-card p-5 lg:col-span-2">
        <h3 className="font-bold">Paleta de cores da loja</h3>
        <p className="text-sm text-muted-foreground">Escolha a cor principal que aparecerá no site público da sua loja (botões, destaques e banner).</p>
        <div className="flex flex-wrap gap-3">
          {[
            { name: "Verde lima", value: "#84cc16" },
            { name: "Azul oceano", value: "#2563eb" },
            { name: "Roxo real", value: "#7c3aed" },
            { name: "Rosa vibrante", value: "#ec4899" },
            { name: "Vermelho fogo", value: "#dc2626" },
            { name: "Laranja pôr do sol", value: "#f97316" },
            { name: "Âmbar dourado", value: "#f59e0b" },
            { name: "Esmeralda", value: "#10b981" },
            { name: "Ciano", value: "#06b6d4" },
            { name: "Índigo", value: "#4f46e5" },
            { name: "Grafite", value: "#334155" },
            { name: "Preto premium", value: "#0f172a" },
          ].map((c) => {
            const active = (s.theme_color || "").toLowerCase() === c.value.toLowerCase();
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setS({ ...s, theme_color: c.value })}
                title={c.name}
                className={`h-12 w-12 rounded-full border-2 shadow-soft transition-transform hover:scale-110 ${active ? "border-foreground ring-2 ring-offset-2 ring-foreground" : "border-border"}`}
                style={{ backgroundColor: c.value }}
                aria-label={c.name}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <Label>Ou personalize:</Label>
          <input
            type="color"
            value={s.theme_color || "#84cc16"}
            onChange={(e) => setS({ ...s, theme_color: e.target.value })}
            className="h-10 w-16 cursor-pointer rounded border border-border bg-transparent"
          />
          <Input
            value={s.theme_color || ""}
            onChange={(e) => setS({ ...s, theme_color: e.target.value })}
            placeholder="#84cc16"
            className="max-w-[160px] font-mono"
          />
          {s.theme_color && (
            <Button variant="ghost" size="sm" onClick={() => setS({ ...s, theme_color: null })}>Limpar</Button>
          )}
        </div>

        <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
          {([
            { key: "theme_bg", label: "Cor de fundo da loja", def: "#ffffff" },
            { key: "theme_text", label: "Cor dos textos", def: "#0f172a" },
            { key: "theme_card", label: "Cor dos cards / caixas", def: "#ffffff" },
            { key: "theme_button", label: "Cor dos botões (WhatsApp, etc.)", def: "#25d366" },
            { key: "theme_hero", label: "Cor do banner (topo)", def: "#0f172a" },
            { key: "theme_header", label: "Cor do cabeçalho", def: "#ffffff" },
            { key: "theme_footer", label: "Cor do rodapé", def: "#0f172a" },
          ] as const).map((f) => (
            <ThemeColorField
              key={f.key}
              label={f.label}
              def={f.def}
              value={(s as any)[f.key] || ""}
              onChange={(v) => setS({ ...s, [f.key]: v })}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Deixe em branco para usar as cores derivadas automaticamente da cor principal.</p>
      </div>

      <div className="lg:col-span-2 flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-brand text-primary-foreground hover:opacity-90">{saving ? "Salvando…" : "Salvar tudo"}</Button>
      </div>
    </div>
  );
}

function parseGradient(v: string): { c1: string; c2: string; angle: number } | null {
  const m = v.match(/linear-gradient\(\s*(-?\d+)deg\s*,\s*(#[0-9a-fA-F]{3,8})\s*,\s*(#[0-9a-fA-F]{3,8})\s*\)/);
  if (!m) return null;
  return { angle: parseInt(m[1], 10), c1: m[2], c2: m[3] };
}

function ThemeColorField({
  label, def, value, onChange,
}: { label: string; def: string; value: string; onChange: (v: string | null) => void }) {
  const grad = parseGradient(value);
  const isGrad = !!grad;
  const [angle, setAngle] = useState<number>(grad?.angle ?? 135);
  const [c1, setC1] = useState<string>(grad?.c1 ?? (value.startsWith("#") ? value : def));
  const [c2, setC2] = useState<string>(grad?.c2 ?? def);

  useEffect(() => {
    if (isGrad && grad) { setAngle(grad.angle); setC1(grad.c1); setC2(grad.c2); }
  }, [value]);

  const toggleGradient = () => {
    if (isGrad) {
      onChange(c1);
    } else {
      const first = value.startsWith("#") ? value : def;
      setC1(first);
      onChange(`linear-gradient(${angle}deg, ${first}, ${c2})`);
    }
  };

  const updateGrad = (nA: number, nC1: string, nC2: string) => {
    setAngle(nA); setC1(nC1); setC2(nC2);
    onChange(`linear-gradient(${nA}deg, ${nC1}, ${nC2})`);
  };

  return (
    <div className="space-y-2 rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant={isGrad ? "default" : "outline"}
          size="sm"
          onClick={toggleGradient}
          className={isGrad ? "bg-brand text-primary-foreground hover:opacity-90" : ""}
        >
          {isGrad ? "Degradê ativo" : "Degradê"}
        </Button>
      </div>

      <div className="h-8 w-full rounded border border-border" style={{ background: value || def }} />

      {!isGrad ? (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value || def}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent"
          />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder={def}
            className="font-mono"
          />
          {value && (
            <Button variant="ghost" size="sm" onClick={() => onChange(null)}>×</Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-14 text-xs text-muted-foreground">Cor 1</span>
            <input type="color" value={c1} onChange={(e) => updateGrad(angle, e.target.value, c2)} className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent" />
            <Input value={c1} onChange={(e) => updateGrad(angle, e.target.value, c2)} className="font-mono" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-14 text-xs text-muted-foreground">Cor 2</span>
            <input type="color" value={c2} onChange={(e) => updateGrad(angle, c1, e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent" />
            <Input value={c2} onChange={(e) => updateGrad(angle, c1, e.target.value)} className="font-mono" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-14 text-xs text-muted-foreground">Ângulo</span>
            <input
              type="range" min={0} max={360} value={angle}
              onChange={(e) => updateGrad(parseInt(e.target.value, 10), c1, c2)}
              className="flex-1"
            />
            <span className="w-12 text-right font-mono text-xs">{angle}°</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>Limpar</Button>
        </div>
      )}
    </div>
  );
}
