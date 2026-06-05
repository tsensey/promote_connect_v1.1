# Déploiement Production PROMOTE-CONNECT (100% Self-Hosted)

Ce guide décrit le déploiement en production de PROMOTE-CONNECT dans un environnement **100% auto-hébergé sur un VPS** (Virtual Private Server). L'architecture comprend Supabase (Backend/Database), Next.js (Frontend) et n8n/Cron pour les tâches automatisées.

Le but de ce guide est de déployer une application **totalement vierge** (aucune donnée de test) avec le strict nécessaire pour fonctionner, ainsi qu'un unique **compte administrateur**.

---

## 1. Architecture & Pré-requis

### Architecture du Serveur (VPS)
- **Frontend** : Next.js 16 (Node.js) géré via PM2 ou Docker.
- **Backend / BDD** : Supabase (PostgreSQL, Auth, Storage, Realtime) géré via Docker Compose.
- **Automatisation** : n8n (Docker Compose) ou tâches Cron.
- **Reverse Proxy** : Nginx (pour gérer les requêtes HTTP/HTTPS vers Next.js, Supabase API, et n8n).

### Pré-requis VPS (Ubuntu / Debian recommandé)
- VPS avec au moins 4Go de RAM (8Go recommandé pour Supabase + Next.js).
- Nom de domaine configuré avec les sous-domaines (ex: `promote-connect.pro`, `api.promote-connect.pro`, `n8n.promote-connect.pro`).
- Accès SSH root ou sudoer.
- Logiciels installés sur le VPS :
  - `docker` et `docker-compose` (ou `docker compose`)
  - `node.js` (version 22.x) et `npm`
  - `pm2` (`npm install -g pm2`)
  - `nginx` et `certbot` (pour le SSL Let's Encrypt)
  - `git`

---

## 2. Déploiement du Backend (Supabase Self-Hosted)

### 2.1. Cloner et Configurer Supabase sur le VPS
1. Connectez-vous à votre VPS en SSH.
2. Clonez le dépôt officiel de Supabase :
   ```bash
   git clone --depth 1 https://github.com/supabase/supabase
   cd supabase/docker
   cp .env.example .env
   ```

3. **Génération des clés de sécurité :**  
   Supabase fournit des scripts pour générer des clés robustes. Toujours dans le dossier `supabase/docker`, exécutez :
   ```bash
   sh utils/generate-keys.sh
   sh utils/add-new-auth-keys.sh
   ```
   *Ces commandes vont automatiquement pré-remplir votre fichier `.env` avec des clés sécurisées (`JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, etc.).*

4. **Édition du fichier `.env` :**  
   Ouvrez le fichier `.env` (`nano .env`) et personnalisez les variables suivantes :
   - `POSTGRES_PASSWORD` : Définissez un mot de passe extrêmement fort.
   - `SITE_URL` : `https://promote-connect.pro` (l'URL de votre application Next.js).
   - `API_EXTERNAL_URL` : `https://api.promote-connect.pro` (l'URL de votre API Supabase gérée via Nginx).
   - `POOLER_TENANT_ID` : Prenez note de cette valeur (par défaut `your-tenant-id`), elle est cruciale pour le pooler de connexions.

5. **Démarrer les services Supabase :**
   ```bash
   docker-compose up -d
   ```
   *Supabase va télécharger et lancer une quinzaine de conteneurs (Studio, Postgres, GoTrue, Realtime, Storage, etc.).*

### 2.2. Migration de la Base de Données (Push) depuis votre ordinateur
Contrairement au projet hébergé sur le Cloud, la version auto-hébergée présente des particularités (notamment avec Supavisor et le TLS).

Sur votre **machine locale** (où le code source de PROMOTE-CONNECT est situé), vous allez transférer la structure de la base vers le VPS.

1. **Construire l'URL de connexion :**  
   Vous devez utiliser le format `postgres.<POOLER_TENANT_ID>` comme nom d'utilisateur (afin de traverser le Pooler Supavisor).
   ```bash
   # Remplacez <POSTGRES_PASSWORD> et <POOLER_TENANT_ID> par les valeurs de votre .env sur le VPS
   export SUPABASE_DB_URL="postgresql://postgres.<POOLER_TENANT_ID>:<POSTGRES_PASSWORD>@187.124.0.110:5432/postgres"
   ```

2. **Désactiver la vérification SSL/TLS (si pas de tunnel SSH) :**  
   Le client `supabase` force la vérification TLS par défaut, ce qui échoue sur l'auto-hébergement standard. Forcez la désactivation via la variable `PGSSLMODE` :
   ```bash
   PGSSLMODE=disable npx supabase db push --db-url $SUPABASE_DB_URL
   ```

*(Alternative plus sécurisée : créez un tunnel SSH `ssh -L 5432:localhost:5432 root@187.124.0.110 -N -f` et poussez sur `localhost:5432` sans avoir besoin d'ouvrir le port 5432 sur internet).*

### 2.3. Configuration du Storage et des Edge Functions
1. **Buckets Storage :**  
   Une fois les migrations terminées, assurez-vous que les buckets sont créés et configurés : `feed-images`, `vitrine-images`, `chat_media`, `avatars`.
   
2. **Edge Functions (Le piège du Self-Hosting) :**  
   Contrairement à Supabase Cloud, la commande CLI `supabase functions deploy` **ne fonctionne pas** pour un VPS auto-hébergé. L'environnement `edge-runtime` lit directement les fonctions depuis un dossier local.
   
   **Pour déployer vos fonctions :**
   1. Sur votre VPS, repérez le dossier des volumes Supabase (généralement `/opt/supabase/docker/volumes/functions/`).
   2. Depuis votre machine locale, transférez le dossier de vos fonctions via `scp` ou `rsync` :
      ```bash
      scp -r ./supabase/functions/* root@187.124.0.110:/chemin/vers/supabase/docker/volumes/functions/
      ```
   3. Sur le VPS, redémarrez le conteneur Edge Runtime pour qu'il prenne en compte les nouveaux fichiers :
      ```bash
      docker restart supabase-edge-runtime
      ```
      
   *Note : Dans une architecture 100% auto-hébergée (Self-hosted) avec n8n, il est très souvent recommandé de déléguer les tâches complexes (Newsletters, Relances B2B) à n8n ou à des API Routes Next.js protégées, plutôt que de maintenir un serveur Edge Deno complet qui complique la gestion des déploiements.*

---

## 3. Déploiement du Frontend (Next.js)

### 3.1. Cloner l'application
Sur le VPS, clonez votre projet :
```bash
git clone <url-du-repo-promote-connect> /var/www/promote-connect
cd /var/www/promote-connect
npm ci
```

### 3.2. Variables d'Environnement (.env.local)
Créez le fichier `.env.local` :
```bash
cp .env.example .env.local
nano .env.local
```
Configurez avec les clés de votre Supabase Self-Hosted, Stripe, Resend et FCM :
```bash
NEXT_PUBLIC_SUPABASE_URL=https://api.promote-connect.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY_GENEREE_PRECEDEMMENT>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY_GENEREE_PRECEDEMMENT>

NEXT_PUBLIC_APP_URL=https://promote-connect.pro

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=newsletter@promote-connect.pro

# Firebase / FCM (push notifications)
# Obtenez ces valeurs depuis Firebase Console > Project Settings > General > Web Apps
NEXT_PUBLIC_FIREBASE_API_KEY=<Firebase Web API Key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<firebase-app-id>
# Server Key depuis Firebase Console > Cloud Messaging > Cloud Messaging API (Legacy)
FCM_SERVER_KEY=<FCM Server Key>
```

### 3.3. Build et Lancement avec PM2
Compilez l'application et démarrez-la en arrière-plan :
```bash
npm run build
pm2 start npm --name "promote-connect" -- start
pm2 save
pm2 startup
```
L'application Next.js tournera localement sur le port `3000`.

---

## 4. Initialisation Vierge (Seed) : Création de l'Administrateur

Pour avoir un environnement **entièrement vierge** mais fonctionnel, il ne faut insérer aucune donnée d'exposant, de feed ou de visiteurs.
Seul le compte administrateur doit être créé.

> **Note :** Les données structurelles nécessaires au fonctionnement de l'application (comme la configuration des espaces et pavillons du salon) sont insérées automatiquement par les migrations Supabase (`021_create_espaces.sql`) et **ne sont pas effacées** par la réinitialisation.

Depuis le répertoire `/var/www/promote-connect` sur le VPS (une fois l'environnement configuré) :
```bash
# S'assurer d'utiliser les variables d'environnement de production (NEXT_PUBLIC_SUPABASE_URL, etc.)
# Exécutez le script avec l'option clean pour vider toute potentielle donnée de test résiduelle
CLEAN_DATABASE=true SEED_ADMIN_EMAIL=admin@promote-connect.pro SEED_ADMIN_PASSWORD=<MotDePasseTresFort> npm run db:seed -- --clean
```

Alternativement, vous pouvez utiliser le script dédié à la création de l'admin (qui ne touchera pas aux autres tables) :
```bash
node scripts/create-admin.mjs admin@promote-connect.pro "Administrateur PROMOTE"
```
Ce script créera le compte Auth, le `profile` avec le rôle `admin`, et affichera le mot de passe généré si vous ne l'avez pas spécifié.

---

## 5. Automatisation (n8n / Cron)

Les envois de newsletters différés, relances, et autres tâches planifiées sont gérés par n8n (ou des scripts Cron).

### 5.1 n8n (Docker Compose)

Pour déployer n8n de manière robuste :

1. Créez un répertoire pour n8n :
   ```bash
   mkdir -p /opt/n8n
   cd /opt/n8n
   ```

2. Créez un fichier `docker-compose.yml` :
   ```bash
   nano docker-compose.yml
   ```
   *Insérez le contenu suivant :*
   ```yaml
   version: "3.7"
   services:
     n8n:
       image: n8nio/n8n:latest
       restart: always
       environment:
         - N8N_HOST=n8n.promote-connect.pro
         - N8N_PORT=5678
         - N8N_PROTOCOL=https
         - NODE_ENV=production
         - WEBHOOK_URL=https://n8n.promote-connect.pro/
         - GENERIC_TIMEZONE=Africa/Douala
       ports:
         - "5678:5678"
       volumes:
         - ./n8n_data:/home/node/.n8n
   ```

3. Créez le dossier de données et appliquez les bonnes permissions :
   ```bash
   mkdir n8n_data
   chown -R 1000:1000 n8n_data
   ```

4. Lancez le service n8n en tâche de fond :
   ```bash
   docker-compose up -d
   ```
   *Le service sera accessible localement sur le port `5678`, et exposé sur `https://n8n.promote-connect.pro` via le reverse proxy Nginx.*

5. Configuration initiale :
   - Rendez-vous sur `https://n8n.promote-connect.pro` pour créer le compte administrateur (Owner).
   - Dans le menu **Credentials**, ajoutez les accès requis :
     - **Supabase API** : Utilisez l'URL de votre API et la clé `SERVICE_ROLE_KEY` (indispensable pour contourner les RLS lors des tâches de fond).
     - **Resend API** : Pour l'envoi des emails (newsletters).
   - Importez les workflows PROMOTE-CONNECT (depuis un fichier JSON d'export).
   - Activez les workflows (`Active` switch on).

---

## 6. Déploiement Automatique (GitHub Actions)

Pour automatiser la mise à jour de l'application Next.js à chaque `push` sur la branche `main`, un workflow GitHub Actions (`.github/workflows/deploy.yml`) est configuré pour se connecter en SSH au serveur et recompiler l'application.

### 6.1 Configuration des Secrets GitHub
Allez dans les paramètres de votre dépôt GitHub (`Settings > Secrets and variables > Actions`) et ajoutez les secrets suivants :

- `VPS_HOST` : `187.124.0.110`
- `VPS_USERNAME` : Le nom d'utilisateur SSH (ex: `root` ou `ubuntu`).
- `VPS_SSH_KEY` : La clé privée SSH permettant de se connecter au serveur (le contenu de votre `id_rsa` ou `id_ed25519`).

### 6.2 Fonctionnement du Workflow
À chaque modification envoyée sur la branche `main`, GitHub Actions va se connecter au VPS, se rendre dans le dossier `/var/www/promote-connect`, récupérer le code (`git pull origin main`), installer les dépendances (`npm ci`), recompiler (`npm run build`) et relancer le processus PM2 (`pm2 restart promote-connect`).

---

## 7. Configuration Nginx & SSL

Utilisez Nginx comme reverse proxy pour router le trafic vers les différents services et sécuriser l'accès avec HTTPS.

Dans `/etc/nginx/sites-available/promote-connect` :

```nginx
# 1. Frontend Next.js
server {
    server_name promote-connect.pro;

    # CSP : autoriser Firebase/FCM pour les notifications push
    add_header Content-Security-Policy "
        default-src 'self';
        connect-src 'self' https://fcm.googleapis.com https://*.firebaseio.com wss://api.promote-connect.pro;
        worker-src 'self' blob:;
        img-src 'self' data: blob: https:;
        script-src 'self' https://www.gstatic.com 'unsafe-inline';
    ";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 2. API Supabase (Kong gateway)
server {
    server_name api.promote-connect.pro;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}

# 3. Automatisation n8n
server {
    server_name n8n.promote-connect.pro;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

Activez la configuration et générez les certificats SSL :
```bash
sudo ln -s /etc/nginx/sites-available/promote-connect /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Génération des certificats Let's Encrypt
sudo certbot --nginx -d promote-connect.pro -d api.promote-connect.pro -d n8n.promote-connect.pro
```

---

## 8. Checklist Post-Déploiement

- [ ] L'application charge correctement sur `https://promote-connect.pro` sans erreurs CSP.
- [ ] L'API Supabase est accessible sur `https://api.promote-connect.pro` (ex: `/rest/v1/`).
- [ ] La connexion avec le compte admin fonctionne (créé via le script de seed).
- [ ] La base de données ne contient aucune donnée de test (vérifiable dans l'interface admin > Utilisateurs et Exposants).
- [ ] Les buckets Storage permettent l'upload (testable en uploadant un avatar ou un logo d'exposant).
- [ ] Le webhook Stripe est configuré pour pointer sur `https://promote-connect.pro/api/webhooks/stripe`.
- [ ] n8n tourne sur `https://n8n.promote-connect.pro` et les workflows (newsletter, etc.) sont actifs.
- [ ] Le déploiement automatique s'exécute avec succès lors d'un push sur `main`.
- [ ] Les notifications push FCM fonctionnent : le token est enregistré dans `profiles.fcm_token` et les webhooks FCM répondent 200.
- [ ] Vérifier que `firebase-messaging-sw.js` est servi correctement (accessible sur `https://promote-connect.pro/firebase-messaging-sw.js`).

---

## 9. Configuration FCM (Firebase Cloud Messaging)

Les notifications push reposent sur Firebase Cloud Messaging. Voici les fichiers impliqués et leur rôle :

### 9.1. Variables d'environnement requises
Voir la section 3.2. Les variables `NEXT_PUBLIC_FIREBASE_*` et `FCM_SERVER_KEY` doivent être renseignées.

### 9.2. Client Firebase SDK (Navigateur)
Le token FCM est récupéré côté client via `lib/firebase-client.ts` et stocké dans `profiles.fcm_token` (colonne ajoutée par la migration `044_add_fcm_token.sql`).

### 9.3. Service Worker (`public/firebase-messaging-sw.js`)
Ce fichier est chargé automatiquement par Firebase SDK pour gérer les messages push en arrière-plan. Il utilise l'API Firebase compat (`firebase-app-compat.js` et `firebase-messaging-compat.js`) chargée depuis le CDN `www.gstatic.com`.

### 9.4. Envoi des notifications (Serveur)
Deux mécanismes :

| Mécanisme | Emplacement | Usage |
|-----------|------------|-------|
| API Route Next.js | `app/api/webhooks/fcm/route.ts` | Envoi direct via l'API HTTP Legacy FCM (`POST https://fcm.googleapis.com/fcm/send`) |
| Edge Function Supabase | `supabase/functions/send-push-notification/` | Envoi depuis une Edge Function Deno |

L'API Legacy FCM est utilisée avec le header `Authorization: key=<FCM_SERVER_KEY>`.

### 9.5. Points d'attention
- **CSP** : Les URLs `https://fcm.googleapis.com` et `https://www.gstatic.com` doivent être autorisées dans `connect-src` et `script-src` (voir section 7).
- **Permissions navigateur** : L'utilisateur doit accepter la demande de notification (déclenchée dans `PwaRegister.tsx`).
- **FCM Legacy vs HTTP v1** : Le projet utilise l'API Legacy. Google recommande de migrer vers HTTP v1 API avec OAuth2. Cette migration est planifiée en Phase 3.
- **Firebase App Check** : Peut être activé sur Firebase Console pour renforcer la sécurité côté client.
