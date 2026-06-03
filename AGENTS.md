# PROMOTE-CONNECT — Contexte Projet pour Claude Code

## Vue d'ensemble

**PROMOTE-CONNECT** est une plateforme de networking digital pour salons professionnels PROMOTE.  
Elle permet aux exposants et visiteurs de se connecter, échanger et générer des affaires pendant **12 mois** après le salon.

- **Organisation** : BBIT-IT
- **Version CdC** : 1.1 — Mai 2026
- **Stack** : Next.js 16 + Supabase + n8n + Stripe + Resend + FCM + PWA

---

## Stack Technique

| Couche | Technologie | Notes |
|--------|------------|-------|
| Frontend | Next.js 16 (App Router) | SSR + SSG, TypeScript strict |
| Styling | Tailwind CSS + shadcn/ui | Design system interne |
| State | Zustand + React Query (TanStack) | Cache serveur via RQ |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) | Self-hosted sur VPS OVH |
| Temps réel | Supabase Realtime (WebSocket) | Chat & notifications |
| Serverless | Supabase Edge Functions (Deno) | Logique métier critique |
| Email | Resend + React Email | Newsletters + transactionnel |
| Push | Firebase Cloud Messaging | Notifications mobiles |
| Paiement | Stripe | Abonnements PROMOTE-CONNECT |
| Automation | n8n (self-hosted) | Workflows newsletters, relances |
| CI/CD | GitHub Actions | Deploy auto Vercel + VPS |
| Monitoring | Sentry + Plausible | Erreurs + analytics RGPD |
| PWA | Serwist / Service Worker | Offline support, push notifications |
| Store | Play Store (TWA) / App Store (WKWebView) | Wrapper PWABuilder |

---

## Structure du Projet

```
promote-connect/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Routes d'authentification
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/            # Zone connectée
│   │   ├── abonnement/         # Module G — Abonnement Stripe
│   │   ├── agenda/             # Module C — Agenda interactif
│   │   ├── annuaire/           # Module A — Annuaire exposants
│   │   ├── app/                # Dashboard principal
│   │   ├── chat/               # Module B — Chat privé
│   │   │   └── [conversationId]/
│   │   ├── exposant/           # Module D — Vitrine (édition exposant)
│   │   ├── feed/               # Fil d'actualités
│   │   ├── newsletter/         # Module E — Newsletter
│   │   ├── parametres/         # Paramètres utilisateur
│   │   ├── support/            # Module F — Support technique
│   │   │   └── [ticketId]/
│   │   └── vitrine/            # Module D — Vitrine produits
│   │       └── [exposantId]/
│   ├── admin/                  # Back-office PROMOTE
│   │   ├── espaces/            # Gestion espaces/pavillons
│   │   │   └── exposants/
│   │   ├── exposants/
│   │   ├── logs/               # Audit logs
│   │   ├── newsletter/
│   │   ├── programme/
│   │   ├── tickets/            # Support tickets
│   │   │   └── [ticketId]/
│   │   └── users/              # Gestion utilisateurs
│   │       └── reset-password/
│   ├── api/                    # API Routes Next.js
│   │   ├── admin/              # Admin CRUD APIs
│   │   ├── feed/               # Feed upload
│   │   ├── newsletter/         # Newsletter subscribe/unsubscribe
│   │   └── webhooks/
│   │       ├── stripe/         # Stripe event webhook
│   │       └── fcm/            # Firebase push notifications
│   └── offline/                # Page hors-ligne PWA
├── components/
│   ├── ui/                     # shadcn/ui (43 composants)
│   ├── agenda/                 # EvenementCard, RdvCard
│   ├── chat/                   # ChatInput, MessageBubble
│   ├── feed/                   # CreatePost, PostCard
│   ├── layout/                 # Sidebars, topbars, notifications
│   └── shared/                 # PwaRegister, UserIdentity, MentionInput, etc.
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Client browser (re-export)
│   │   └── admin.ts            # Client admin (service_role)
│   ├── auth/                   # Auth context provider
│   ├── chat/                   # Chat utils + storage
│   ├── i18n/                   # i18n custom (Provider + traductions)
│   ├── resend/                 # Resend client
│   ├── admin.ts                # verifyAdmin() helper
│   ├── client.ts               # Supabase browser client singleton
│   ├── middleware.ts           # Auth middleware (session, subscription, roles)
│   ├── permissions.ts          # Permission helpers
│   ├── rate-limit.ts           # Rate limiter (in-memory)
│   ├── server.ts               # Supabase server client (cookies)
│   └── utils.ts                # cn() + helpers
├── hooks/                      # Custom React hooks (14 hooks)
│   ├── useAgenda.ts, useAnnuaire.ts, useBlockedUsers.ts
│   ├── useChat.ts, useExposants.ts, useFeed.ts
│   ├── useIdentity.ts, useIntersectionObserver.ts
│   ├── useMediaQuery.ts, use-mobile.ts
│   ├── useNotifications.ts, usePermissions.ts
│   ├── useProfilePosts.ts, useSettings.ts, useSupport.ts
├── store/                      # Zustand stores
│   ├── agendaStore.ts
│   ├── chatStore.ts
│   └── userStore.ts
├── test/                       # Tests unitaires + e2e
│   ├── api.newsletter.test.ts
│   ├── lib.chat.utils.test.ts, lib.rate-limit.test.ts, lib.utils.test.ts
│   ├── store.chat.test.ts, store.user.test.ts
│   └── e2e/auth.spec.ts       # Playwright e2e
├── types/                      # TypeScript types globaux
│   ├── database.types.ts       # Généré par Supabase CLI (partiellement obsolète)
│   └── (chat.ts, exposant.ts, agenda.ts, etc.)
├── supabase/
│   ├── migrations/             # 34 SQL migrations (000-034)
│   ├── functions/              # Edge Functions Deno
│   │   ├── send-newsletter/
│   │   ├── send-push-notification/
│   │   └── generate-rdv/
│   └── seed.sql
├── emails/                     # Templates React Email
│   ├── WelcomeEmail.tsx
│   ├── NewsletterEmail.tsx
│   ├── RdvConfirmationEmail.tsx
│   └── CredentialsEmail.tsx
├── public/
│   ├── sw.js                   # Service Worker (cache, offline, push)
│   ├── icons/                  # 8 icônes PWA (72-512px + maskable)
│   ├── logo-promote.png
│   └── .well-known/
├── scripts/
│   ├── generate-pwa-icons.mjs  # Génération des icônes PWA
│   ├── seed.js                 # Seed de la base
│   ├── create-admin.mjs        # Création admin CLI
│   └── cleanup-orphans.js      # Nettoyage données orphelines
├── middleware.ts               # Auth middleware Next.js (délègue à lib/middleware.ts)
├── next.config.mjs             # Config Next.js (headers sécurité, CSP, images)
├── vitest.config.ts            # Config Vitest (jsdom, coverage, aliases)
├── .env.local                  # Variables d'environnement (jamais en git)
└── .env.example                # Template variables
```

