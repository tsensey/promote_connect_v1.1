# Deploiement Production PROMOTE-CONNECT

Ce guide decrit le deploiement production de PROMOTE-CONNECT avec Next.js sur Vercel et Supabase self-hosted ou cloud. Il doit etre execute depuis une branche validee, idealement `main`.

## 1. Pre-requis

- Node.js 22.x
- npm avec `package-lock.json` a jour
- Supabase CLI connectee au projet production
- Un projet Vercel lie au depot GitHub
- Un domaine HTTPS final, par exemple `https://promote-connect.com`
- Comptes et cles production pour Supabase, Stripe, Resend, Firebase FCM, Sentry et Plausible

## 2. Variables d'environnement

Configurer ces variables dans Vercel, GitHub Actions et, si necessaire, sur le VPS Supabase/n8n.

Variables obligatoires:

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

Variables recommandees:

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
```

Verification locale:

```bash
npm run check:prod-env
```

## 3. Verification avant livraison

Executer:

```bash
npm ci
npm run lint
npm run type-check
npm run test
npm run build
```

Verifier que le build ne signale pas d'erreur, que les tests passent, et que les avertissements restants sont acceptes par l'equipe.

## 4. Base de donnees Supabase

1. Sauvegarder la base production avant migration.
2. Lier le projet si ce n'est pas deja fait:

```bash
supabase link --project-ref <PROJECT_REF>
```

3. Appliquer les migrations:

```bash
supabase db push
```

4. Regenerer les types apres modification de schema:

```bash
supabase gen types typescript --project-id <PROJECT_REF> > types/database.types.ts
```

5. Verifier les politiques RLS:

- `profiles`: lecture controlee, ecriture owner ou admin
- `messages`: lecture/ecriture uniquement par participants
- `exposants`: modification owner ou admin
- `subscriptions`: lecture owner uniquement
- `audit_logs`: acces admin uniquement

## 5. Buckets et stockage

Creer ou verifier les buckets Supabase:

- `feed-images`
- buckets produits/vitrine si utilises par les migrations

Verifier:

- taille maximale coherente avec l'application
- types MIME images autorises
- URLs publiques uniquement pour les assets prevus
- aucune donnee sensible dans un bucket public

## 6. Edge Functions Supabase

Deployer:

```bash
supabase functions deploy send-newsletter --project-ref <PROJECT_REF>
supabase functions deploy send-push-notification --project-ref <PROJECT_REF>
supabase functions deploy generate-rdv --project-ref <PROJECT_REF>
```

Configurer les secrets necessaires cote Supabase:

```bash
supabase secrets set RESEND_API_KEY=... --project-ref <PROJECT_REF>
supabase secrets set FCM_SERVER_KEY=... --project-ref <PROJECT_REF>
```

## 7. Stripe

1. Creer le produit et le prix annuel dans Stripe.
2. Renseigner `STRIPE_PRICE_ID_ANNUAL`.
3. Creer le webhook production vers:

```text
https://promote-connect.com/api/webhooks/stripe
```

4. Evenements a activer:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

5. Copier le signing secret dans `STRIPE_WEBHOOK_SECRET`.

## 8. Resend

1. Verifier le domaine d'envoi.
2. Configurer SPF, DKIM et DMARC.
3. Utiliser une adresse expediteur du domaine valide, par exemple `newsletter@promote-connect.com`.
4. Envoyer un email de test depuis l'admin newsletter.

## 9. Firebase FCM et PWA

1. Configurer Firebase Web App et renseigner les variables `NEXT_PUBLIC_FIREBASE_*`.
2. Configurer `FCM_SERVER_KEY` si l'endpoint legacy est conserve.
3. Generer les icones avant publication si le logo change:

```bash
node scripts/generate-pwa-icons.mjs
```

4. Verifier:

- `/manifest.webmanifest`
- `/sw.js`
- `/offline`
- icones 192px, 512px et maskable
- `worker-src 'self' blob:` dans la CSP

## 10. Deploiement Vercel

1. Lier le depot au projet Vercel.
2. Configurer toutes les variables d'environnement en `Production`.
3. Definir:

```text
Build Command: npm run build
Install Command: npm ci
Output: .next
Node.js: 22.x
```

4. Deployer via GitHub Actions ou Vercel:

```bash
vercel --prod
```

Le workflow `.github/workflows/deploy.yml` deploie automatiquement `main` vers Vercel si les secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` et `VERCEL_PROJECT_ID` sont configures.

## 11. Checklist post-deploiement

- Ouvrir `/login`, se connecter avec un admin, acceder a `/admin`.
- Verifier que les non-admins sont rediriges hors de `/admin`.
- Creer un utilisateur depuis `/admin/users`.
- Envoyer une newsletter de test.
- Uploader une image dans le feed.
- Tester la navigation offline apres chargement initial.
- Tester le webhook Stripe avec un evenement de test signe.
- Controler Sentry apres une erreur volontaire en environnement de staging.
- Controler Plausible et l'absence d'erreurs CSP dans la console navigateur.
- Executer Lighthouse sur mobile et desktop.

## 12. Rollback

En cas d'incident:

1. Revenir au dernier deploiement stable Vercel.
2. Desactiver temporairement les webhooks Stripe si l'incident touche les abonnements.
3. Restaurer la sauvegarde Supabase si une migration a corrompu des donnees.
4. Verifier les logs Vercel, Supabase, Sentry et les `audit_logs`.

## 13. Etat actuel

Les commandes suivantes doivent rester vertes avant chaque mise en production:

```bash
npm run lint
npm run type-check
npm run test
npm run build
```

Le projet utilise `proxy.ts`, la convention Next.js 16 actuelle, pour la protection des routes connectees.
