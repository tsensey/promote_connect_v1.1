# Déploiement Production PROMOTE-CONNECT

Ce guide décrit le déploiement production de PROMOTE-CONNECT avec Next.js sur Vercel et Supabase (cloud ou self-hosted).  
À exécuter depuis une branche validée, idéalement `main`.

---

## 1. Pré-requis

- Node.js 22.x
- npm avec `package-lock.json` à jour
- Supabase CLI connectée au projet production
- Un projet Vercel lié au dépôt GitHub
- Un domaine HTTPS final, ex. `https://promote-connect.com`
- Comptes et clés production pour Supabase, Stripe, Resend, Firebase FCM, Sentry et Plausible

---

## 2. Variables d'environnement

Configurer ces variables dans **Vercel** (Production), **GitHub Actions**, et le **VPS Supabase/n8n** le cas échéant.

### Obligatoires

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://promote-connect.com

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

RESEND_API_KEY=
RESEND_FROM_EMAIL=newsletter@promote-connect.com
```

### Recommandées

```bash
STRIPE_PRICE_ID_ANNUAL=
RESEND_FROM_NAME=PROMOTE-CONNECT

FCM_SERVER_KEY=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_PLAUSIBLE_URL=https://plausible.io
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=promote-connect.com

NEXT_PUBLIC_ANDROID_PACKAGE_NAME=com.promoteconnect.app
NEXT_PUBLIC_IOS_TEAM_ID=
NEXT_PUBLIC_IOS_APP_STORE_ID=

# Seed (optionnel, pour le déploiement initial uniquement)
SEED_ADMIN_EMAIL=admin@promote-connect.com
SEED_ADMIN_PASSWORD=<mot_de_passe_fort>
```

Vérification locale :

```bash
npm run check:prod-env
```

> **Fichier de référence** : `.env.example` à la racine du projet.

---

## 3. Vérification avant livraison

```bash
npm ci
npm run lint
npm run type-check
npm run test
npm run build
```

Le build doit être vert, les tests doivent passer.

---

## 4. Base de données Supabase

### 4.1 Sauvegarde

Toujours sauvegarder la base production avant toute migration.

### 4.2 Lier le projet

```bash
supabase link --project-ref <PROJECT_REF>
```

### 4.3 Appliquer les migrations

```bash
supabase db push
```

Les 34 migrations (000 à 034) créent l'ensemble du schéma : tables, RLS, indexes, publications Realtime, buckets Storage.

### 4.4 Régénérer les types TypeScript (après modification de schéma)

```bash
supabase gen types typescript --project-id <PROJECT_REF> > types/database.types.ts
```

### 4.5 Seed de la base de données

Le seed **ne doit être exécuté qu'une seule fois**, sur un environnement vierge (ou avec `--clean` pour tout réinitialiser).

```bash
# Seed standard (ajoute les données sans effacer)
npm run db:seed

# Seed avec nettoyage préalable (supprime toutes les lignes + utilisateurs Auth)
npm run db:seed -- --clean
# ou
CLEAN_DATABASE=true npm run db:seed
```

**Ce que le seed créé :**

| Donnée | Détail |
|--------|--------|
| **Compte admin** | `admin@promote-connect.com` / `Admin@2026!secure` (surchargeable via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`) |
| **Utilisateurs de test** | 6 exposants + 2 visiteurs (mot de passe : `Test1234!`) |
| **Fiches exposants** | 7 fiches (5 liées à des utilisateurs, 2 orphelines) |
| **Produits/Services** | 10 produits répartis sur les fiches |
| **Événements salon** | 4 événements (conférences, atelier, networking) |
| **Conversation chat** | 3 messages entre Alice et Bob |
| **Newsletter** | 2 abonnements + 1 édition exemple |
| **Ticket support** | 1 ticket avec 2 messages |

### 4.6 Création d'un admin en ligne de commande (alternatif)

Si le seed n'est pas utilisé, un admin peut être créé manuellement :

```bash
node scripts/create-admin.mjs <email> [nom_complet]
```

Le script génère un mot de passe aléatoire de 12 caractères et l'affiche en sortie.  
**Ne pas oublier de le transmettre de manière sécurisée à l'administrateur.**