---

## Modules Fonctionnels

### Module A — Annuaire Exposants (Phase 1 — PRIORITÉ HAUTE)
- Liste paginée de tous les exposants PROMOTE
- Filtres : secteur, pays, pavillon, type d'activité
- Fiche exposant : infos, produits, bouton "Contacter"
- Temps de chargement cible : < 2 secondes

### Module B — Chat Privé (Phase 1 — PRIORITÉ HAUTE)
- Messagerie 1-à-1 temps réel via Supabase Realtime
- Historique conservé pendant 12 mois d'abonnement
- Chiffrement, indicateurs de lecture, partage de fichiers
- Notifications push (FCM)

### Module C — Agenda Interactif (Phase 1 — PRIORITÉ HAUTE)
- Programme salon mis à jour en temps réel
- Gestion RDV B2B depuis l'interface
- Rappels et notifications
- Sync Google Calendar / Outlook (Phase 3)

### Module D — Vitrine Produits (Phase 2 — PRIORITÉ MOYENNE)
- CRUD produits/services par exposant
- Visibilité communauté PROMOTE-CONNECT
- Stats : vues, clics, contacts générés

### Module E — Newsletter (Phase 2 — PRIORITÉ MOYENNE)
- Envoi automatisé via n8n + Resend
- Personnalisation par secteur d'activité
- Archivage dans espace personnel

### Module F — Support Technique (Phase 2 — PRIORITÉ MOYENNE)
- Chat support intégré
- Système de tickets
- Base de connaissances (FAQ)

### Module G — Accès 12 mois (Phase 1 — PRIORITÉ HAUTE)
- Gestion abonnement via Stripe
- Prolongation automatique de l'accès après le salon
- Renouvellement et résiliation

---

## Schéma Base de Données (Supabase / PostgreSQL)

```sql
-- Profils utilisateurs (extension de auth.users)
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  full_name text,
  company text,
  role text,                    -- 'exposant' | 'visiteur' | 'admin'
  sector text,
  country text,
  pavillon text,
  avatar_url text,
  subscription_tier text DEFAULT 'free_trial', -- 'free_trial' | 'paid'
  subscription_ends_at timestamptz,
  stripe_customer_id text,
  is_active boolean DEFAULT true,
  daily_exchange_count integer DEFAULT 0,
  last_exchange_reset timestamptz,
  suspended_at timestamptz,
  suspended_reason text,
  created_at timestamptz DEFAULT now()
)

-- Exposants (données salon)
exposants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles,
  nom text NOT NULL,
  description text,
  secteur text,
  pavillon text,
  stand text,
  pays text,
  website text,
  logo_url text,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)

-- Produits/Services (vitrine)
produits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exposant_id uuid REFERENCES exposants,
  nom text NOT NULL,
  description text,
  categorie text,
  image_url text,
  prix_indicatif text,
  created_at timestamptz DEFAULT now()
)

-- Conversations chat
conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a uuid REFERENCES profiles,
  participant_b uuid REFERENCES profiles,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(participant_a, participant_b)
)

-- Messages chat
messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations,
  sender_id uuid REFERENCES profiles,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)

-- Programme salon (agenda)
evenements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description text,
  pavillon text,
  salle text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  type text,                    -- 'conference' | 'atelier' | 'networking'
  speakers jsonb,
  created_at timestamptz DEFAULT now()
)

-- Rendez-vous B2B
rendez_vous (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demandeur_id uuid REFERENCES profiles,
  destinataire_id uuid REFERENCES profiles,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text DEFAULT 'pending', -- 'pending' | 'confirmed' | 'cancelled'
  notes text,
  created_at timestamptz DEFAULT now()
)

-- Abonnements Stripe
subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  status text,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now()
)
```

