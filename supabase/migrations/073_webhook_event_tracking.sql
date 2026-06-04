-- Migration 073: Webhook event tracking (idempotency)
-- Stocke les IDs des événements webhook traités pour garantir l'idempotence
-- même après redémarrage du serveur.
-- CdC §4.3 — Paiements Stripe : idempotence stripe

CREATE TABLE IF NOT EXISTS webhook_events (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  event_id text UNIQUE NOT NULL,
  source text NOT NULL DEFAULT 'stripe',
  status text NOT NULL DEFAULT 'completed',
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour recherche rapide par event_id
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events (event_id);

-- Index pour nettoyage des vieux événements
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON webhook_events (processed_at);

-- Nettoyage automatique des événements de plus de 24h
-- (exécuté par une fonction appelée périodiquement ou au démarrage)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM webhook_events
  WHERE processed_at < now() - interval '24 hours';
END;
$$;
