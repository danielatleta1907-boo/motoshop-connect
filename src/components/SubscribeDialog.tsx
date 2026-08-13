import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Mode = "new" | "renew";

function slugify(v: string) {
  return v.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * Solicitação gratuita de loja (novo cadastro) ou de reativação.
 * Cai direto na tela do super administrador para aprovação.
 */
export function SubscribeDialog({
  open,
  onOpenChange,
  mode = "new",
  tenantName,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode?: Mode;
  tenantName?: string;
  onSubmitted?: () => void;
}) {
  const [storeName, setStoreName] = useState(tenantName || "");
  const [slug, setSlug] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setStoreName(tenantName || "");
  }, [open, tenantName]);

  async function submit() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      toast.error("Crie sua conta primeiro para solicitar a loja.");
      return;
    }
    const cleanSlug = slugify(slug || storeName);
    if (mode === "new" && (!storeName.trim() || !cleanSlug)) {
      return toast.error("Informe o nome e o endereço da sua loja");
    }
    setSaving(true);
    const { error } = await supabase.from("payment_proofs").insert({
      user_id: u.user.id,
      amount: 0,
      period_months: 1,
      desired_slug: mode === "new" ? cleanSlug : null,
      desired_store_name: mode === "new" ? storeName.trim() : null,
      notes: notes || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Solicitação enviada! A liberação acontece em até 12 horas após a análise do administrador.", { duration: 8000 });
    onSubmitted?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="size-5 text-primary" />
            {mode === "new" ? "Criar minha loja (grátis)" : "Solicitar reativação"}
          </DialogTitle>
          <DialogDescription>
            {mode === "new"
              ? "O uso é 100% gratuito. Preencha os dados e aguarde a liberação do administrador."
              : "Envie uma solicitação para o administrador reativar sua loja."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {mode === "new" && (
            <>
              <div>
                <Label>Nome da loja</Label>
                <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Ex.: Ateliê Bella" />
              </div>
              <div>
                <Label>Endereço da vitrine</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="atelie-bella" />
                <p className="mt-1 text-xs text-muted-foreground">
                  Sua loja ficará em <code className="font-mono">/loja/{slugify(slug || storeName) || "sua-loja"}</code>
                </p>
              </div>
            </>
          )}
          <div>
            <Label>Observações (opcional)</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Conte um pouco sobre suas peças, cidade, Instagram…" />
          </div>
          <Button onClick={submit} disabled={saving} className="bg-brand text-primary-foreground hover:opacity-90">
            <Sparkles className="mr-2 size-4" /> {saving ? "Enviando…" : "Enviar solicitação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
