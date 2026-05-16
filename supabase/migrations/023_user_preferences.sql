-- ============================================================
-- Migration 023: User Preferences (settings, notifications, language)
-- ============================================================

-- 1. Création de la table user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  language      text NOT NULL DEFAULT 'fr' CHECK (language IN ('fr', 'en')),
  notify_messages  boolean NOT NULL DEFAULT true,
  notify_rdv       boolean NOT NULL DEFAULT true,
  notify_newsletter boolean NOT NULL DEFAULT true,
  notify_feed      boolean NOT NULL DEFAULT true,
  notify_sound     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- 3. Trigger pour créer automatiquement les préférences à l'inscription
CREATE OR REPLACE FUNCTION auto_create_user_preferences()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_preferences (profile_id)
  VALUES (NEW.id)
  ON CONFLICT (profile_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_create_user_preferences_trigger ON public.profiles;
CREATE TRIGGER auto_create_user_preferences_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_user_preferences();

-- 4. Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Lecture: l'utilisateur propriétaire peut lire ses préférences
CREATE POLICY "user_preferences_select_own" ON public.user_preferences
  FOR SELECT
  USING (profile_id = auth.uid());

-- Insertion: l'utilisateur peut insérer ses propres préférences
CREATE POLICY "user_preferences_insert_own" ON public.user_preferences
  FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- Mise à jour: l'utilisateur peut modifier ses propres préférences
CREATE POLICY "user_preferences_update_own" ON public.user_preferences
  FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Suppression: l'utilisateur peut supprimer ses propres préférences
CREATE POLICY "user_preferences_delete_own" ON public.user_preferences
  FOR DELETE
  USING (profile_id = auth.uid());

-- Les admins peuvent tout voir/modifier
CREATE POLICY "user_preferences_admin_all" ON public.user_preferences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
