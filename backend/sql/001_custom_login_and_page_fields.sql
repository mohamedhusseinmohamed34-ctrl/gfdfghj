-- KHIDMA custom application login migration.
-- Safe to re-run. Does not drop tables or delete records.
-- If the equivalent update was already applied, this migration makes no duplicate tables/columns.

DO $$
DECLARE fk_name TEXT;
BEGIN
  SELECT con.conname INTO fk_name
  FROM pg_constraint con
  WHERE con.conrelid = 'public.users'::regclass
    AND con.confrelid = 'auth.users'::regclass
    AND con.contype = 'f'
  LIMIT 1;
  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.login_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('customer','provider','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_login_accounts_user FOREIGN KEY (user_id)
    REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  default_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_customers_user FOREIGN KEY (user_id)
    REFERENCES public.users(id) ON DELETE CASCADE
);

ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS business_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS service_area VARCHAR(150),
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','read','resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_accounts_user ON public.login_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON public.contact_messages(created_at);
