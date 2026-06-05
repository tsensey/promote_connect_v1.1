# PROMOTE-CONNECT — Fiche Technique Complète

> Plateforme de networking digital pour le Salon PROMOTE — 12 mois d'accès post-salon

---

## 1. Stack Technique

| Couche | Technologie | Version |
|--------|------------|---------|
| Framework | Next.js (App Router) | 16.2.6 |
| Langage | TypeScript (strict) | 5.9.3 |
| Styling | Tailwind CSS v4 + shadcn/ui | 4.2.4 |
| Base de données | PostgreSQL (via Supabase) | — |
| Auth | Supabase Auth (SSR) | 0.10.3 |
| Client BDD | Supabase JS | 2.105.4 |
| Paiement | Stripe | 22.1.1 |
| Email | Resend | 6.12.3 |
| State client | Zustand | 5.0.13 |
| Cache serveur | TanStack React Query | 5.100.10 |
| Mobile | Capacitor (Android) | 8.3.4 |
| Monitoring | Sentry | 10.53.1 |
| Analytics | Plausible | — |
| PWA | Serwist / Service Worker | — |
| Tests | Vitest + Playwright | 4.1.6 / 1.60.0 |
| CI/CD | GitHub Actions | — |
| Automation | n8n (self-hosted) | — |

---

## 2. Architecture Routes

### Routes Publiques
| Route | Fichier | Description |
|-------|---------|-------------|
| `/` | `app/page.tsx` | Landing page (marketing) |
| `/login` | `app/(auth)/login/page.tsx` | Connexion |
| `/register` | `app/(auth)/register/page.tsx` | Inscription |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | Mot de passe oublié |
| `/reset-password` | `app/(auth)/reset-password/page.tsx` | Réinitialisation mot de passe |
| `/offline` | `app/offline/page.tsx` | Page hors-ligne PWA |
| `/condition` | `app/condition/page.tsx` | CGU |
| `/privacy` | `app/privacy/page.tsx` | Politique de confidentialité |
| `/guide` | `app/guide/page.tsx` | Guide utilisateur |

### Routes Dashboard (connecté)
| Route | Fichier | Description |
|-------|---------|-------------|
| `/app` | `app/(dashboard)/app/page.tsx` | Dashboard principal |
| `/feed` | `app/(dashboard)/feed/page.tsx` | Fil d'actualités |
| `/annuaire` | `app/(dashboard)/annuaire/page.tsx` | Annuaire exposants |
| `/annuaire/[exposantId]` | `app/(dashboard)/annuaire/[exposantId]/page.tsx` | Fiche exposant |
| `/chat` | `app/(dashboard)/chat/page.tsx` | Messagerie (liste) |
| `/chat/[conversationId]` | `app/(dashboard)/chat/[conversationId]/page.tsx` | Conversation |
| `/agenda` | `app/(dashboard)/agenda/page.tsx` | Agenda/Programme |
| `/agenda/[eventId]` | `app/(dashboard)/agenda/[eventId]/page.tsx` | Détail événement |
| `/vitrine` | `app/(dashboard)/vitrine/page.tsx` | Vitrine produits |
| `/vitrine/[exposantId]` | `app/(dashboard)/vitrine/[exposantId]/page.tsx` | Vitrine d'un exposant |
| `/exposant/ma-vitrine` | `app/(dashboard)/exposant/ma-vitrine/page.tsx` | Édition vitrine (exposant) |
| `/abonnement` | `app/(dashboard)/abonnement/page.tsx` | Abonnement Stripe |
| `/newsletter` | `app/(dashboard)/newsletter/page.tsx` | Newsletter |
| `/support` | `app/(dashboard)/support/page.tsx` | Support tickets (liste) |
| `/support/[ticketId]` | `app/(dashboard)/support/[ticketId]/page.tsx` | Détail ticket |
| `/parametres` | `app/(dashboard)/parametres/page.tsx` | Paramètres utilisateur |
| `/recherche` | `app/(dashboard)/recherche/page.tsx` | Recherche globale |

