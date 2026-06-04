-- ============================================================
-- Migration 072: RDV notifications (in-app + email triggers)
-- Crée des notifications in-app automatiques quand :
--   1. Un rendez-vous est créé (notify destinataire)
--   2. Le statut d'un rendez-vous change (notify demandeur)
-- ============================================================

-- 1. Trigger : notification lors de la création d'un RDV
CREATE OR REPLACE FUNCTION public.notify_on_rdv_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (profile_id, sender_id, type, data)
  VALUES (
    NEW.destinataire_id,
    NEW.demandeur_id,
    'rdv_request',
    jsonb_build_object(
      'rdv_id', NEW.id,
      'starts_at', NEW.starts_at,
      'ends_at', NEW.ends_at,
      'notes', NEW.notes,
      'status', NEW.status
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_rdv_insert ON public.rendez_vous;
CREATE TRIGGER trg_notify_on_rdv_insert
  AFTER INSERT ON public.rendez_vous
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_rdv_insert();

-- 2. Trigger : notification lors du changement de statut d'un RDV
CREATE OR REPLACE FUNCTION public.notify_on_rdv_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (profile_id, sender_id, type, data)
    VALUES (
      NEW.demandeur_id,
      NEW.destinataire_id,
      'rdv_status_change',
      jsonb_build_object(
        'rdv_id', NEW.id,
        'status', NEW.status,
        'starts_at', NEW.starts_at,
        'ends_at', NEW.ends_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_rdv_status_change ON public.rendez_vous;
CREATE TRIGGER trg_notify_on_rdv_status_change
  AFTER UPDATE OF status ON public.rendez_vous
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_rdv_status_change();

-- 3. Fonction : trouver les RDV confirmés à venir dans un intervalle donné
--    (utilisée par le cron de rappel)
CREATE OR REPLACE FUNCTION public.get_upcoming_confirmed_rdvs(window_start timestamptz, window_end timestamptz)
RETURNS TABLE(
  rdv_id uuid,
  demandeur_id uuid,
  destinataire_id uuid,
  demandeur_name text,
  destinataire_name text,
  starts_at timestamptz,
  ends_at timestamptz,
  notes text
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.demandeur_id,
    r.destinataire_id,
    dp.full_name,
    dt.full_name,
    r.starts_at,
    r.ends_at,
    r.notes
  FROM public.rendez_vous r
  JOIN public.profiles dp ON dp.id = r.demandeur_id
  JOIN public.profiles dt ON dt.id = r.destinataire_id
  WHERE r.status = 'confirmed'
    AND r.starts_at >= window_start
    AND r.starts_at <= window_end
    -- Éviter les doublons : vérifier qu'aucune notification de type 'rdv_reminder' n'existe déjà
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.type = 'rdv_reminder'
        AND n.data->>'rdv_id' = r.id::text
    );
END;
$$;
