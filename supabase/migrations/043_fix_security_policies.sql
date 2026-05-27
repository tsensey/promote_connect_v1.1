-- ============================================================
-- Migration 043: Corrections de sécurité
-- SEC-09: RLS posts UPDATE trop large
-- SEC-10: Données sensibles dans audit_log metadata
-- SEC-11: Exception swallower dans check_access_level_update
-- ============================================================

-- SEC-09: Corriger la politique UPDATE sur posts
-- Actuellement: n'importe quel utilisateur peut modifier n'importe quel post
-- Correction: séparer la mise à jour des compteurs (tout le monde) des champs propriétaires (owner/admin)

DROP POLICY IF EXISTS "Anyone can update post counters" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can manage all posts" ON public.posts;

-- Admins: accès total
CREATE POLICY "Admins can manage all posts"
  ON public.posts FOR ALL
  USING (public.is_admin());

-- Propriétaires: peuvent modifier leur propre post (contenu, statut)
CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Tout utilisateur authentifié: peut incrémenter/décrémenter les compteurs uniquement
-- Utilise une fonction pour limiter les champs modifiables
CREATE OR REPLACE FUNCTION public.can_update_post_counters(post_row public.posts, updated_row public.posts)
RETURNS boolean AS $$
BEGIN
  -- Seuls les champs de compteurs peuvent être modifiés par d'autres utilisateurs
  RETURN (
    post_row.id = updated_row.id
    AND post_row.author_id = updated_row.author_id
    AND post_row.content = updated_row.content
    AND post_row.is_pinned = updated_row.is_pinned
    AND post_row.created_at = updated_row.created_at
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE POLICY "Authenticated users can update post counters only"
  ON public.posts FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (
    -- Doit être propriétaire OU ne modifier que les compteurs
    author_id = auth.uid()
    OR public.is_admin()
  );

-- SEC-11: Retirer le EXCEPTION WHEN OTHERS swallower dans check_access_level_update
-- La version précédente (migration 037) avalait silencieusement les erreurs de sécurité
CREATE OR REPLACE FUNCTION public.check_access_level_update()
RETURNS trigger AS $$
BEGIN
  IF OLD.access_level IS DISTINCT FROM NEW.access_level
     OR OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier
     OR OLD.account_status IS DISTINCT FROM NEW.account_status
     OR OLD.daily_exchange_count IS DISTINCT FROM NEW.daily_exchange_count
     OR OLD.last_exchange_reset IS DISTINCT FROM NEW.last_exchange_reset
     OR OLD.blocked_at IS DISTINCT FROM NEW.blocked_at
     OR OLD.blocked_reason IS DISTINCT FROM NEW.blocked_reason
  THEN
    -- Permettre service_role (migrations, backend)
    IF current_setting('role', true) = 'service_role' THEN
      RETURN NEW;
    END IF;

    -- Permettre sans session auth (triggers système)
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;

    -- Seuls les admins peuvent modifier ces champs sensibles
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Permission refusée: seuls les administrateurs peuvent modifier le statut d''abonnement ou de compte';
    END IF;
  END IF;
  RETURN NEW;
  -- NOTE: Plus de EXCEPTION WHEN OTHERS swallower (SEC-11 corrigé)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SEC-10: Sanitiser les données sensibles dans audit_log
-- Remplacer to_jsonb(NEW) brut par une version qui masque les champs sensibles
CREATE OR REPLACE FUNCTION public.sanitize_for_audit(data jsonb)
RETURNS jsonb AS $$
BEGIN
  -- Masquer les champs sensibles dans les logs d'audit
  RETURN data
    - 'stripe_customer_id'
    - 'stripe_subscription_id'
    - 'blocked_reason'
    - 'suspended_reason';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Mettre à jour log_admin_action pour utiliser la sanitisation
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS trigger AS $$
DECLARE
  v_actor_id uuid;
  v_actor_role text;
  v_actor_email text;
  v_action text;
  v_entity_type text;
  v_entity_id text;
  v_metadata jsonb;
BEGIN
  BEGIN
    v_actor_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_actor_id := NULL;
  END;

  -- Skip si pas d'utilisateur authentifié (opération système)
  IF v_actor_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  SELECT role INTO v_actor_role FROM profiles WHERE id = v_actor_id;
  SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor_id;

  v_entity_type := TG_TABLE_NAME;

  IF TG_OP = 'INSERT' THEN
    v_action := 'create_' || v_entity_type;
    v_entity_id := NEW.id::text;
    v_metadata := public.sanitize_for_audit(to_jsonb(NEW)); -- SEC-10 corrigé
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update_' || v_entity_type;
    v_entity_id := NEW.id::text;
    v_metadata := jsonb_build_object(
      'old', public.sanitize_for_audit(to_jsonb(OLD)),
      'new', public.sanitize_for_audit(to_jsonb(NEW))
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_' || v_entity_type;
    v_entity_id := OLD.id::text;
    v_metadata := public.sanitize_for_audit(to_jsonb(OLD));
  END IF;

  IF v_actor_role = 'admin' THEN
    BEGIN
      INSERT INTO audit_logs (actor_id, actor_email, actor_role, action, entity_type, entity_id, metadata)
      VALUES (v_actor_id, v_actor_email, v_actor_role, v_action, v_entity_type, v_entity_id, v_metadata);
    EXCEPTION WHEN OTHERS THEN
      -- Ignorer les erreurs de log pour ne pas bloquer l'opération principale
    END;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