### Routes Admin
| Route | Fichier | Description |
|-------|---------|-------------|
| `/admin` | `app/admin/page.tsx` | Dashboard admin |
| `/admin/exposants` | `app/admin/exposants/page.tsx` | Gestion exposants (liste) |
| `/admin/exposants/[id]` | `app/admin/exposants/[exposantId]/page.tsx` | Détail exposant |
| `/admin/espaces` | `app/admin/espaces/page.tsx` | Gestion espaces/pavillons |
| `/admin/abonnements` | `app/admin/abonnements/page.tsx` | Abonnements Stripe |
| `/admin/signalements` | `app/admin/signalements/page.tsx` | Signalements modération |
| `/admin/tickets` | `app/admin/tickets/page.tsx` | Tickets support (liste) |
| `/admin/tickets/[id]` | `app/admin/tickets/[ticketId]/page.tsx` | Détail ticket |
| `/admin/users` | `app/admin/users/page.tsx` | Gestion utilisateurs |
| `/admin/configuration` | `app/admin/configuration/page.tsx` | Configuration plateforme |
| `/admin/logs` | `app/admin/logs/page.tsx` | Audit logs |
| `/admin/newsletter` | `app/admin/newsletter/page.tsx` | Newsletter (admin) |
| `/admin/programme` | `app/admin/programme/page.tsx` | Programme salon |

