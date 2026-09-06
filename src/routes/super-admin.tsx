import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sendPasswordReset } from "@/lib/admin-users.functions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ShieldCheck, LogOut, Store, AlertCircle, Pause, Play, Mail, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/super-admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Super Admin — Moda & Estilo" }] }),
  component: SuperAdminPage,
});

function SuperAdminPage() {
  const { user, isSuperAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Carregando…</div>;
  if (!user) return null;
  if (!isSuperAdmin) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <AlertCircle className="mx-auto mb-2 size-10 text-destructive" />
          <h2 className="text-xl font-bold">Sem permissão</h2>
          <p className="mt-2 text-muted-foreground">Esta área é exclusiva do super admin da plataforma.</p>
          <Button onClick={() => navigate({ to: "/admin" })} className="mt-4">Ir para meu painel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-md bg-graphite text-white"><ShieldCheck className="size-5" /></div>
            <div>
              <div className="text-sm font-bold">Super Admin · Moda & Estilo</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/"><Button variant="outline" size="sm">Site público</Button></Link>
            <Button variant="ghost" size="sm" onClick={() => signOut().then(() => navigate({ to: "/auth" }))}>
              <LogOut className="mr-2 size-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <TenantsOverview />
      </main>
    </div>
  );
}

function TenantsOverview() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const sendReset = useServerFn(sendPasswordReset);

  async function load() {
    const { data } = await supabase
      .from("tenants")
      .select("*, profiles!tenants_owner_profile_fkey(full_name, email)")
      .order("created_at", { ascending: false });
    setList(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const active = list.filter((t) => t.status === "active").length;

  async function toggle(t: any, status: string) {
    if (!confirm(status === "active" ? `Reativar a loja ${t.store_name}?` : `Suspender a loja ${t.store_name}?`)) return;
    const { error } = await supabase.from("tenants").update({ status: status as any }).eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado"); load();
  }

  async function resetPw(t: any) {
    const email = t.profiles?.email;
    if (!email) return toast.error("Esta dona não tem e-mail cadastrado");
    if (!confirm(`Enviar e-mail de redefinição de senha para ${email}?`)) return;
    try {
      await sendReset({ data: { email, redirectPath: "/reset-password" } });
      toast.success(`E-mail enviado para ${email}`);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao enviar");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Controle de lojas</h2>
        <p className="text-sm text-muted-foreground">
          Aqui você acompanha quantas lojas existem na plataforma e quais são. O cadastro é automático e gratuito —
          use esta tela apenas para controle, para reenviar o link de senha quando a lojista não conseguir pelo e-mail dela,
          e para suspender ou reativar uma loja.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Lojas cadastradas</span>
            <Store className="size-5 text-primary" />
          </div>
          <div className="mt-2 text-3xl font-extrabold">{list.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Lojas ativas</span>
            <CheckCircle2 className="size-5 text-primary" />
          </div>
          <div className="mt-2 text-3xl font-extrabold">{active}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Loja</TableHead><TableHead>Dona</TableHead><TableHead>Status</TableHead>
            <TableHead>Cadastro</TableHead><TableHead>Link</TableHead><TableHead className="text-right">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Carregando…</TableCell></TableRow>}
            {!loading && list.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Nenhuma loja ainda</TableCell></TableRow>}
            {list.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-semibold">{t.store_name}</TableCell>
                <TableCell><div className="text-sm">{t.profiles?.full_name}</div><div className="text-xs text-muted-foreground">{t.profiles?.email}</div></TableCell>
                <TableCell>
                  <span className={`rounded-md px-2 py-1 text-xs font-bold uppercase ${
                    t.status === "active" ? "bg-primary/15 text-primary" :
                    t.status === "suspended" ? "bg-destructive/15 text-destructive" :
                    t.status === "pending" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                  }`}>{t.status}</span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell><Link to="/loja/$slug" params={{ slug: t.slug }} className="text-xs text-primary hover:underline">/loja/{t.slug}</Link></TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => resetPw(t)}><Mail className="mr-1 size-3.5" />Redefinir senha</Button>
                  {t.status === "active"
                    ? <Button size="sm" variant="outline" className="ml-1" onClick={() => toggle(t, "suspended")}><Pause className="mr-1 size-3.5" />Suspender</Button>
                    : <Button size="sm" variant="outline" className="ml-1" onClick={() => toggle(t, "active")}><Play className="mr-1 size-3.5" />Reativar</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