**RLS activé sur toutes les tables.** Règles clés :
- `profiles` : lecture publique (abonnés actifs), écriture owner uniquement
- `messages` : lecture/écriture réservées aux participants de la conversation
- `exposants` : lecture publique (abonnés), modification owner + admin
- `subscriptions` : lecture owner uniquement

---

## Variables d'Environnement

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_ANNUAL=price_...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=newsletter@promote-connect.com

# Firebase FCM
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FCM_SERVER_KEY=...

# App
NEXT_PUBLIC_APP_URL=https://promote-connect.com
```

---

## Conventions de Code

### TypeScript
- TypeScript strict activé (`strict: true`)
- Types Supabase générés via `supabase gen types typescript`
- Pas de `any` explicite — utiliser `unknown` si nécessaire

### Composants React
- Composants fonctionnels uniquement (pas de classes)
- Nom en PascalCase : `ExposantCard.tsx`
- Props typées avec `interface`, pas `type` pour les composants
- `"use client"` uniquement si nécessaire (préférer Server Components)

### Supabase
- Utiliser le client `server.ts` dans les Server Components et API Routes
- Utiliser le client `client.ts` dans les composants avec `"use client"`
- Toujours vérifier les erreurs : `const { data, error } = await supabase...`
- Utiliser les types générés : `Database['public']['Tables']['profiles']['Row']`

### Nommage
- Fichiers : `kebab-case.ts` sauf composants (`PascalCase.tsx`)
- Variables/fonctions : `camelCase`
- Constantes globales : `SCREAMING_SNAKE_CASE`
- Tables BDD : `snake_case`

### Git
- Commits : `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- Branches : `feat/annuaire-filtres`, `fix/chat-realtime`
- PR obligatoire pour `main`, review avant merge

---

## Commandes Utiles

```bash
# Dev
npm run dev                     # Serveur de développement
npm run build                   # Build production
npm run lint                    # ESLint
npm run type-check              # TypeScript check

# Supabase
supabase start                  # Démarrer Supabase local
supabase db push                # Appliquer les migrations
supabase gen types typescript --local > types/database.types.ts
supabase functions serve        # Tester les Edge Functions localement

# PWA
npm install -D sharp            # Dépendance pour génération d'icônes
node scripts/generate-pwa-icons.mjs  # Générer les icônes PWA

# Tests
npm run test                    # Vitest
npm run test:coverage           # Coverage (nécessite @vitest/coverage-v8)
npm run test:e2e                # Playwright

# Base de données
npm run db:seed                 # Seed initial
npm run db:cleanup-orphans      # Nettoyage données orphelines
```

---

## Contraintes Critiques

1. **RGPD** : Consentement explicite requis, droit à l'oubli implémenté
2. **RLS** : Toutes les tables Supabase ont RLS activé — tester chaque politique
3. **Performance** : LCP < 3s, TTI < 5s — mesurer avec Lighthouse CI
4. **Abonnement** : Vérifier `subscription_tier === 'paid'` avant tout accès aux données protégées
5. **Chat** : Données sensibles — ne jamais logger le contenu des messages
6. **Stripe Webhooks** : Toujours valider la signature (`stripe.webhooks.constructEvent`) + idempotency in-memory
7. **PWA** : Vérifier le Service Worker après chaque build (`public/sw.js`) — tester offline et push
8. **CSP** : La `worker-src 'self' blob:` doit être présente pour le Service Worker
9. **Icônes PWA** : Générer les PNG via `node scripts/generate-pwa-icons.mjs` avant déploiement
10. **Rate Limiting** : Utiliser `lib/rate-limit.ts` sur tous les endpoints exposés (FCM, upload, auth)
11. **API Auth** : Toute route API doit vérifier l'authentification (Bearer token ou verifyAdmin)
12. **Images** : Utiliser `next/image` (pas de `<img>` natif) — dimensions fixes ou `fill` avec conteneur

---

## Contacts & Ressources

- **Documentation Supabase** : https://supabase.com/docs
- **Documentation Stripe** : https://stripe.com/docs
- **shadcn/ui** : https://ui.shadcn.com
- **Resend** : https://resend.com/docs
- **n8n** : https://docs.n8n.io

---

*Ce fichier est le contexte principal pour Claude Code. Il doit être maintenu à jour à chaque évolution majeure de l'architecture.*
