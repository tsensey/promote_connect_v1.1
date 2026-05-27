-- ============================================================
-- Migration 041: Table des signalements + file de modération
-- CdC PROMOTE-CONNECT v1.1 — Section 3.3
-- ============================================================

-- 1. Table des signalements
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reporter_id, reported_id) -- Un signalement unique par paire reporter/reported
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_reports_reported_id ON public.reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- 3. RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Tout utilisateur authentifié peut créer un signalement
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- Les utilisateurs peuvent voir leurs propres signalements
CREATE POLICY "Users can view their own reports"
  ON public.reports FOR SELECT
  USING (reporter_id = auth.uid());

-- Les admins peuvent tout gérer
CREATE POLICY "Admins can manage all reports"
  ON public.reports FOR ALL
  USING (public.is_admin());

-- 4. Fonction de vérification du seuil de signalements
-- CdC §3.3 : "Un seuil configurable de signalements distincts peut déclencher automatiquement une alerte"
CREATE OR REPLACE FUNCTION public.check_report_threshold()
RETURNS trigger AS $$
DECLARE
  report_count integer;
  threshold integer;
  reported_status text;
BEGIN
  -- Récupérer le seuil depuis la config
  SELECT COALESCE((public.get_platform_config('auto_suspend_report_threshold'))::integer, 3)
  INTO threshold;

  -- Compter les signalements distincts sur ce compte (status pending uniquement)
  SELECT COUNT(DISTINCT reporter_id)
  INTO report_count
  FROM public.reports
  WHERE reported_id = NEW.reported_id
    AND status = 'pending';

  -- Vérifier le statut actuel du compte signalé
  SELECT account_status INTO reported_status
  FROM public.profiles
  WHERE id = NEW.reported_id;

  -- Si le seuil est atteint et que le compte est actif → notification dans audit_logs
  IF report_count >= threshold AND reported_status = 'active' THEN
    INSERT INTO public.audit_logs (
      actor_id,
      actor_email,
      actor_role,
      action,
      entity_type,
      entity_id,
      metadata
    )
    SELECT
      NEW.reporter_id,
      u.email,
      p.role,
      'report_threshold_reached',
      'profiles',
      NEW.reported_id::text,
      jsonb_build_object(
        'report_count', report_count,
        'threshold', threshold,
        'reported_profile_id', NEW.reported_id,
        'message', 'ALERTE: Le seuil de signalements a été atteint. Révision manuelle requise.'
      )
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = NEW.reporter_id
    WHERE p.id = NEW.reporter_id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_report_threshold
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.check_report_threshold();

-- 5. Commentaires
COMMENT ON TABLE public.reports IS 'Signalements de comportements abusifs entre entreprises (CdC §3.3)';
COMMENT ON COLUMN public.reports.reason IS 'Raison du signalement (ex: spam, harcèlement, contenu inapproprié)';
COMMENT ON COLUMN public.reports.status IS 'pending=en attente, reviewed=examiné, dismissed=classé sans suite, actioned=action prise';
COMMENT ON COLUMN public.reports.reviewed_by IS 'Admin qui a traité le signalement';
