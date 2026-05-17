# Promote-Connect

Prototype Next.js + Supabase pour la plateforme PROMOTE-CONNECT.

## Structure initiale

- `app/`: App Router Next.js
- `components/`: composants réutilisables
- `lib/`: clients Supabase, utilitaires
- `supabase/`: migrations et fonctions Edge
- `types/`: types globaux

## Commandes

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run type-check`
- `npm run check:prod-env`

## Production

Voir [docs/production-deployment.md](docs/production-deployment.md) pour la checklist et la procedure de deploiement.

## Objectif

Lancer la base d'une application conforme au cahier des charges fonctionnel PROMOTE-CONNECT : annuaire, chat, agenda, vitrine, newsletter, support, accès 12 mois.
