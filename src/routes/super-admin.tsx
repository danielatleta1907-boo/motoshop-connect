import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { brl } from "@/lib/format";
import { sendPasswordReset, setUserPassword } from "@/lib/admin-users.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  ShieldCheck, LogOut, Inbox, Check, X as XIcon, FileText, Store, RefreshCw,
  AlertCircle, ExternalLink, Pause, Play, Trash2, Receipt, KeyRound, Mail,
} from "lucide-react";

export const Route = createFileRoute("/super-admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Super Admin — MotoStore" }] }),
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
              <div className="text-sm font-bold">Super Admin · MotoStore SaaS</div>
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
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending"><Inbox className="mr-2 size-4" />Pendentes</TabsTrigger>
            <TabsTrigger value="tenants"><Store className="mr-2 size-4" />Lojas</TabsTrigger>
            <TabsTrigger value="proofs"><FileText className="mr-2 size-4" />Histórico de comprovantes</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6"><PendingTab /></TabsContent>
          <TabsContent value="tenants" className="mt-6"><TenantsTab /></TabsContent>
          <TabsContent value="proofs" className="mt-6"><AllProofsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ============ PENDENTES (cadastros novos + renovações) ============ */
function PendingTab() {
  const [proofs, setProofs] = useState<any[]>([]);
  const [view, setView] = useState<any | null>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("payment_proofs")
      .select("*, profiles!payment_proofs_user_profile_fkey(full_name, email), tenants:tenant_id(id, slug, store_name, status)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    setProofs((data ?? []).map((p: any) => ({ ...p, profiles: p.profiles })));
  }
  useEffect(() => { load(); }, []);

  async function openProof(p: any) {
    setView(p);
    if (p.file_url) setFileUrl(await signedUrl("payment-proofs", p.file_url, 60 * 60));
  }

  async function approveNew(p: any) {
    setBusy(true);
    const { error } = await supabase.rpc("approve_subscriber", {
      p_user_id: p.user_id,
      p_slug: p.desired_slug,
      p_store_name: p.desired_store_name,
      p_proof_id: p.id,
      p_months: p.period_months || 1,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Lojista aprovado! Loja ativada.");
    setView(null); load();
  }

  async function renew(p: any) {
    setBusy(true);
    const { error } = await supabase.rpc("renew_tenant", {
      p_tenant_id: p.tenant_id || p.tenants?.id,
      p_proof_id: p.id,
      p_months: p.period_months || 1,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Renovação confirmada!");
    setView(null); load();
  }

  async function reject(p: any) {
    const reason = prompt("Motivo da rejeição (será registrado):");
    if (reason === null) return;
    setBusy(true);
    const isNew = !p.tenant_id && p.desired_slug;
    const { error } = isNew
      ? await supabase.rpc("reject_subscriber", { p_user_id: p.user_id, p_proof_id: p.id, p_reason: reason })
      : await supabase.from("payment_proofs").update({ status: "rejected", reviewer_notes: reason }).eq("id", p.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Comprovante rejeitado");
    setView(null); load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Pendentes ({proofs.length})</h2>
          <p className="text-sm text-muted-foreground">Novos cadastros e renovações aguardando aprovação.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-2 size-4" />Atualizar</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Solicitante</TableHead><TableHead>Tipo</TableHead><TableHead>Loja</TableHead>
            <TableHead>Valor</TableHead><TableHead>Meses</TableHead><TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {proofs.length === 0 && <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Nenhuma solicitação pendente</TableCell></TableRow>}
            {proofs.map((p) => {
              const isNew = !p.tenant_id;
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-semibold">{p.profiles?.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{p.profiles?.email}</div>
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-md px-2 py-1 text-xs font-bold uppercase ${isNew ? "bg-primary/15 text-primary" : "bg-accent text-accent-foreground"}`}>
                      {isNew ? "Novo" : "Renovação"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{isNew ? p.desired_store_name : p.tenants?.store_name}</div>
                    <div className="text-xs text-muted-foreground">/loja/{isNew ? p.desired_slug : p.tenants?.slug}</div>
                  </TableCell>
                  <TableCell className="font-semibold">{brl(Number(p.amount))}</TableCell>
                  <TableCell>{p.period_months}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openProof(p)}>Analisar</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!view} onOpenChange={(o) => { if (!o) { setView(null); setFileUrl(""); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {view && (
            <>
              <DialogHeader>
                <DialogTitle>Analisar comprovante</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
                <div className="space-y-2 text-sm">
                  <Info label="Solicitante" v={`${view.profiles?.full_name || "—"} (${view.profiles?.email})`} />
                  <Info label="Tipo" v={!view.tenant_id ? "Novo cadastro" : "Renovação"} />
                  <Info label="Loja" v={view.tenant_id ? view.tenants?.store_name : view.desired_store_name} />
                  <Info label="Slug" v={`/loja/${view.tenant_id ? view.tenants?.slug : view.desired_slug}`} />
                  <Info label="Valor pago" v={brl(Number(view.amount))} />
                  <Info label="Meses" v={String(view.period_months)} />
                  {view.notes && <Info label="Obs. do lojista" v={view.notes} />}
                </div>
                <div className="space-y-2">
                  {fileUrl ? (
                    <>
                      {view.file_type === "image" ? (
                        <a href={fileUrl} target="_blank" rel="noreferrer">
                          <img src={fileUrl} alt="comprovante" className="w-full rounded-md border border-border" />
                        </a>
                      ) : view.file_type === "pdf" ? (
                        <iframe src={fileUrl} className="h-72 w-full rounded-md border border-border" title="comprovante" />
                      ) : (
                        <div className="grid h-40 place-items-center rounded-md border border-dashed border-border text-xs text-muted-foreground">Pré-visualização indisponível — use os botões abaixo</div>
                      )}
                      <div className="flex gap-2">
                        <a href={fileUrl} target="_blank" rel="noreferrer" className="flex-1">
                          <Button variant="outline" className="w-full"><ExternalLink className="mr-2 size-4" />Abrir em nova aba</Button>
                        </a>
                        <a href={fileUrl} download className="flex-1">
                          <Button variant="outline" className="w-full">Baixar</Button>
                        </a>
                      </div>
                    </>
                  ) : <div className="grid h-40 place-items-center rounded-md border border-dashed border-border text-xs text-muted-foreground">Sem arquivo</div>}
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => reject(view)} disabled={busy} className="text-destructive">
                  <XIcon className="mr-2 size-4" />Rejeitar
                </Button>
                {view.tenant_id ? (
                  <Button onClick={() => renew(view)} disabled={busy} className="bg-brand text-primary-foreground hover:opacity-90">
                    <Check className="mr-2 size-4" />Confirmar renovação
                  </Button>
                ) : (
                  <Button onClick={() => approveNew(view)} disabled={busy} className="bg-brand text-primary-foreground hover:opacity-90">
                    <Check className="mr-2 size-4" />Aprovar e ativar loja
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, v }: { label: string; v: any }) {
  return (
    <div className="rounded-md border border-border bg-card p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="font-medium">{v ?? "—"}</div>
    </div>
  );
}

/* ============ LOJAS ============ */
function TenantsTab() {
  const [list, setList] = useState<any[]>([]);
  const [proofView, setProofView] = useState<any | null>(null);
  const [proofFileUrl, setProofFileUrl] = useState<string>("");
  const [pwTarget, setPwTarget] = useState<any | null>(null);
  const [newPw, setNewPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const sendReset = useServerFn(sendPasswordReset);
  const setPw = useServerFn(setUserPassword);

  async function load() {
    const { data } = await supabase
      .from("tenants")
      .select("*, profiles!tenants_owner_profile_fkey(full_name, email)")
      .order("created_at", { ascending: false });
    setList(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function openTenantProof(t: any) {
    const { data, error } = await supabase
      .from("payment_proofs")
      .select("*")
      .or(`tenant_id.eq.${t.id},user_id.eq.${t.owner_id}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (error || !data) {
      setProofView({ none: true, store_name: t.store_name });
      setProofFileUrl("");
      return;
    }
    setProofView(data);
    if (data.file_url) setProofFileUrl(await signedUrl("payment-proofs", data.file_url, 60 * 60));
    else setProofFileUrl("");
  }

  async function toggle(t: any, status: string) {
    if (!confirm(`Mudar status para ${status}?`)) return;
    const { error } = await supabase.from("tenants").update({ status: status as any }).eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado"); load();
  }
  async function del(t: any) {
    if (!confirm(`EXCLUIR permanentemente a loja ${t.store_name} e seu usuário? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.rpc("reject_subscriber", { p_user_id: t.owner_id, p_proof_id: "00000000-0000-0000-0000-000000000000", p_reason: "deleted by super admin" });
    if (error) {
      await supabase.from("tenants").update({ status: "cancelled" }).eq("id", t.id);
    }
    toast.success("Loja removida"); load();
  }

  async function resetPw(t: any) {
    const email = t.profiles?.email;
    if (!email) return toast.error("Este dono não tem e-mail cadastrado");
    if (!confirm(`Enviar e-mail de redefinição de senha para ${email}?`)) return;
    try {
      await sendReset({ data: { email, redirectTo: `${window.location.origin}/reset-password` } });
      toast.success(`E-mail enviado para ${email}`);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao enviar");
    }
  }

  async function submitNewPw() {
    if (!pwTarget) return;
    if (newPw.length < 8) return toast.error("A senha precisa ter ao menos 8 caracteres");
    setPwBusy(true);
    try {
      await setPw({ data: { userId: pwTarget.owner_id, password: newPw } });
      toast.success("Senha atualizada. Repasse-a com segurança ao lojista e peça que ele troque no primeiro acesso.");
      setPwTarget(null); setNewPw("");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao definir senha");
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">Lojas ({list.length})</h2>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Loja</TableHead><TableHead>Dono</TableHead><TableHead>Status</TableHead>
            <TableHead>Vencimento</TableHead><TableHead>Slug</TableHead><TableHead className="text-right">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {list.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Nenhuma loja ainda</TableCell></TableRow>}
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
                <TableCell className="text-sm">{t.subscription_due_date ? new Date(t.subscription_due_date).toLocaleDateString("pt-BR") : "—"}</TableCell>
                <TableCell><Link to="/loja/$slug" params={{ slug: t.slug }} className="text-xs text-primary hover:underline">/loja/{t.slug}</Link></TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => openTenantProof(t)}><Receipt className="mr-1 size-3.5" />Comprovante</Button>
                  {t.status === "active"
                    ? <Button size="sm" variant="outline" className="ml-1" onClick={() => toggle(t, "suspended")}><Pause className="mr-1 size-3.5" />Suspender</Button>
                    : <Button size="sm" variant="outline" className="ml-1" onClick={() => toggle(t, "active")}><Play className="mr-1 size-3.5" />Reativar</Button>}
                  <Button size="sm" variant="ghost" className="ml-1 text-destructive" onClick={() => del(t)}><Trash2 className="size-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!proofView} onOpenChange={(o) => { if (!o) { setProofView(null); setProofFileUrl(""); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {proofView && (
            <>
              <DialogHeader>
                <DialogTitle>Comprovante — {proofView.none ? proofView.store_name : (proofView.tenants?.store_name || "Loja")}</DialogTitle>
              </DialogHeader>
              {proofView.none ? (
                <div className="grid h-48 place-items-center rounded-md border border-dashed border-border text-muted-foreground">
                  <div className="text-center">
                    <Receipt className="mx-auto mb-2 size-10 text-muted-foreground/60" />
                    <p className="font-medium">Nenhum comprovante enviado por esta loja</p>
                    <p className="text-sm text-muted-foreground">O lojista ainda não enviou nenhum comprovante de pagamento.</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
                  <div className="space-y-2 text-sm">
                    <Info label="Status do comprovante" v={proofView.status} />
                    <Info label="Valor" v={brl(Number(proofView.amount))} />
                    <Info label="Meses" v={String(proofView.period_months)} />
                    <Info label="Data de envio" v={new Date(proofView.created_at).toLocaleString("pt-BR")} />
                    {proofView.notes && <Info label="Observação" v={proofView.notes} />}
                  </div>
                  <div className="space-y-2">
                    {proofFileUrl ? (
                      <>
                        {proofView.file_type === "image" ? (
                          <a href={proofFileUrl} target="_blank" rel="noreferrer">
                            <img src={proofFileUrl} alt="comprovante" className="w-full rounded-md border border-border" />
                          </a>
                        ) : proofView.file_type === "pdf" ? (
                          <iframe src={proofFileUrl} className="h-72 w-full rounded-md border border-border" title="comprovante" />
                        ) : (
                          <div className="grid h-40 place-items-center rounded-md border border-dashed border-border text-xs text-muted-foreground">Pré-visualização indisponível — use os botões abaixo</div>
                        )}
                        <div className="flex gap-2">
                          <a href={proofFileUrl} target="_blank" rel="noreferrer" className="flex-1">
                            <Button variant="outline" className="w-full"><ExternalLink className="mr-2 size-4" />Abrir em nova aba</Button>
                          </a>
                          <a href={proofFileUrl} download className="flex-1">
                            <Button variant="outline" className="w-full">Baixar</Button>
                          </a>
                        </div>
                      </>
                    ) : <div className="grid h-40 place-items-center rounded-md border border-dashed border-border text-xs text-muted-foreground">Sem arquivo</div>}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============ HISTÓRICO ============ */
function AllProofsTab() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("payment_proofs").select("*, profiles!payment_proofs_user_profile_fkey(email)").order("created_at", { ascending: false })
      .then(({ data }) => setList(data ?? []));
  }, []);
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Usuário</TableHead><TableHead>Tipo</TableHead><TableHead>Valor</TableHead>
          <TableHead>Meses</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {list.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.profiles?.email}</TableCell>
              <TableCell>{p.desired_slug ? "Novo" : "Renovação"}</TableCell>
              <TableCell>{brl(Number(p.amount))}</TableCell>
              <TableCell>{p.period_months}</TableCell>
              <TableCell><span className="rounded-md bg-muted px-2 py-1 text-xs font-bold uppercase">{p.status}</span></TableCell>
              <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("pt-BR")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
