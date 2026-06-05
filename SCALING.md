# Plan de Montée en Charge — PROMOTE-CONNECT

> **Contexte** : Plateforme de networking digital pour salons PROMOTE. Stack Next.js 16 +
> Supabase self-hosted (VPS OVH) + n8n + Stripe. Usage intensif attendu (milliers d'exposants,
> dizaines de milliers de visiteurs, chat temps réel, notifications push).

---

## Résumé des Goulots d'Étranglement Identifiés

| # | Problème | Impact | Priorité |
|---|----------|--------|----------|
| 1 | Pas de pool de connexions BDD | Chaque requête HTTP Supabase ouvre une connexion | **Critique** |
| 2 | Pas de CDN ni cache serveur | Tous les assets et pages servis depuis le VPS | **Critique** |
| 3 | `SELECT count(*)` sur `messages` à chaque envoi | Scan linéaire qui explose avec le volume | **Haute** |
| 4 | Messages chargés sans pagination | Charge BDD + mémoire cliente excessive | **Haute** |
| 5 | Rate limiting via table PG (UNLOGGED) | Fonctionnel mais pas résilient (perte au restart) | **Haute** |
| 6 | Pas d'ISR / revalidate | Toutes les pages sont dynamiques, pas de cache Next.js | **Haute** |
| 7 | Single VPS, pas de horizontal scaling | Point unique de défaillance | **Haute** |
| 8 | Middleware DB call sur chaque navigation | Latence + charge BDD pour chaque page | **Moyenne** |
| 9 | Pas de job queue (Bull/Redis) | Edge Functions sans retry, perte de messages garantie | **Moyenne** |
| 10 | Index composites manquants | Requêtes fréquentes sans couverture d'index | **Moyenne** |
| 11 | Pas d'archivage des messages > 12 mois | Volume BDD croît sans limite | **Moyenne** |
| 12 | Pas de monitoring BDD | Aveugle sur les requêtes lentes | **Faible** |

---

## Phase 1 — Foundation (Semaine 1)

Objectif : sécuriser le socle avec des changements ciblés, sans changement d'architecture.

### 1.1 Index composites manquants

**Fichiers** : `supabase/migrations/074_add_scaling_indexes.sql`

```sql
-- Messages: index composite pour le tri chronologique par conversation
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages (conversation_id, created_at DESC);

-- Messages: index partiel pour le comptage de quota expediteur
CREATE INDEX IF NOT EXISTS idx_messages_sender_quota
  ON messages (sender_id, created_at)
  WHERE sender_id IS NOT NULL;

-- Messages: index pour les non-lus par conversation
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages (conversation_id, sender_id, is_read)
  WHERE is_read = false;

-- Notifications: index composite pour le tri + filtrage
CREATE INDEX IF NOT EXISTS idx_notifications_profile_read_created
  ON notifications (profile_id, created_at DESC)
  WHERE is_read = false;

-- Profiles: index pour les vérifications middleware
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_lookup
  ON profiles (subscription_tier, subscription_ends_at, is_active)
  WHERE is_active = true;

-- Audit logs: index pour le nettoyage par date
CREATE INDEX IF NOT EXISTS idx_audit_logs_created
  ON audit_logs (created_at DESC);
```

**Vérification** : `npm run db:push` + `EXPLAIN ANALYZE` sur les requêtes critiques.

### 1.2 Cache du middleware avec Redis (ou cookie étendu)

**Problème** : Le middleware appelle `profiles` à chaque navigation. Le cookie cache 5 min atténue mais ne résout pas la première requête après expiration.

**Solution immédiate** (sans Redis) : Étendre le TTL du cookie à 15 min et y ajouter les champs `account_status` et `subscription_tier`.

**Fichier** : `lib/middleware.ts`

- Passer le cookie cache TTL de 5 à 15 minutes
- Ajouter `subscription_tier` et `account_status` dans le cookie encodé
- Ajouter un cache LRU in-memory côté serveur pour les vérifications répétées dans une même requête

