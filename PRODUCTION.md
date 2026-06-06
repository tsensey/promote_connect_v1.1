# Guide de Mise en Production — PROMOTE-CONNECT

Ce document décrit les étapes nécessaires pour déployer l'application **PROMOTE-CONNECT** sur un serveur VPS (ex: OVH) pour un environnement de production fiable et performant.

---

## 1. Prérequis Système

Le serveur de production (VPS) doit disposer au minimum de :
- **OS** : Ubuntu 22.04 LTS (ou Debian 12)
- **RAM** : 4 Go minimum (8 Go recommandés avec Supabase local)
- **CPU** : 2 vCores minimum
- **Espace Disque** : 40 Go (SSD/NVMe)
- **Logiciels requis** :
  - Node.js 22.x LTS
  - npm / yarn
  - Docker & Docker Compose (pour Supabase / n8n / Redis)
  - Nginx (Reverse Proxy)
  - PM2 (Process Manager pour l'application Next.js si non-Dockerisée)
  - Git

---

## 2. Préparation de l'Environnement

### 2.1. Variables d'Environnement
Assurez-vous de créer un fichier `.env.local` sécurisé à la racine du projet sur le serveur.
Copiez le contenu de `.env.example` et remplissez toutes les valeurs de production (Clés Stripe Live, clés Resend Live, clés Supabase de production, etc.).

> [!WARNING]
> Ne jamais commiter le fichier `.env.local`. Sécurisez ses droits (`chmod 600 .env.local`).

### 2.2. Configuration Supabase (Self-hosted)
Si Supabase tourne sur le même serveur :
1. Cloner le repo officiel de Supabase Docker.
2. Configurer le `.env` de Supabase avec des mots de passe robustes (notamment `POSTGRES_PASSWORD` et `JWT_SECRET`).
3. Démarrer les services avec `docker compose up -d`.
4. Appliquer les migrations de Promote-Connect :
   ```bash
   npx supabase db push --db-url postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/postgres
   ```

---

## 3. Déploiement de l'Application Next.js

Il existe deux méthodes principales. Nous recommandons **PM2** pour une gestion simplifiée ou **Docker** pour la standardisation.

### Méthode A : PM2 (Process Manager) - Recommandée
Idéal pour gérer l'application Next.js directement sur l'hôte, avec redémarrage automatique et mode Cluster (Load Balancing multi-cœurs).

1. Installation de PM2 :
   ```bash
   npm install -g pm2
   ```
2. Build de l'application :
   ```bash
   npm ci
   npm run build
   ```
3. Lancement (via le fichier de configuration PM2 inclus) :
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```
   > Le fichier `ecosystem.config.js` gère nativement le mode Cluster (2 instances), la limite mémoire (1Go/instance), et les logs.

### Méthode B : Docker (Voir SCALING.md pour le Dockerfile)
Idéal si vous prévoyez de scaler horizontalement.

```bash
docker build -t promote-connect:latest .
docker run -d -p 3000:3000 --name promote-connect --env-file .env.local --restart unless-stopped promote-connect:latest
```

---

## 4. Configuration Nginx (Reverse Proxy & SSL)

Nginx redirigera le port 80/443 vers le port 3000 (Next.js) et s'occupera du SSL via Let's Encrypt (Certbot).

### Fichier `/etc/nginx/sites-available/promote-connect` :
```nginx
server {
    server_name promote-connect.com www.promote-connect.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Pour les WebSockets (Supabase Realtime si proxyfié)
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Activation et SSL :
```bash
sudo ln -s /etc/nginx/sites-available/promote-connect /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Installer Certbot et obtenir le certificat SSL automatique
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d promote-connect.com -d www.promote-connect.com
```

---

## 5. Automatisation avec Script de Déploiement

Un script automatisé `scripts/deploy.sh` est fourni dans le dépôt. Il permet de mettre à jour le code, reconstruire l'app et relancer PM2 sans interruption ("Zero Downtime").

**Utilisation** :
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```
*Voir le contenu du fichier pour l'intégration avec les Webhooks (ex: via un runner GitHub Actions self-hosted).*

---

## 6. Monitoring & Maintenance

> [!TIP]
> **Surveillance des Logs** :
> Utilisez `pm2 logs promote-connect` pour voir les logs en direct. Pour les logs système complets, installez **Sentry** (déjà configuré dans le code, nécessite d'ajouter le DSN en `.env.local`).

- **Sauvegardes (Backups)** : Pensez à planifier un `pg_dump` quotidien de la base Supabase via un cronjob vers un stockage externe (AWS S3 ou un autre VPS).
- **Nettoyage** : La commande `npm run db:cleanup-orphans` peut être exécutée périodiquement (via cron) pour nettoyer les données obsolètes ou orphelines.

---

## 7. Montée en Charge (Scaling)

Si le trafic augmente fortement pendant les jours du salon, veuillez vous référer au fichier [SCALING.md](./SCALING.md) situé à la racine du projet, qui détaille les stratégies avancées (Cloudflare, Redis, pgBouncer, Horizontal Scaling).