### 4.7 Politiques RLS à vérifier

- `profiles` : lecture contrôlée, écriture owner ou admin
- `messages` : lecture/écriture uniquement par participants
- `exposants` : modification owner ou admin
- `subscriptions` : lecture owner uniquement
- `audit_logs` : accès admin uniquement

---

## 5. Buckets Storage

Créer ou vérifier les buckets Supabase :

```bash
# Buckets d'images
feed-images       # Publications du fil d'actualité
vitrine-images    # Logos, couvertures, produits, galerie exposants
chat_media        # Pièces jointes du chat (images, documents)
avatars           # Avatars des profils utilisateurs
```

Vérifier pour chaque bucket :

- taille maximale cohérente (5 Mo recommandé pour les images)
- types MIME autorisés (`image/jpeg`, `image/png`, `image/webp`, `image/gif` ; + `application/pdf` et `application/msword` pour `chat_media`)
- URLs publiques uniquement pour les assets prévus
- aucune donnée sensible dans un bucket public

---

## 6. Edge Functions Supabase

Déployer :

```bash
supabase functions deploy send-newsletter --project-ref <PROJECT_REF>
supabase functions deploy send-push-notification --project-ref <PROJECT_REF>
supabase functions deploy generate-rdv --project-ref <PROJECT_REF>
```

Configurer les secrets côté Supabase :

```bash
supabase secrets set RESEND_API_KEY=<votre_clé> --project-ref <PROJECT_REF>
supabase secrets set FCM_SERVER_KEY=<votre_clé> --project-ref <PROJECT_REF>
```

---

## 7. Stripe

1. Créer le produit et le prix annuel dans Stripe Dashboard.
2. Renseigner `STRIPE_PRICE_ID_ANNUAL` avec l'ID du prix (`price_xxx`).
3. Créer le webhook production vers :

```
https://promote-connect.com/api/webhooks/stripe
```

4. Événements à activer :

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

5. Copier le signing secret dans `STRIPE_WEBHOOK_SECRET`.

---

## 8. Resend

1. Vérifier le domaine d'envoi dans Resend Dashboard.
2. Configurer SPF, DKIM et DMARC sur le DNS du domaine.
3. Utiliser une adresse expéditeur du domaine valide, ex. `newsletter@promote-connect.com`.
4. Envoyer un email de test depuis l'admin newsletter.

---

## 9. Firebase FCM et PWA

1. Créer une Firebase Web App et renseigner les variables `NEXT_PUBLIC_FIREBASE_*`.
2. Configurer `FCM_SERVER_KEY` si l'endpoint legacy est conservé.
3. Générer les icônes PWA si le logo change :

```bash
node scripts/generate-pwa-icons.mjs
```

4. Vérifier en production :

- `/manifest.webmanifest` accessible et valide
- `/sw.js` enregistré
- `/offline` accessible
- icônes 192px, 512px et maskable présentes dans `public/icons/`
- `worker-src 'self' blob:` dans la CSP (configuré dans `next.config.mjs`)

---

## 10. Déploiement Vercel

1. Lier le dépôt au projet Vercel.
2. Configurer toutes les variables d'environnement en `Production`.
3. Définir dans Vercel Dashboard :

```
Build Command    : npm run build
Install Command  : npm ci
Output Directory : .next
Node.js Version  : 22.x
```

4. Déployer :

```bash
# Via Vercel CLI
vercel --prod

# Ou via GitHub Actions (push sur main)
git push origin main
```

Le workflow `.github/workflows/deploy.yml` déploie automatiquement `main` vers Vercel si les secrets GitHub `VERCEL_TOKEN`, `VERCEL_ORG_ID` et `VERCEL_PROJECT_ID` sont configurés.

---

## 11. Procédure de déploiement initial (première mise en production)

