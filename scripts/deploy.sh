#!/bin/bash
# ==============================================================================
# Script de Déploiement Automatisé — PROMOTE-CONNECT
# ==============================================================================
# Utilisation: ./scripts/deploy.sh
# Pré-requis: git, npm, pm2 configurés sur l'environnement de production.

# Arrêter l'exécution si une commande échoue
set -e

# Définition des couleurs pour l'output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

APP_NAME="promote-connect"
BRANCH="main"

echo -e "${BLUE}=== Début du déploiement de $APP_NAME ===${NC}"

# 1. Mise à jour du code
echo -e "\n${YELLOW}[1/5] Récupération des dernières modifications depuis Git...${NC}"
git fetch origin $BRANCH
git reset --hard origin/$BRANCH

# 2. Installation des dépendances
echo -e "\n${YELLOW}[2/5] Installation des dépendances (Clean Install)...${NC}"
npm ci --legacy-peer-deps

# 3. Optimisation des images (Optionnel mais recommandé si de nouvelles images ont été ajoutées)
echo -e "\n${YELLOW}[3/5] Optimisation des assets (génération WebP)...${NC}"
if [ -f "scripts/optimize-images.mjs" ]; then
    node scripts/optimize-images.mjs
fi

# 4. Construction de l'application Next.js
echo -e "\n${YELLOW}[4/5] Build de l'application Next.js...${NC}"
npm run build

# 5. Redémarrage de l'application avec PM2 (Zéro Downtime)
echo -e "\n${YELLOW}[5/5] Redémarrage via PM2 avec ecosystem.config.js...${NC}"
if pm2 show $APP_NAME > /dev/null; then
    echo "L'application tourne déjà, rechargement (Zero Downtime en Cluster)..."
    pm2 reload ecosystem.config.js --update-env
else
    echo "L'application n'est pas encore gérée par PM2, premier lancement..."
    pm2 start ecosystem.config.js
    pm2 save
fi

echo -e "\n${GREEN}=== Déploiement terminé avec succès ! ===${NC}"
echo -e "Pour consulter les logs, utilisez la commande : pm2 logs $APP_NAME"
exit 0