### Routes API
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/auth/forgot-password` | POST | Envoi email réinitialisation |
| `/api/chat/initiate` | POST | Créer nouvelle conversation |
| `/api/chat/send` | POST | Envoyer message |
| `/api/chat/check-quota` | GET | Vérifier quota messages |
| `/api/feed/sorted` | GET | Feed trié par date |
| `/api/feed/upload` | POST | Upload image feed |
| `/api/posts/create` | POST | Créer publication |
| `/api/search` | GET | Recherche globale |
| `/api/newsletter` | POST | Gestion newsletter |
| `/api/newsletter/subscribe` | POST | S'abonner |
| `/api/newsletter/unsubscribe` | POST | Se désabonner |
| `/api/generate-rdv` | POST | Générer RDV auto |
| `/api/rdv/notify` | POST | Notification RDV |
| `/api/vitrine/list` | GET | Liste vitrines |
| `/api/vitrine/offers/create` | POST | Créer offre |
| `/api/webhooks/stripe` | POST | Webhook Stripe |
| `/api/webhooks/fcm` | POST | Webhook FCM push |
| `/api/cron/rdv-reminder` | GET | Cron rappel RDV |
| `/api/admin/*` | — | CRUD admin (espaces, users, logs, exposants) |

---

## 3. Base de Données

### Tables Principales (76 migrations)

| Table | Description | Colonnes clés |
|-------|-------------|---------------|
| `profiles` | Profils utilisateurs (extends auth.users) | id, full_name, company, role, sector, country, subscription_status, subscription_tier, stripe_customer_id |
| `exposants` | Fiches exposants salon | id, profile_id, nom, description, secteur, pavillon, stand, pays, website, logo_url, is_featured |
| `produits` | Produits/Services (vitrine) | id, exposant_id, nom, description, categorie, image_url, prix_indicatif |
| `conversations` | Conversations chat | id, participant_a, participant_b, last_message_at |
| `messages` | Messages chat | id, conversation_id, sender_id, content, is_read, created_at |
| `evenements` | Programme salon | id, titre, description, pavillon, salle, starts_at, ends_at, type, speakers |
| `rendez_vous` | RDV B2B | id, demandeur_id, destinataire_id, starts_at, ends_at, status (pending/confirmed/cancelled) |
| `subscriptions` | Abonnements Stripe | id, profile_id, stripe_customer_id, stripe_subscription_id, status, current_period_end |
| `feed_posts` | Publications feed | id, author_id, content, media_url, created_at |
| `support_tickets` | Tickets support | id, user_id, subject, description, status, category |
| `notifications` | Notifications | id, user_id, type, title, content, is_read, created_at |
| `blocked_users` | Utilisateurs bloqués | id, blocker_id, blocked_id, reason |
| `reports` | Signalements | id, reporter_id, reported_user_id, reason, status |
| `audit_logs` | Logs d'audit | id, user_id, action, details, ip_address, created_at |
| `newsletter_subscribers` | Abonnés newsletter | id, email, locale, subscribed, unsubscribe_token |
| `platform_config` | Configuration plateforme | id, key, value, updated_at |
| `user_preferences` | Préférences utilisateur | id, user_id, notifications_enabled, locale, theme |
| `espaces` | Espaces/Pavillons (admin) | id, nom, type, description |
| `rate_limits` | Rate limiting | id, identifier, action, window_start, count |

### RLS (Row Level Security)
- Activé sur toutes les tables
- Politiques : owner only, admin only, participants (chat), abonnés payants (données protégées)
- Vérification `subscription_tier = 'paid'` avant accès données restreintes

---

## 4. Composants Frontend

### Landing Page (9 composants)
| Composant | Description |
|-----------|-------------|
| `MarketingNavbar` | Barre de navigation fixe avec logo, liens, theme/locale toggles, bouton login |
| `HeroSection` | Hero fullscreen avec mockup téléphone, CTA, badges stores, lien Fondation |
| `StatsSection` | Statistiques (500+ exposants, 2000+ pros, 12 mois) |
| `HowItWorksSection` | Témoignage + 3 étapes (profil → connexion → réseau) |
| `FeaturesSection` | Grille 6 fonctionnalités (annuaire, chat, agenda, vitrine, newsletter, support) |
| `UsefulLinksSection` | Liens utiles (salon, plan, support, interprogress) |
| `CtaSection` | CTA final avec bouton d'accès |
| `MarketingFooter` | Footer logo, Fondation, liens, mentions, badges stores |
| `BrandStrip` | *(inutilisé)* Images salon |

### Dashboard (Layout)
| Composant | Description |
|-----------|-------------|
| `UserSidebar` | Sidebar navigation utilisateur |
| `UserTopbar` | Topbar avec notifications et profil |
| `MobileBottomNav` | Navigation mobile bottom |
| `TrialBanner` | Bannière essai gratuit / abonnement |
| `NotificationDropdown` | Dropdown notifications temps réel |

### Admin (Layout)
| Composant | Description |
|-----------|-------------|
| `AdminSidebar` | Sidebar navigation admin |
| `AdminTopbar` | Topbar admin |

### Modules Fonctionnels
| Composant | Module | Description |
|-----------|--------|-------------|
| `EvenementCard`, `RdvCard`, `ProgrammeFormDialog`, `NewRdvDialog` | Agenda | Événements, RDV, formulaire |
| `ChatInput`, `MessageBubble` | Chat | Saisie, bulles messages |
| `CreatePost`, `CreatePostFAB`, `PostCard` | Feed | Publication, carte post |
| `SearchBar`, `SearchCommandPalette`, `SearchResultItem` | Recherche | Barre, palette commandes, résultats |

### Shared
| Composant | Description |
|-----------|-------------|
| `ScrollReveal` | Animation au scroll (IntersectionObserver) |
| `AppStoreBadges` | Badge Google Play |
| `UserIdentity` | Avatar + nom utilisateur |
| `NotificationProvider` | Provider notifications temps réel |
| `PwaRegister` | Enregistrement PWA |
| `MentionInput`, `ParsedMentionText` | Mentions @utilisateur |
| `ReportButton` | Bouton signalement |
| `ConversionModal` | Modal conversion abonnement |
| `NativeAuthGuard` | Guard auth pour Capacitor |
| `SentryErrorBoundary` | Error boundary Sentry |
| `AdminPagination` | Pagination admin |
| `PlausibleAnalytics` | Analytics Plausible |

### shadcn/ui (43 composants)
accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, breadcrumb-nav, button, button-group, calendar, card, carousel, checkbox, collapsible, combobox, command, dialog, dropdown-menu, field, hover-card, input, input-group, input-otp, label, locale-toggle, mode-toggle, native-select, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, sonner, spinner, switch, table, tabs, textarea, tooltip

---

## 5. Hooks (15)

| Hook | Description |
|------|-------------|
| `useAgenda` | Événements et RDV |
| `useAnnuaire` | Annuaire exposants avec filtres |
| `useBlockedUsers` | Gestion blocages |
| `useChat` | Messagerie temps réel |
| `useExposants` | Données exposants |
| `useFeed` | Fil d'actualités |
| `useIdentity` | Identité utilisateur courante |
| `useIntersectionObserver` | Observer visibilité éléments |
| `useMediaQuery` | Media queries responsive |
| `use-mobile` | Détection mobile |
| `useNotifications` | Notifications temps réel |
| `usePermissions` | Vérification permissions |
| `useProfilePosts` | Posts d'un profil |
| `useSearch` | Recherche globale |
| `useSettings` | Paramètres utilisateur |
| `useSupport` | Tickets support |

---

## 6. Stores Zustand (3)

| Store | Description |
|-------|-------------|
| `agendaStore` | État agenda (événements, RDV, filtres) |
| `chatStore` | État chat (conversations, messages, statut) |
| `userStore` | État utilisateur (profil, préférences, abonnement) |

---

## 7. Edge Functions Supabase (3)

| Function | Description |
|----------|-------------|
| `generate-rdv` | Génération automatique de RDV |
| `send-newsletter` | Envoi newsletter via Resend |
| `send-push-notification` | Notifications push FCM |

---

## 8. Emails Transactionnels (6)

| Template | Déclencheur |
|----------|-------------|
| `WelcomeEmail` | Inscription |
| `NewsletterEmail` | Envoi newsletter |
| `RdvConfirmationEmail` | Confirmation RDV |
| `CredentialsEmail` | Création compte (admin) |
| `ForgotPasswordEmail` | Mot de passe oublié |
| `ResetPasswordEmail` | Confirmation réinitialisation |

---

## 9. Scripts (7)

| Script | Description |
|--------|-------------|
| `seed.js` | Seed initial base de données |
| `create-admin.mjs` | Création compte admin CLI |
| `cleanup-orphans.js` | Nettoyage données orphelines |
| `generate-pwa-icons.mjs` | Génération icônes PWA |
| `build-capacitor.mjs` | Build Capacitor (export statique) |
| `check-production-env.mjs` | Vérification variables prod |

---

## 10. Sécurité

- **CSP** : Content Security Policy stricte (next.config.mjs)
- **HSTS** : Strict-Transport-Security max-age 2 ans
- **Permissions Policy** : Caméra/micro/géolocalisation bloquées
- **X-Frame-Options** : DENY
- **CORS** : Configuré via Supabase
- **Rate Limiting** : `lib/rate-limit.ts` sur endpoints exposés
- **RLS** : Row Level Security sur toutes les tables Supabase
- **Validation** : `dompurify` pour sanitize HTML
- **Webhook Stripe** : Validation signature + idempotency
- **Auth** : Supabase SSR avec refresh tokens

---

## 11. PWA & Mobile

- **PWA** : Service Worker avec cache offline (public/sw.js)
- **Manifest** : site.webmanifest + icônes 72-512px
- **Capacitor** : Build Android (TWA) via scripts/build-capacitor.mjs
- **Push** : Firebase Cloud Messaging (FCM)
- **Splash Screen** : Capacitor splash screen

---

## 12. Modules Fonctionnels (A-G)

| Module | Priorité | Description |
|--------|----------|-------------|
| **A — Annuaire** | Haute | Liste paginée + filtres (secteur, pays, pavillon) + fiches détaillées |
| **B — Chat** | Haute | Messagerie 1-to-1 temps réel, historique 12 mois, fichiers, notifications push |
| **C — Agenda** | Haute | Programme salon, RDV B2B, rappels, notifications |
| **D — Vitrine** | Moyenne | CRUD produits/services exposants, stats vues |
| **E — Newsletter** | Moyenne | Envoi automatisé via n8n + Resend, personnalisation secteur |
| **F — Support** | Moyenne | Chat support + système tickets + FAQ |
| **G — Abonnement** | Haute | Gestion Stripe, accès 12 mois, renouvellement |

---

## 13. Internationalisation

| Locale | Fichier |
|--------|---------|
| Français (défaut) | `lib/i18n/translations.ts` — bloc `fr` |
| Anglais | `lib/i18n/translations.ts` — bloc `en` |
| Provider | `lib/i18n/I18nProvider.tsx` |
| Hook | `useTranslation()` depuis `lib/i18n` |

~3200 lignes de traductions, ~126 clés landing page, clés pour tous les modules

---

## 14. Déploiement

| Cible | Plateforme | Branche |
|-------|-----------|---------|
| Production | Vercel | `main` |
| Staging | VPS OVH (Supabase self-hosted) | — |
| Mobile | Play Store (TWA Capacitor) | — |

---

## 15. Commandes utiles

```bash
npm run dev          # Développement
npm run build        # Build production
npm run lint         # ESLint
npm run type-check   # TypeScript check
npm run test         # Tests Vitest
npm run test:e2e     # Tests Playwright
npm run db:seed      # Seed base
npm run cap:build    # Build Capacitor
```
