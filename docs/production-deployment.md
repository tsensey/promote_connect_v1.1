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

### 2.1. Installation de Supabase
1. Clonez le dépôt officiel de Supabase sur le VPS :
   ```bash
   git clone --depth 1 https://github.com/supabase/supabase
   cd supabase/docker
   cp .env.example .env
   ```
2. Modifiez le `.env` pour sécuriser les accès :
   - `POSTGRES_PASSWORD` : mot de passe très fort
   - `JWT_SECRET` : générez un JWT secret fort
   - `ANON_KEY` et `SERVICE_ROLE_KEY` : générez-les à partir du JWT secret
   - `SITE_URL` : `https://promote-connect.pro`
   - `API_EXTERNAL_URL` : `https://api.promote-connect.pro`

3. Démarrez les conteneurs :
   ```bash
   docker-compose up -d
   ```

### 2.2. Configuration et Migration de la Base
1. Sur votre **machine locale** (où le projet PROMOTE-CONNECT est cloné), connectez-vous à la base distante pour y pousser la structure :
   ```bash
   # Remplacez les valeurs par celles de votre VPS
   export SUPABASE_DB_URL="postgresql://postgres:<POSTGRES_PASSWORD>@187.124.0.110:5432/postgres"
   
   # Appliquer les migrations (crée les tables, RLS, Storage)
   supabase db push --db-url $SUPABASE_DB_URL
   ```

2. Assurez-vous que les buckets Storage nécessaires sont bien créés (`feed-images`, `vitrine-images`, `chat_media`, `avatars`).

### 2.3. Edge Functions
Le self-hosting des Edge Functions nécessite un serveur Deno. Supabase Docker inclut le service `edge-runtime`.
Déployez les fonctions depuis votre machine locale vers le serveur auto-hébergé :
```bash
supabase functions deploy --project-ref <LOCAL_OR_REMOTE_REF>
```
*Note: Alternativement, les fonctions (newsletter, push, rdv) peuvent être adaptées dans des API routes Next.js sécurisées ou des workflows n8n pour simplifier l'architecture en self-hosting.*

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

# Stripe, Resend, FCM (production keys)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=newsletter@promote-connect.pro
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
1. Créez un répertoire pour n8n (`/opt/n8n`).
2. Créez un `docker-compose.yml` standard pour l'image `n8nio/n8n`.
3. Lancez le service : `docker-compose up -d`. Le service sera accessible sur le port `5678`.
4. Connectez-vous à l'interface, importez les workflows PROMOTE-CONNECT (fichier JSON de vos workflows).
5. Configurez les credentials dans n8n (Supabase API Key/URL, Resend API Key).

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