```bash
# 1. Cloner + installer
git clone <repo> promote-connect && cd promote-connect
npm ci

# 2. Copier et renseigner les variables
cp .env.example .env.local
# → Éditer .env.local avec les clés de production

# 3. Vérifier l'environnement
npm run check:prod-env

# 4. Appliquer les migrations Supabase
supabase link --project-ref <PROJECT_REF>
supabase db push

# 5. Créer les buckets Storage (si pas déjà dans les migrations)
# Voir section 5

# 6. Seed la base de données
npm run db:seed

# 7. Déployer les Edge Functions
supabase functions deploy send-newsletter --project-ref <PROJECT_REF>
supabase functions deploy send-push-notification --project-ref <PROJECT_REF>
supabase functions deploy generate-rdv --project-ref <PROJECT_REF>
supabase functions secrets set RESEND_API_KEY=... --project-ref <PROJECT_REF>
supabase functions secrets set FCM_SERVER_KEY=... --project-ref <PROJECT_REF>

# 8. Générer les icônes PWA
node scripts/generate-pwa-icons.mjs

# 9. Configurer Stripe (produit + webhook) et Resend (domaine)
# Voir sections 7 et 8

# 10. Déployer sur Vercel
npm run build
vercel --prod
```

---

## 12. Compte admin par défaut

Après exécution du seed, un compte administrateur est créé :

| Champ | Valeur par défaut |
|-------|-------------------|
| Email | `admin@promote-connect.com` |
| Mot de passe | `Admin@2026!secure` |
| Rôle | `admin` |
| Nom | `Administrateur PROMOTE` |

**⚠️ Sécurité :** Changer impérativement le mot de passe après la première connexion.  
En production, surcharger via les variables d'environnement :

```bash
SEED_ADMIN_EMAIL=admin@votre-domaine.com
SEED_ADMIN_PASSWORD=<mot_de_passe_complexe_32_caracteres>
```

Pour créer un admin **sans seed** (base déjà en production) :

```bash
node scripts/create-admin.mjs admin@votre-domaine.com "Nom Admin"
```

---

## 13. Utilitaires disponibles

| Script | Commande | Usage |
|--------|----------|-------|
| Seed BDD | `npm run db:seed` | Peupler la base avec des données de démo + admin |
| Création admin | `node scripts/create-admin.mjs` | Créer un admin sans seed |
| Nettoyage orphelins | `npm run db:cleanup-orphans` | Supprimer les données orphelines (profiles sans auth, messages sans conversation, etc.) |
| Vérification env | `npm run check:prod-env` | Vérifier les variables d'environnement |
| Icônes PWA | `node scripts/generate-pwa-icons.mjs` | Générer les icônes PWA depuis le logo |
| Génération types | `supabase gen types typescript` | Régénérer `types/database.types.ts` |

---

## 14. Checklist post-déploiement

- [ ] Accéder à la page d'accueil → redirigé vers `/login`
- [ ] Se connecter avec le compte admin → redirigé vers `/admin`
- [ ] Vérifier que les non-admins sont redirigés hors de `/admin`
- [ ] Créer un utilisateur depuis `/admin/users`
- [ ] Envoyer une newsletter de test depuis l'admin
- [ ] Uploader une image dans le feed → compression appliquée
- [ ] Tester le chat (envoi de message + pièce jointe)
- [ ] Tester la navigation offline après chargement initial
- [ ] Tester le webhook Stripe avec un événement de test signé
- [ ] Vérifier Sentry après une erreur volontaire en staging
- [ ] Vérifier Plausible et l'absence d'erreurs CSP dans la console
- [ ] Exécuter Lighthouse sur mobile et desktop (LCP < 3s, TTI < 5s)
- [ ] Vérifier le manifest PWA et l'enregistrement du Service Worker
- [ ] Vérifier que la compression d'images fonctionne (feed, vitrine, chat, avatar)

---

## 15. Rollback

En cas d'incident :

1. Revenir au dernier déploiement stable Vercel (Instantané ou `vercel rollback`).
2. Désactiver temporairement les webhooks Stripe si l'incident touche les abonnements.
3. Restaurer la sauvegarde Supabase si une migration a corrompu des données.
4. Vérifier les logs Vercel, Supabase, Sentry et la table `audit_logs`.

---

## 16. État actuel

Les commandes suivantes doivent rester vertes avant chaque mise en production :

```bash
npm run lint
npm run type-check
npm run test
npm run build
```

Le projet utilise `proxy.ts` (convention Next.js 16) pour la protection des routes connectées.
