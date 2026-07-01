
-- Ensure profiles exist for any users missing them so FKs succeed
INSERT INTO public.profiles (id, full_name, email)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', u.email), u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Add FKs to profiles so PostgREST can embed
ALTER TABLE public.payment_proofs
  ADD CONSTRAINT payment_proofs_user_profile_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_owner_profile_fkey
  FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