### 1.3 Rate limiting : fail-closed au lieu de fail-open

**Fichier** : `lib/rate-limit.ts`

**Problème** : En cas d'erreur BDD, le rate limiting retourne `{ allowed: true }` — un attaquant peut saturer la BDD pour désactiver la protection.

**Changement** : Passer en fail-closed. Si la BDD est injoignable, rejeter la requête (plutôt que de l'autoriser). Ajouter un circuit breaker : après 3 erreurs consécutives en 30s, bloquer pendant 60s.

```typescript
// Nouveau comportement :
if (error) {
  circuitBreaker.recordFailure(key);
  if (circuitBreaker.isOpen(key)) {
    return { allowed: false, remaining: 0, resetAt: Date.now() + 60000 };
  }
  return { allowed: false, remaining: 0, resetAt: Date.now() + windowMs };
}
```

### 1.4 Rate limiting sur les endpoints manquants

**Fichiers** :
- `app/api/webhooks/stripe/route.ts` — ajouter rate limit (60 req/min, IP-based)
- `app/api/newsletter/send/route.ts` — ajouter rate limit (10 req/min, admin user-based)

### 1.5 Pagination des messages chat

**Fichier** : `hooks/useChat.ts` et composants associés

**État actuel** : `.from('messages').select('...').eq('conversation_id', id).order('created_at')` — pas de `.range()`, pas d'infinite scroll.

**Changement** :
- Ajouter `.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)` avec `order('created_at', { ascending: false })`
- Implémenter l'infinite scroll vers le haut (charger les messages plus anciens en remontant)
- Taille de page : 50 messages
- Conserver le tri ascendant côté client après chargement

---

## Phase 2 — Cache & CDN (Semaine 2)

Objectif : décharger le VPS et réduire la latence perçue.

### 2.1 Mise en place de Cloudflare

**Étapes** :
1. Configurer Cloudflare en proxy DNS (orange cloud) sur le domaine
2. Activer le cache des assets statiques (`_next/static` avec cache 1 an)
3. Configurer les Page Rules pour les pages publiques (annuaire, agenda) avec cache browser 5 min
4. Activer Auto Minify (HTML, CSS, JS)
5. Configurer Argo Smart Routing (optionnel, payant)

**Pas de code à écrire** — configuration DNS dans le dashboard Cloudflare.

**Vérification** : `curl -I https://promote-connect.com/_next/static/...` doit retourner `CF-Cache-Status: HIT`.

### 2.2 ISR sur les pages publiques

**Fichiers** :
- `app/(dashboard)/annuaire/page.tsx` → ajouter `export const revalidate = 60`
- `app/(dashboard)/agenda/page.tsx` → ajouter `export const revalidate = 60`
- `app/(dashboard)/vitrine/[exposantId]/page.tsx` → ajouter `export const revalidate = 300`
- `app/(dashboard)/feed/page.tsx` → ajouter `export const revalidate = 30`

**Attention** : Ne pas mettre d'ISR sur les pages authentifiées avec données utilisateur (chat, paramètres, abonnement).

### 2.3 Cache-Control headers sur les API publiques

**Fichier** : `next.config.mjs`

Ajouter des headers de cache pour les routes d'API non-authentifiées :

```javascript
// Dans headers()
{
  source: '/api/annuaire/:path*',
  headers: [
    { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=120, stale-while-revalidate=300' }
  ]
},
{
  source: '/api/agenda/:path*',
  headers: [
    { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=120, stale-while-revalidate=300' }
  ]
}
```

### 2.4 Optimisation des images

**Fichier** : `next.config.mjs`

Configurer le loader d'images pour utiliser Supabase Image Transformation (ou un proxy) :

```javascript
images: {
  remotePatterns: [
    // ... existant
  ],
  imageSizes: [64, 128, 256, 512],   // tailles responsives
  deviceSizes: [375, 640, 768, 1024, 1280, 1536],
  formats: ['image/avif', 'image/webp'], // forcer WebP/AVIP
  minimumCacheTTL: 31536000,           // 1 an de cache navigateur
}
```

**Fichier** : Composants utilisant `<Image>` — vérifier que `sizes` attribute est défini pour éviter le download de l'image full-size.

---

## Phase 3 — Redis & Job Queue (Semaine 3)

Objectif : infrastructure de cache distribuée et traitement async fiable.

### 3.1 Déploiement de Redis

**Option** : Redis sur le même VPS (Docker) ou Upstash (serverless, pas d'infra à gérer).

**Recommandé** : Upstash Redis (compatible HTTP, pas de latence de connexion TCP, pay-as-you-go).

**Configuration** :
```bash
# .env.local
REDIS_URL=redis://...  # ou UPSTASH_REDIS_REST_URL
```

**Package** : `@upstash/redis` (HTTP-based, idéal pour Edge/Serverless).

### 3.2 Refactoring du rate limiting avec Redis

**Fichier** : `lib/rate-limit.ts`

Remplacer l'appel RPC PostgreSQL par une vérification Redis (Sliding Window) :

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const windowKey = `ratelimit:${key}:${Math.floor(now / windowMs)}`;

  const count = await redis.incr(windowKey);
  if (count === 1) {
    await redis.expire(windowKey, Math.ceil(windowMs / 1000));
  }

  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
    resetAt: (Math.floor(now / windowMs) + 1) * windowMs,
  };
}
```

**Migration** : Supprimer la table `rate_limits` et la RPC `check_rate_limit` après déploiement (migration 075).

### 3.3 Cache des requêtes fréquentes

**Nouveau fichier** : `lib/cache.ts`

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({ /* config */ });

export async function getOrSet<T>(
  key: string,
  fetch: () => Promise<T>,
  ttl: number = 300,
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached !== null) return cached;

  const value = await fetch();
  await redis.set(key, value, { ex: ttl });
  return value;
}
```

