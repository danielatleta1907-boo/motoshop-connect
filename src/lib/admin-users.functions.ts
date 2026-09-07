import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Caminhos permitidos para o retorno do link de recuperação (allow-list fechada). */
const ALLOWED_REDIRECT_PATHS = ["/reset-password", "/auth", "/"] as const;

async function resolveRedirectTo(path?: string): Promise<string | undefined> {
  if (!path) return undefined;
  if (!ALLOWED_REDIRECT_PATHS.includes(path as (typeof ALLOWED_REDIRECT_PATHS)[number])) {
    throw new Error("Destino de redirecionamento não permitido");
  }
  const { getRequest } = await import("@tanstack/react-start/server");
  const request = getRequest();
  // A origem vem sempre do próprio pedido — nunca de valor enviado pelo cliente.
  const origin = request?.headers.get("origin") ?? new URL(request!.url).origin;
  return `${origin.replace(/\/$/, "")}${path}`;
}

async function assertSuperAdmin(context: { supabase: any; userId: string }) {
  const { data: isSuper } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "super_admin",
  });
  if (!isSuper) throw new Error("Forbidden");
}

/**
 * Envia e-mail de redefinição de senha para o dono da loja e devolve também o link
 * de recuperação, para o super admin poder repassar manualmente caso o e-mail não chegue.
 */
export const sendPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; redirectPath?: string }) => {
    if (!input?.email || typeof input.email !== "string") throw new Error("email obrigatório");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);

    const redirectTo = await resolveRedirectTo(data.redirectPath);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1) Tenta disparar o e-mail padrão de recuperação.
    let emailSent = true;
    let emailError: string | null = null;
    const { error: mailErr } = await supabaseAdmin.auth.resetPasswordForEmail(data.email,
      redirectTo ? { redirectTo } : undefined);
    if (mailErr) {
      emailSent = false;
      emailError = mailErr.message;
    }

    // 2) Gera o link para o super admin poder repassar manualmente.
    let link: string | null = null;
    const { data: gen, error: genErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: data.email,
      options: redirectTo ? { redirectTo } : undefined,
    });
    if (genErr && !emailSent) throw new Error(genErr.message);
    link = gen?.properties?.action_link ?? null;

    return { ok: true, email: data.email, emailSent, emailError, link };
  });

