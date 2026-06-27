import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type TenantInfo = {
  id: string;
  slug: string;
  store_name: string;
  status: "pending" | "active" | "suspended" | "cancelled";
  subscription_due_date: string | null;
  grace_days: number;
};

export type Role = "super_admin" | "admin" | null;

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) setTimeout(() => loadProfile(sess.user.id), 0);
      else {
        setRole(null);
        setTenant(null);
      }
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadProfile(uid: string) {
    const [{ data: roles }, { data: t }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("tenants").select("id, slug, store_name, status, subscription_due_date, grace_days").eq("owner_id", uid).maybeSingle(),
    ]);
    const rs = (roles ?? []).map((r) => r.role);
    setRole(rs.includes("super_admin") ? "super_admin" : rs.includes("admin") ? "admin" : null);
    setTenant(t as TenantInfo | null);
  }

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    session,
    user,
    role,
    tenant,
    isSuperAdmin: role === "super_admin",
    isAdmin: role === "admin",
    loading,
    signOut,
    reload: () => user && loadProfile(user.id),
  };
}
