import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Envia e-mail de redefinição de senha para o dono da loja. */
export const sendPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; redirectTo?: string }) => {
    if (!input?.email || typeof input.email !== "string") throw new Error("email obrigatório");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isSuper) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: data.email,
      options: data.redirectTo ? { redirectTo: data.redirectTo } : undefined,
    });
    if (error) throw new Error(error.message);
    return { ok: true, email: data.email, action_link: link?.properties?.action_link ?? null };
  });

/** Define uma nova senha manualmente para o usuário informado. */
export const setUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; password: string }) => {
    if (!input?.userId) throw new Error("userId obrigatório");
    if (!input?.password || input.password.length < 8) throw new Error("A senha precisa ter ao menos 8 caracteres");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isSuper) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
