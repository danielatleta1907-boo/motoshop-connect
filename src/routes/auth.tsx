import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import { toast } from "sonner";
import { Lock, KeyRound, Sparkles, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acesso da loja — Use Ame" },
      { name: "description", content: "Entre ou crie sua conta gratuita para gerenciar a vitrine da sua loja de roupas no Use Ame." },
      { property: "og:title", content: "Acesso da loja — Use Ame" },
      { property: "og:description", content: "Entre ou crie sua conta gratuita no Use Ame." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, role, tenant, reload } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [reqOpen, setReqOpen] = useState(false);
  const [tab, setTab] = useState("signup");

  useEffect(() => {
    if (!user) return;
    if (role === "super_admin") {
      navigate({ to: "/super-admin" });
      return;
    }
    if (role === "admin" && tenant?.status === "active") {
      navigate({ to: "/admin" });
    }
  }, [user, role, tenant, navigate]);

  async function signIn() {
    setAuthError(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      const m = "E-mail ou senha incorretos.";
      setAuthError(m); return toast.error(m);
    }
    toast.success("Bem-vinda de volta!");
  }

  async function signUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Agora envie a solicitação da sua loja.");
    setReqOpen(true);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-hero hidden flex-col justify-between p-12 text-white lg:flex">
        <div className="text-xl font-bold tracking-tight">Use Ame · Painel</div>
        <div>
          <h1 className="text-5xl font-extrabold leading-tight">Sua loja de roupas, do seu jeito.</h1>
          <p className="mt-4 max-w-md text-white/80">
            Cadastre peças, tamanhos e brindes, acompanhe encomendas, vendas e lucro — tudo em um único lugar, de graça.
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
              <div className="text-xs text-muted-foreground">Lojistas e administrador</div>
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
                O uso é gratuito. Crie sua conta, envie a solicitação da loja e aguarde a liberação do administrador (até 12 horas).
              </p>
              <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Senha (mín. 6 caracteres)</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button onClick={signUp} disabled={loading || !email || !password || !name} className="w-full bg-brand text-primary-foreground hover:opacity-90">
                <Sparkles className="mr-2 size-4" /> Criar conta grátis
              </Button>
              <p className="text-xs text-muted-foreground">A 1ª conta criada vira <strong>administrador</strong> da plataforma.</p>
            </TabsContent>

            <TabsContent value="login" className="mt-5">
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); signIn(); }}>
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

      <SubscribeDialog open={reqOpen} onOpenChange={setReqOpen} mode="new" onSubmitted={reload} />
    </div>
  );
}
