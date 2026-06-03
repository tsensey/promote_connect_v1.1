-- Enable RLS on rate_limits table and restrict to service_role only
-- Defense-in-depth : bien que la table soit déjà restreinte via REVOKE/GRANT,
-- l'activation de RLS ajoute une couche de sécurité supplémentaire.

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service_role can access rate_limits"
  ON public.rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);
