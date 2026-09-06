import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Lock, KeyRound, Sparkles, ArrowLeft, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acesso da loja — Moda & Estilo" },
      { name: "description", content: "Entre ou crie sua conta gratuita para gerenciar a vitrine da sua loja de roupas no Moda & Estilo." },
      { property: "og:title", content: "Acesso da loja — Moda & Estilo" },
      { property: "og:description", content: "Entre ou crie sua conta gratuita no Moda & Estilo." },
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
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState("signup");
  const [forgot, setForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    if (!user) return;
    if (role === "super_admin") {
      navigate({ to: "/super-admin" });
      return;
    }
    if (tenant) navigate({ to: "/admin" });
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
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth` },
    });
    if (error) { setLoading(false); return toast.error(error.message); }

    // Sem sessão (confirmação de e-mail ativa) → avisa e para aqui.
    if (!data.session) {
      setLoading(false);
      toast.success("Conta criada! Confirme seu e-mail para entrar na sua loja.", { duration: 8000 });
      return;
    }

    const { error: provErr } = await supabase.rpc("self_provision_store", {
      p_store_name: storeName.trim() || name.trim() || "Minha loja",
      p_slug: storeName.trim() || name.trim() || "minha-loja",
    });
    setLoading(false);
    if (provErr) return toast.error(provErr.message);
    toast.success("Loja criada! Já pode começar a cadastrar suas peças.");
    await reload();
    navigate({ to: "/admin" });
  }

  async function sendRecovery() {
    const mail = forgotEmail.trim();
    if (!mail) return toast.error("Informe o e-mail cadastrado na sua loja");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(mail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(`Enviamos um link de recuperação para ${mail}. Confira sua caixa de entrada e o spam.`, { duration: 9000 });
    setForgot(false);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-hero hidden flex-col justify-between p-12 text-white lg:flex">
        <div className="text-xl font-bold tracking-tight">Moda & Estilo · Painel</div>
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

          {forgot ? (
            <div className="space-y-3">
              <h2 className="text-lg font-bold">Esqueci minha senha</h2>
              <p className="text-sm text-muted-foreground">
                Digite o e-mail que você cadastrou na sua loja. Enviaremos um link para você criar uma nova senha.
              </p>
              <div><Label>E-mail cadastrado</Label><Input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} /></div>
              <Button onClick={sendRecovery} disabled={loading || !forgotEmail.trim()} className="w-full bg-brand text-primary-foreground hover:opacity-90">
                <Mail className="mr-2 size-4" /> {loading ? "Enviando…" : "Enviar link de recuperação"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setForgot(false)}>Voltar ao login</Button>
              <p className="text-xs text-muted-foreground">
                Não recebeu o e-mail? Fale com o administrador da plataforma — ele pode reenviar o link de recuperação.
              </p>
            </div>
          ) : (
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
                <TabsTrigger value="login">Entrar</TabsTrigger>
              </TabsList>

              <TabsContent value="signup" className="mt-5 space-y-3">
                <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-xs text-foreground">
                  <Sparkles className="mr-1 inline size-3.5 text-primary" />
                  100% gratuito e liberação imediata: criou a conta, sua loja já está pronta para usar.
                </p>
                <div><Label>Seu nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div>
                  <Label>Nome da loja</Label>
                  <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Ex.: Ateliê Bella" />
                </div>
                <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label>Senha (mín. 6 caracteres)</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button onClick={signUp} disabled={loading || !email || !password || !name} className="w-full bg-brand text-primary-foreground hover:opacity-90">
                  <Sparkles className="mr-2 size-4" /> {loading ? "Criando…" : "Criar conta e minha loja"}
                </Button>
                
              </TabsContent>

              <TabsContent value="login" className="mt-5">
                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); signIn(); }}>
                  <div><Label>E-mail</Label><Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  <div><Label>Senha</Label><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                  {authError && <p className="text-sm font-medium text-destructive">{authError}</p>}
                  <Button type="submit" disabled={loading || !email.trim() || !password} className="w-full bg-brand text-primary-foreground hover:opacity-90">
                    <KeyRound className="mr-2 size-4" /> {loading ? "Entrando…" : "Entrar"}
                  </Button>
                  <button type="button" onClick={() => { setForgot(true); setForgotEmail(email); }} className="w-full text-center text-xs font-semibold text-primary hover:underline">
                    Esqueci minha senha
                  </button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
