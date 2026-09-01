import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { KeyRound, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Criar nova senha — Moda & Estilo" },
      { name: "description", content: "Defina uma nova senha para acessar o painel da sua loja no Moda & Estilo." },
      { property: "og:title", content: "Criar nova senha — Moda & Estilo" },
      { property: "og:description", content: "Defina uma nova senha para o painel da sua loja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => setReady(!!sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function save() {
    if (password.length < 6) return toast.error("A senha precisa ter no mínimo 6 caracteres");
    if (password !== confirm) return toast.error("As senhas não conferem");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Senha alterada! Entrando na sua loja…");
    navigate({ to: "/admin" });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-soft">
        <div className="mb-5 flex items-center gap-2">
          <div className="grid size-10 place-items-center rounded-lg bg-brand text-primary-foreground"><KeyRound className="size-5" /></div>
          <div>
            <div className="font-bold">Criar nova senha</div>
            <div className="text-xs text-muted-foreground">Link de recuperação da sua loja</div>
          </div>
        </div>

        {!ready ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Este link parece inválido ou expirou. Peça um novo link de recuperação na tela de acesso.
            </p>
            <Link to="/auth"><Button variant="outline" className="w-full"><ArrowLeft className="mr-2 size-4" />Ir para o acesso</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div><Label>Nova senha</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div><Label>Confirmar nova senha</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
            <Button onClick={save} disabled={saving} className="w-full bg-brand text-primary-foreground hover:opacity-90">
              {saving ? "Salvando…" : "Salvar nova senha"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