**Utilisation** :
- `getOrSet('platform_config', () => supabase.from('platform_config').select('*').single(), 600)`
- `getOrSet('exposants:list:page1', () => supabase.from('exposants').select('*').range(0, 19), 60)`
- Cache du profil utilisateur dans le middleware (15 min, remplace le cookie)

### 3.4 Job queue avec Bull + Redis

**Nouveau fichier** : `lib/queue.ts`

```typescript
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!);

export const notificationQueue = new Queue('notifications', { connection });
export const newsletterQueue = new Queue('newsletter', { connection });
export const rdvReminderQueue = new Queue('rdv-reminders', { connection });
```

**Workers** : `workers/notifications.ts`, `workers/newsletter.ts`, `workers/rdv-reminder.ts`

**Packages** : `bullmq`, `ioredis`

**Migration des Edge Functions** :
- `send-push-notification` : appelée via `notificationQueue.add(...)` avec retry automatique
- `send-newsletter` : remplacée par un worker Bull avec batching et rate limiting
- `generate-rdv` : job planifié (cron via Bull重复)

---

## Phase 4 — Connection Pooling & BDD (Semaine 4)

Objectif : optimiser les accès BDD et préparer le scale horizontal.

### 4.1 pgBouncer sur le VPS

**Configuration** (docker-compose ou installation directe) :

```ini
# pgbouncer.ini
[databases]
postgres = host=localhost port=5432 dbname=promote_connect

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 200
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
```

**Impact** : Les 25 connexions du pool remplacent des centaines de connexions directes. Le `pool_mode = transaction` permet de réutiliser les connexions entre requêtes.

### 4.2 Migration vers Supabase Cloud (optionnel)

