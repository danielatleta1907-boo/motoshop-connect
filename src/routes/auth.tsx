import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import { toast } from "sonner";
import { Lock, KeyRound, Sparkles, RefreshCw, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    plan: s.plan ? String(s.plan) : undefined,
    recover: s.recover ? String(s.recover) : undefined,
  }),
  head: () => ({ meta: [{ title: "Acesso da loja — MotoStore SaaS" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch() as { plan?: string; recover?: string };
  const { user, role, tenant, reload } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [subOpen, setSubOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [tab, setTab] = useState(search.recover ? "login" : "signup");

  // Após login, abrir modal correto OU redirecionar
  useEffect(() => {
    if (!user) return;
    if (role === "super_admin") {
      navigate({ to: "/super-admin" });
      return;
    }
    if (search.plan && !tenant) { setSubOpen(true); return; }
    if (search.recover && tenant) { setRenewOpen(true); return; }
    if (role === "admin" && tenant?.status === "active") {
      navigate({ to: "/admin" });
    }
  }, [user, role, tenant, search.plan, search.recover, navigate]);

  async function signIn() {
    setAuthError(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      const m = "E-mail ou senha incorretos.";
      setAuthError(m); return toast.error(m);
    }
    toast.success("Bem-vindo!");
  }

  async function signUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Agora pague a assinatura.");
    // após signup já é logado → useEffect abre o modal de assinatura
    setSubOpen(true);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-hero hidden flex-col justify-between p-12 text-white lg:flex">
        <div className="text-xl font-bold tracking-tight">MotoStore SaaS · Painel</div>
        <div>
          <h1 className="text-5xl font-extrabold leading-tight">Controle total da sua loja.</h1>
          <p className="mt-4 max-w-md text-white/80">
            Cadastre motos, gerencie estoque, acompanhe interessados, vendas e o lucro da operação — tudo em um único lugar.
          </p>
        </div>
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
          <ArrowLeft className="size-4" /> Voltar à home
        </Link>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2">
            <div className="grid size-10 place-items-center rounded-lg bg-brand text-primary-foreground"><Lock className="size-5" /></div>
            <div>
              <div className="font-bold">Acesso da loja</div>
              <div className="text-xs text-muted-foreground">Lojistas e super admin</div>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
              <TabsTrigger value="login">Entrar</TabsTrigger>
            </TabsList>

            <TabsContent value="signup" className="mt-5 space-y-3">
              <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-xs text-foreground">
                <Sparkles className="mr-1 inline size-3.5 text-primary" />
                Crie sua conta, pague R$ 65,90 via PIX e envie o comprovante. Após aprovação do super admin, sua loja é ativada.
              </p>
              <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Senha (mín. 6 caracteres)</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button onClick={signUp} disabled={loading || !email || !password || !name} className="w-full bg-brand text-primary-foreground hover:opacity-90">
                <Sparkles className="mr-2 size-4" /> Criar conta
              </Button>
              <p className="text-xs text-muted-foreground">A 1ª conta criada vira <strong>super admin</strong> da plataforma.</p>
            </TabsContent>

            <TabsContent value="login" className="mt-5">
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); signIn(); }}>
                {search.recover && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs">
                    <RefreshCw className="mr-1 inline size-3.5 text-destructive" />
                    Entre com sua conta para renovar a assinatura.
                  </div>
                )}
                <div><Label>E-mail</Label><Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label>Senha</Label><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                {authError && <p className="text-sm font-medium text-destructive">{authError}</p>}
                <Button type="submit" disabled={loading || !email.trim() || !password} className="w-full bg-brand text-primary-foreground hover:opacity-90">
                  <KeyRound className="mr-2 size-4" /> {loading ? "Entrando…" : "Entrar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <SubscribeDialog open={subOpen} onOpenChange={setSubOpen} mode="new" onSubmitted={reload} />
      <SubscribeDialog open={renewOpen} onOpenChange={setRenewOpen} mode="renew" tenantName={tenant?.store_name} onSubmitted={reload} />
    </div>
  );
}
