-- ============================================================
-- Migration 074: Fix is_paid() + RDV RLS + auto-downgrade cron
--
-- 1. is_paid() vérifie désormais subscription_ends_at
--    (un compte 'paid' avec ends_at < now() n'est plus considéré payant)
-- 2. La politique UPDATE sur rendez_vous vérifie aussi is_paid()
-- 3. Trigger qui downgrade subscription_tier quand subscription_ends_at expire
-- ============================================================

-- 1. Corriger is_paid() — vérifier subscription_ends_at
CREATE OR REPLACE FUNCTION public.is_paid()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND subscription_tier = 'paid'
      AND (
        subscription_ends_at IS NULL
        OR subscription_ends_at > now()
      )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Mettre à jour la politique INSERT sur rendez_vous avec la nouvelle is_paid()
--    (le nom reste identique, le contenu est inchangé, la fonction is_paid() est maintenant corrigée)
--    Aucun DROP/CREATE nécessaire — la politique référence public.is_paid() qui est mise à jour.

-- 3. Ajouter la vérification is_paid() sur UPDATE des rendez-vous
--    Seuls les participants PAID peuvent modifier le statut
DROP POLICY IF EXISTS "Participants can update their rendez-vous" ON public.rendez_vous;
CREATE POLICY "Participants can update their rendez-vous"
  ON public.rendez_vous FOR UPDATE
  USING (auth.uid() = demandeur_id OR auth.uid() = destinataire_id)
  WITH CHECK (
    (auth.uid() = demandeur_id OR auth.uid() = destinataire_id)
    AND public.is_paid()
  );

-- 4. Trigger : downgrade automatique quand subscription_ends_at est dépassée
--    (solution de rattrapage — le webhook Stripe reste la voie principale)
CREATE OR REPLACE FUNCTION public.auto_downgrade_expired_subscriptions()
RETURNS trigger AS $$
BEGIN
  IF NEW.subscription_tier = 'paid'
     AND NEW.subscription_ends_at IS NOT NULL
     AND NEW.subscription_ends_at <= now()
  THEN
    NEW.subscription_tier = 'free_trial';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_downgrade_expired ON public.profiles;
CREATE TRIGGER trg_auto_downgrade_expired
  BEFORE UPDATE OF subscription_ends_at ON public.profiles
  FOR EACH ROW
  WHEN (NEW.subscription_ends_at IS DISTINCT FROM OLD.subscription_ends_at)
  EXECUTE FUNCTION public.auto_downgrade_expired_subscriptions();
