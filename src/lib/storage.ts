import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, { url: string; expires: number }>();

export async function signedUrl(bucket: string, path: string, expiresIn = 60 * 60 * 6): Promise<string> {
  if (!path) return "";
  // If full URL was stored, use it directly
  if (path.startsWith("http")) return path;
  const key = `${bucket}/${path}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expires > now + 60_000) return cached.url;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (data?.signedUrl) {
    cache.set(key, { url: data.signedUrl, expires: now + expiresIn * 1000 });
    return data.signedUrl;
  }
  return "";
}

export async function signedUrls(bucket: string, paths: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    paths.map(async (p) => {
      out[p] = await signedUrl(bucket, p);
    }),
  );
  return out;
}
