import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Check, Upload, QrCode } from "lucide-react";
import { PIX_KEY, PLAN_PRICE, pixPayload } from "@/lib/pix";
import { supabase } from "@/integrations/supabase/client";

type Mode = "new" | "renew";

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
  const [qrSrc, setQrSrc] = useState("");
  const [copied, setCopied] = useState(false);
  const [months, setMonths] = useState(1);
  const [slug, setSlug] = useState("");
  const [storeName, setStoreName] = useState(tenantName || "");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const amount = +(PLAN_PRICE * months).toFixed(2);
  const payload = pixPayload({
    key: PIX_KEY,
    amount,
    name: "MOTOSTORE SAAS",
    city: "CAMPINA GRANDE",
    description: mode === "new" ? "Assinatura MotoStore" : "Renovacao",
  });

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(payload, { width: 280, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } }).then(setQrSrc);
  }, [open, payload]);

  async function copy() {
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function submit() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      toast.error("Você precisa criar a conta primeiro. Clique em 'Criar conta' antes de enviar o comprovante.");
      return;
    }
    if (mode === "new" && (!slug || !storeName)) return toast.error("Informe o nome e o endereço da sua loja");
    if (!file) return toast.error("Anexe o comprovante PIX");
    setSaving(true);
    const safe = file.name.replace(/[^a-z0-9.\-_]/gi, "");
    const path = `${u.user.id}/${Date.now()}_${safe}`;
    const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file);
    if (upErr) { setSaving(false); return toast.error(upErr.message); }
    const { error } = await supabase.from("payment_proofs").insert({
      user_id: u.user.id,
      amount,
      file_url: path,
      file_type: file.type.startsWith("image") ? "image" : file.type === "application/pdf" ? "pdf" : "other",
      period_months: months,
      desired_slug: mode === "new" ? slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") : null,
      desired_store_name: mode === "new" ? storeName.trim() : null,
      notes: notes || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Comprovante enviado! Aguarde a aprovação do super admin.");
    onSubmitted?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="size-5 text-primary" />
            {mode === "new" ? "Assinar MotoStore" : "Renovar assinatura"}
          </DialogTitle>
          <DialogDescription>
            Pague R$ {amount.toFixed(2).replace(".", ",")} via PIX, envie o comprovante e aguarde a aprovação.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-[280px_1fr]">
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-border bg-white p-3">
              {qrSrc ? <img src={qrSrc} alt="QR Code PIX" className="h-full w-full" /> : <div className="h-64" />}
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-xs">
              <div className="font-semibold text-muted-foreground">Chave PIX (copia e cola)</div>
              <code className="mt-1 block break-all font-mono text-[10px] leading-tight">{payload}</code>
              <Button size="sm" variant="outline" className="mt-2 w-full" onClick={copy}>
                {copied ? <><Check className="mr-2 size-3.5" />Copiado!</> : <><Copy className="mr-2 size-3.5" />Copiar</>}
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-xs">
              <div className="font-semibold text-muted-foreground">Ou use só a chave</div>
              <code className="mt-1 block break-all font-mono">{PIX_KEY}</code>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Quantos meses?</Label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[1, 3, 6, 12].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMonths(m)}
                    className={`rounded-md border px-2 py-2 text-sm font-semibold transition ${months === m ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Total: <strong>R$ {amount.toFixed(2).replace(".", ",")}</strong></p>
            </div>

            {mode === "new" && (
              <>
                <div>
                  <Label>Nome da sua loja</Label>
                  <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Ex: Moto Center Campina" />
                </div>
                <div>
                  <Label>URL pública da loja</Label>
                  <div className="mt-1 flex items-center rounded-md border border-input bg-background">
                    <span className="px-3 text-xs text-muted-foreground">/loja/</span>
                    <Input
                      className="border-0 focus-visible:ring-0"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                      placeholder="motocenter"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <Label>Comprovante PIX (foto ou PDF)</Label>
              <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>Observações (opcional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <Button onClick={submit} disabled={saving} className="w-full bg-brand text-primary-foreground hover:opacity-90">
              <Upload className="mr-2 size-4" />
              {saving ? "Enviando…" : "Enviar comprovante"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
