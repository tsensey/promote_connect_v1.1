-- ===============================================================
-- Migration 063: Notifications Realtime + Likes + Stripe downgrade
-- ===============================================================

-- 1. Activer la réplication de la table notifications dans supabase_realtime
--    (était commenté dans migration 027 — cause racine : les notifications
--     ne sont jamais diffusées en temps réel vers le client)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. Trigger : créer une notification lorsqu'un utilisateur like un post
--    (actuellement, toggleLike() dans useFeed.ts n'insère jamais de notification)
CREATE OR REPLACE FUNCTION public.notify_on_post_like()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (profile_id, sender_id, type, data)
  VALUES (
    (SELECT author_id FROM public.posts WHERE id = NEW.post_id),
    NEW.user_id,
    'like',
    jsonb_build_object('post_id', NEW.post_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_post_like ON public.post_likes;
CREATE TRIGGER trg_notify_on_post_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_post_like();

-- 3. Trigger : créer une notification lorsqu'un utilisateur réagit à un post (autre que 'like')
--    La table post_reactions est utilisée par toggleReaction() dans useFeed.ts
CREATE OR REPLACE FUNCTION public.notify_on_post_reaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type != 'like' THEN
    INSERT INTO public.notifications (profile_id, sender_id, type, data)
    VALUES (
      (SELECT author_id FROM public.posts WHERE id = NEW.post_id),
      NEW.user_id,
      'like',
      jsonb_build_object('post_id', NEW.post_id, 'reaction_type', NEW.type)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_post_reaction ON public.post_reactions;
CREATE TRIGGER trg_notify_on_post_reaction
  AFTER INSERT ON public.post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_post_reaction();

-- 4. Trigger : auto-downgrader subscription_tier quand un abonnement Stripe expire
--    (solution de dernier recours — le correctif principal est dans le webhook Stripe)
CREATE OR REPLACE FUNCTION public.auto_downgrade_on_subscription_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut passe à 'expired', 'past_due' ou 'canceled' → downgrade
  IF NEW.status IN ('expired', 'past_due', 'canceled', 'incomplete_expired') THEN
    UPDATE public.profiles
    SET subscription_tier = 'free_trial'
    WHERE id = NEW.profile_id
      AND subscription_tier = 'paid';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_downgrade_on_subscription_expiry ON public.subscriptions;
CREATE TRIGGER trg_auto_downgrade_on_subscription_expiry
  AFTER UPDATE OF status ON public.subscriptions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.auto_downgrade_on_subscription_expiry();
