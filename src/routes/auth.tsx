import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Lock, KeyRound } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Acesso da loja — MotoStore" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function signIn() {
    setAuthError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      const message = "E-mail ou senha incorretos. Confira os dados e tente novamente.";
      setAuthError(message);
      return toast.error(message);
    }
    toast.success("Bem-vindo!");
    navigate({ to: "/admin" });
  }

  async function signUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/admin` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Faça login.");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-hero hidden flex-col justify-between p-12 text-white lg:flex">
        <div className="text-xl font-bold tracking-tight">MotoStore · Painel</div>
        <div>
          <h1 className="text-5xl font-extrabold leading-tight">Controle total da sua loja.</h1>
          <p className="mt-4 max-w-md text-white/80">
            Cadastre motos, gerencie estoque, acompanhe interessados, vendas e o lucro da operação — tudo em um único lugar.
          </p>
        </div>
        <div className="text-xs text-white/60">Acesso restrito · uso interno</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2">
            <div className="grid size-10 place-items-center rounded-lg bg-brand text-primary-foreground"><Lock className="size-5" /></div>
            <div>
              <div className="font-bold">Acesso da loja</div>
              <div className="text-xs text-muted-foreground">Somente vendedores autorizados</div>
            </div>
          </div>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-5">
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  signIn();
                }}
              >
                <div><Label>E-mail</Label><Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label>Senha</Label><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                {authError ? <p className="text-sm font-medium text-destructive">{authError}</p> : null}
                <Button type="submit" disabled={loading || !email.trim() || !password} className="w-full bg-brand text-primary-foreground hover:opacity-90">
                  <KeyRound className="mr-2 size-4" /> {loading ? "Entrando…" : "Entrar"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup" className="mt-5 space-y-3">
              <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Senha (mín. 6 caracteres)</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button onClick={signUp} disabled={loading} className="w-full bg-brand text-primary-foreground hover:opacity-90">
                Criar conta
              </Button>
              <p className="text-xs text-muted-foreground">
                A primeira conta criada vira <strong>administradora</strong> automaticamente.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