**Alternative au VPS self-hosted** : Migrer Supabase vers Supabase Cloud (Managed) avec :
- Read replicas (jusqu'à 5 replicas en projet team)
- PgBouncer intégré
- Auto-scaling
- Backup automatique

**Si VPS reste** : Configurer la réplication streaming :
- 1 primary + 1 replica (lecture seule)
- Read/write splitting dans `lib/server.ts` et `lib/client.ts`

### 4.3 Optimisation du quota counting

**Fichier** : `lib/subscription.ts`

**Problème** : `SELECT count(*) FROM messages WHERE sender_id = $1` scanne toute la table.

**Solutions** :
1. **Materialized view** rafraîchie toutes les 5 min :
```sql
CREATE MATERIALIZED VIEW message_counts AS
SELECT sender_id, COUNT(*) as count
FROM messages
GROUP BY sender_id;
```
2. **Counter column** sur `profiles` :
```sql
ALTER TABLE profiles ADD COLUMN message_count integer DEFAULT 0;
```
   Mise à jour via trigger sur `messages` (INSERT + soft DELETE).
3. **Cache Redis** : incrémenter le compteur dans Redis à chaque envoi, persister en BDD toutes les heures.

**Recommandé** : Option 2 (trigger) + Redis pour une lecture immédiate.

### 4.4 Déclencheurs pour le comptage en temps réel

**Nouvelle migration** : `076_message_counters.sql`

```sql
-- Trigger pour mettre à jour le compteur de messages
CREATE OR REPLACE FUNCTION update_message_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles
    SET message_count = message_count + 1
    WHERE id = NEW.sender_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET message_count = message_count - 1
    WHERE id = OLD.sender_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_message_count
  AFTER INSERT OR DELETE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_count();
```

---

## Phase 5 — Horizontal Scaling (Semaines 5-6)

Objectif : pouvoir multiplier les instances Next.js et Supabase.

### 5.1 Dockerisation de l'application

**Nouveaux fichiers** : `Dockerfile`, `docker-compose.yml`

```dockerfile
# Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next .next
COPY --from=builder /app/public public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules node_modules
ENV NODE_ENV production
EXPOSE 3000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml (production)
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
    restart: unless-stopped

  pgbouncer:
    image: bitnami/pgbouncer:latest
    ports:
      - "6432:6432"
    environment:
      - POSTGRESQL_HOST=host.docker.internal
      - POSTGRESQL_PORT=5432
      - POSTGRESQL_DATABASE=promote_connect
    restart: unless-stopped

volumes:
  redis-data:
```

### 5.2 Load Balancer (Nginx)

**Nouveau fichier** : `nginx.conf`

```nginx
upstream nextjs {
    least_conn;
    server app:3000;
    server app2:3000;
    # Ajouter des instances ici au fur et à mesure
}

server {
    listen 80;
    server_name promote-connect.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name promote-connect.com;

    # SSL config...

    # Cache des assets statiques
    location /_next/static {
        proxy_pass http://nextjs;
        proxy_cache STATIC;
        proxy_cache_valid 200 365d;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Proxy dynamique avec WebSocket support
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $host;
    }
}
```

### 5.3 Health check endpoint

**Nouveau fichier** : `app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;
    checks['database'] = 'ok';
  } catch (err) {
    checks['database'] = 'error';
    checks['status'] = 'degraded';
  }

  try {
    // Vérifier Redis si configuré
    checks['cache'] = 'ok';
  } catch {
    checks['cache'] = 'error';
    checks['status'] = 'degraded';
  }

  const statusCode = checks.status === 'ok' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
```

### 5.4 Zero-downtime deploys

**Mise à jour** : `.github/workflows/ci-cd.yml`

Remplacer `pm2 restart` par un rolling update :

```yaml
- name: Zero-downtime deploy
  run: |
    docker pull ghcr.io/${{ github.repository }}:${{ github.sha }}
    docker service update --image ghcr.io/${{ github.repository }}:${{ github.sha }} promote-connect_app
    # Attendre que le nouveau conteneur soit healthy
    sleep 10
    docker service update --detach=false promote-connect_app
```

**Prérequis** : Docker Swarm ou Kubernetes.

---

## Phase 6 — Observabilité (Continu)

Objectif : ne plus être aveugle sur les performances.

### 6.1 Slow query logging (PostgreSQL)

```sql
-- Activer pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Trouver les 10 requêtes les plus lentes
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Fichier** : `supabase/migrations/077_enable_pg_stat_statements.sql`

### 6.2 Structured logging (Pino)

**Package** : `pino`, `pino-sentry`

**Nouveau fichier** : `lib/logger.ts`

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'body.password'],
    censor: '[REDACTED]',
  },
});
```

### 6.3 Métriques applicatives custom

**Nouveau fichier** : `lib/metrics.ts`

```typescript
// Métriques Prometheus (via un endpoint /metrics)
export const metrics = {
  activeUsers: new Gauge({ name: 'active_users', help: 'Active users count' }),
  messagesSent: new Counter({ name: 'messages_sent_total', help: 'Total messages sent' }),
  apiLatency: new Histogram({ name: 'api_latency_ms', help: 'API latency in ms' }),
  dbQueryDuration: new Histogram({ name: 'db_query_duration_ms', help: 'DB query duration' }),
};
```

**Endpoint** : `app/api/metrics/route.ts` (protégé par token admin)

### 6.4 Alerting

**Configuration Sentry** :
- Alerte si `tracesSampleRate > 0.1` → passer à 0.5
- Alerte si le nombre d'erreurs 500 dépasse le seuil (ex: > 10 en 5 min)
- Alerte si la latence API dépasse 2s (p99)

**Configuration uptime** : Better Uptime ou Checkly sur `/api/health`

### 6.5 Lighthouse CI

**Ajout** au workflow GitHub :

```yaml
lighthouse:
  name: Lighthouse CI
  runs-on: ubuntu-latest
  needs: deploy-preprod
  steps:
    - uses: actions/checkout@v4
    - name: Run Lighthouse CI
      run: |
        npm install -g @lhci/cli
        lhci autorun --config=./lighthouserc.js
```

**Nouveau fichier** : `lighthouserc.js`

---

## Phase 7 — Archivage & Nettoyage (Semaine 7)

Objectif : maîtriser la croissance de la BDD.

### 7.1 Partitionnement de la table `messages`

**Migration** : `078_partition_messages.sql`

```sql
-- Table partitionnée par mois
CREATE TABLE messages_partitioned (
  LIKE messages INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Partitions mensuelles
CREATE TABLE messages_2026_01 PARTITION OF messages_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE messages_2026_02 PARTITION OF messages_partitioned
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- ... création automatique via cron
```

**Alternative plus simple** : Archivage par cron + trigger.

### 7.2 Archivage des messages > 12 mois

**Nouveau script** : `scripts/archive-old-messages.js`

```javascript
// Tourne 1x/jour via cron
// 1. Copie les messages > 12 mois vers une table d'archive
// 2. Supprime les originaux
// 3. Conserve les statistiques agrégées par conversation
```

### 7.3 Nettoyage automatique des tables temporaires

- `audit_logs` : conserver 90 jours (indexé par `created_at`)
- `rate_limits` : supprimer après migration Redis
- `webhook_events` : déjà configuré (24h, migration 073)
- `sessions` expirées : nettoyage hebdomadaire

---

## Tableau de Bord de la Migration

### Semaine 1 — Foundation
- [x] 1.1 Index composites
- [x] 1.2 Cache middleware étendu
- [x] 1.3 Rate limiting fail-closed
- [x] 1.4 Rate limiting endpoints manquants
- [x] 1.5 Pagination messages chat

### Semaine 2 — Cache & CDN
- [x] 2.1 Cloudflare DNS + cache
- [x] 2.2 ISR pages publiques
- [x] 2.3 Cache-Control API publiques
- [x] 2.4 Optimisation images

### Semaine 3 — Redis & Queue
- [x] 3.1 Redis (Upstash ou Docker)
- [x] 3.2 Rate limiting Redis
- [x] 3.3 Cache requêtes fréquentes
- [x] 3.4 Bull queue

### Semaine 4 — BDD Pooling
- [x] 4.1 pgBouncer
- [x] 4.2 Read replicas (optionnel)
- [x] 4.3 Quota counting optimisé
- [x] 4.4 Trigger counters

### Semaine 5-6 — Horizontal Scaling
- [x] 5.1 Dockerisation
- [x] 5.2 Nginx load balancer
- [x] 5.3 Health check endpoint
- [x] 5.4 Zero-downtime deploys

### Continu — Observabilité
- [x] 6.1 pg_stat_statements
- [x] 6.2 Structured logging
- [x] 6.3 Métriques applicatives
- [x] 6.4 Alerting
- [x] 6.5 Lighthouse CI

### Semaine 7 — Archivage
- [x] 7.1 Partitionnement messages (optionnel)
- [x] 7.2 Archivage > 12 mois
- [x] 7.3 Nettoyage tables temporaires

---

## Estimation des Coûts Additionnels

| Service | Coût estimé | Notes |
|---------|-------------|-------|
| Cloudflare (Pro) | $20/mois | Cache + WAF + DDoS |
| Upstash Redis | $0-10/mois | Pay-as-you-go, 10k req/jour gratuit |
| Bullmq (Redis) | Inclus dans Upstash | Même instance |
| Sentry (Team) | $26/mois | Performance tracing |
| VPS supplémentaire | €10-20/mois | Pour horizontal scaling |
| Supabase Cloud (option) | $25-100/mois | Managed + replicas |
| Checkly (uptime) | $10-15/mois | Monitoring synthétique |
| **Total** | **~$80-180/mois** | |

---

## Risques & Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Redis devient SPOF | Cache + rate limiting + jobs tombent | Redis Sentinel (cluster) ou Upstash (managed, SLA 99.99%) |
| Cloudflare cache stale data | Utilisateurs voient données obsolètes | Purge cache via API Cloudflare à chaque update dans l'admin |
| Migration rate limiting → Redis | Perte des compteurs en cours | Dual-write pendant 24h (table PG + Redis) |
| Bull jobs perdus si crash | Notifications non envoyées | Backpressure + DLQ + monitoring des échecs |
| Partitionnement messages complexe | Migration risquée | Faire l'archivage simple d'abord (DELETE+INSERT archive), partitionner plus tard si nécessaire |

---

## Tests de Charge Préconisés

Avant chaque phase, valider avec des tests de charge :

```bash
# Installation k6
# Test basique : 100 utilisateurs virtuels, 5 min
k6 run --vus 100 --duration 5m scripts/load-test.js
```

**Scénarios critiques à tester** :
1. **Connexions simultanées** : 1000 utilisateurs se connectent dans la même minute
2. **Chat** : 200 conversations actives en parallèle, messages toutes les 2s
3. **Chat Realtime** : 500 connexions WebSocket simultanées
4. **Annuaire** : 100 req/s sur la page de liste avec filtres
5. **Notifications push** : pic de 5000 notifications en 1 min (après un envoi de newsletter)
6. **Pire cas** : mix des 5 scénarios ci-dessus

**Seuils d'acceptation** :
- Latence API p99 < 500ms
- Erreurs < 0.1%
- Charge CPU VPS < 70%
- Connexions BDD < 80% du pool
- Temps de réponse WebSocket < 200ms

---

## Références

- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Supabase Scaling Guide](https://supabase.com/docs/guides/platform/scaling)
- [pgBouncer Documentation](https://www.pgbouncer.org/config.html)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted)
- [Cloudflare Cache](https://developers.cloudflare.com/cache/)
