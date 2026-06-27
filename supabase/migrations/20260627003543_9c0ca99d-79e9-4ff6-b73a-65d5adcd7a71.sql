
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'super_admin';

DO $$ BEGIN
  CREATE TYPE tenant_status AS ENUM ('pending', 'active', 'suspended', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE proof_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
