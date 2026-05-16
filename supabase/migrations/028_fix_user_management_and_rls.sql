-- ============================================================
-- Migration 028: Correction gestion utilisateurs et RLS
-- 1. Corrige handle_new_user() (supprime colonnes obsoletes)
-- 2. Ajoute is_active, suspended_at, suspended_reason
-- 3. Ajoute contrainte CHECK sur role
-- 4. Ajoute politiques RLS admin
-- 5. Corrige politique notifications_insert_all
-- ============================================================

-- 1. Corriger handle_new_user() - version finale sans subscription columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    company,
    role,
    sector,
    country,
    pavillon
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company',
    COALESCE(new.raw_user_meta_data->>'role', 'visiteur'),
    new.raw_user_meta_data->>'sector',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'pavillon'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(excluded.full_name, public.profiles.full_name),
    company = COALESCE(excluded.company, public.profiles.company),
    role = COALESCE(excluded.role, public.profiles.role),
    sector = COALESCE(excluded.sector, public.profiles.sector),
    country = COALESCE(excluded.country, public.profiles.country),
    pavillon = COALESCE(excluded.pavillon, public.profiles.pavillon);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Ajouter colonnes is_active, suspended_at, suspended_reason
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_reason text;

-- 3. Contrainte CHECK sur role
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS valid_role;
ALTER TABLE public.profiles
  ADD CONSTRAINT valid_role CHECK (role IN ('visiteur', 'exposant', 'admin'));

-- 4. Creer une fonction helper pour verifier le role admin dans les politiques RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. Politiques RLS admin sur profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete all profiles"
  ON public.profiles FOR DELETE
  USING (public.is_admin());

-- 6. Politiques RLS admin sur exposants
CREATE POLICY "Admins can manage all exposants"
  ON public.exposants FOR ALL
  USING (public.is_admin());

-- 7. Politiques RLS admin sur user_preferences
CREATE POLICY "Admins can manage all preferences"
  ON public.user_preferences FOR ALL
  USING (public.is_admin());

-- 8. Politiques RLS admin sur rendez_vous
CREATE POLICY "Admins can manage all rendez_vous"
  ON public.rendez_vous FOR ALL
  USING (public.is_admin());

-- 9. Politiques RLS admin sur evenements
CREATE POLICY "Admins can manage all evenements"
  ON public.evenements FOR ALL
  USING (public.is_admin());

-- 10. Politiques RLS admin sur posts (moderation)
CREATE POLICY "Admins can manage all posts"
  ON public.posts FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can manage all post_comments"
  ON public.post_comments FOR ALL
  USING (public.is_admin());

-- 11. Corriger la politique notifications_insert_all (trop permissive)
DROP POLICY IF EXISTS "notifications_insert_all" ON public.notifications;

CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());
