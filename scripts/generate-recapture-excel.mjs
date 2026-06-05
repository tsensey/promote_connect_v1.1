import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';

const headerBg = '1B1464';
const headerFg = 'FFFFFF';
const moduleBg = '520a3f';
const moduleFg = 'FFFFFF';
const altRow = 'F5F0F5';
const white = 'FFFFFF';

function style(cfg) {
  return {
    font: {
      name: 'Calibri',
      size: cfg.size || 10,
      bold: !!cfg.bold,
      italic: !!cfg.italic,
      color: { rgb: cfg.color || '333333' },
    },
    fill: cfg.fill ? { fgColor: { rgb: cfg.fill } } : undefined,
    alignment: {
      horizontal: cfg.align || 'left',
      vertical: 'center',
      wrapText: cfg.wrap ?? true,
    },
    border: {
      top: { style: 'thin', color: { rgb: 'C0B8C0' } },
      bottom: { style: 'thin', color: { rgb: 'C0B8C0' } },
      left: { style: 'thin', color: { rgb: 'C0B8C0' } },
      right: { style: 'thin', color: { rgb: 'C0B8C0' } },
    },
  };
}

function hdr(label, w) {
  return { v: label, t: 's', s: style({ bold: true, color: headerFg, fill: headerBg, size: 11, align: 'center' }) };
}

function cell(v, opts = {}) {
  return { v: String(v ?? ''), t: 's', s: style({ fill: opts.fill, size: opts.size || 10, align: opts.align, bold: opts.bold, italic: opts.italic, wrap: opts.wrap ?? true }) };
}

function moduleRow(label, cols) {
  const row = [];
  for (let c = 0; c < cols; c++) {
    row.push(c === 0 ? cell(label, { fill: moduleBg, color: moduleFg, bold: true, size: 11 }) : cell('', { fill: moduleBg }));
  }
  return row;
}

// ─── TEST CASES ────────────────────────────────────────────────
// [Module, N°, Feature, Test Case, Steps, Expected Result, Criticité]

const tests = [
  // === AUTH ===
  ['Auth', 'AUTH-01', 'Inscription', "Créer un compte visiteur", "1. Aller sur /register\n2. Remplir nom, email, mot de passe\n3. Sélectionner rôle 'Visiteur'\n4. Cliquer sur S'inscrire", "Compte créé, redirigé vers /app, email de bienvenue reçu", 'Haute'],
  ['Auth', 'AUTH-02', 'Inscription exposant', "Créer un compte exposant", "1. Aller sur /register\n2. Remplir nom, email, mot de passe\n3. Sélectionner rôle 'Exposant'\n4. Remplir info société\n5. Cliquer sur S'inscrire", "Compte exposant créé, redirigé vers le dashboard", 'Haute'],
  ['Auth', 'AUTH-03', 'Connexion', "Se connecter avec email/mot de passe", "1. Aller sur /login\n2. Saisir email + mot de passe valides\n3. Cliquer sur Se connecter", "Connecté, redirigé vers /app", 'Haute'],
  ['Auth', 'AUTH-04', 'Connexion invalide', "Tenter connexion avec mauvais mot de passe", "1. Aller sur /login\n2. Saisir email valide + mauvais mot de passe\n3. Cliquer sur Se connecter", "Message d'erreur 'Email ou mot de passe incorrect'", 'Haute'],
  ['Auth', 'AUTH-05', 'Déconnexion', "Se déconnecter", "1. Être connecté\n2. Cliquer sur le menu profil\n3. Cliquer sur Déconnexion", "Déconnecté, redirigé vers /login", 'Haute'],
  ['Auth', 'AUTH-06', 'Mot de passe oublié', "Demander réinitialisation mot de passe", "1. Aller sur /login\n2. Cliquer 'Mot de passe oublié'\n3. Saisir email\n4. Cliquer sur Envoyer", "Email de réinit reçu avec lien valide", 'Haute'],
  ['Auth', 'AUTH-07', 'Protection routes', "Tenter d'accéder au dashboard sans auth", "1. Se déconnecter\n2. Naviguer vers /feed\n3. Naviguer vers /chat", "Redirigé vers /login", 'Haute'],

  // === MODULE A — ANNUAIRE ===
  ['A — Annuaire', 'ANNU-01', 'Liste exposants', "Afficher l'annuaire complet", "1. Aller sur /annuaire\n2. Observer la liste des exposants", "Liste paginée avec photo, nom, secteur, pays, pavillon. Chargement < 2s", 'Haute'],
  ['A — Annuaire', 'ANNU-02', 'Filtre secteur', "Filtrer par secteur d'activité", "1. Aller sur /annuaire\n2. Sélectionner un secteur dans le filtre", "Liste filtrée, seuls les exposants du secteur apparaissent", 'Haute'],
  ['A — Annuaire', 'ANNU-03', 'Filtre pays', "Filtrer par pays", "1. Aller sur /annuaire\n2. Sélectionner un pays", "Liste filtrée par pays", 'Haute'],
  ['A — Annuaire', 'ANNU-04', 'Filtre pavillon', "Filtrer par pavillon/stand", "1. Aller sur /annuaire\n2. Sélectionner un pavillon", "Liste filtrée par pavillon", 'Moyenne'],
  ['A — Annuaire', 'ANNU-05', 'Recherche texte', "Rechercher un exposant par nom", "1. Aller sur /annuaire\n2. Saisir un nom dans la barre recherche", "Résultats affichés en temps réel", 'Haute'],
  ['A — Annuaire', 'ANNU-06', 'Fiche exposant', "Ouvrir la fiche détaillée", "1. Aller sur /annuaire\n2. Cliquer sur un exposant", "Fiche détaillée avec description, produits, coordonnées, bouton contacter", 'Haute'],
  ['A — Annuaire', 'ANNU-07', 'Bouton contacter', "Contacter un exposant depuis la fiche", "1. Ouvrir fiche exposant\n2. Cliquer sur Contacter", "Nouvelle conversation chat créée, redirigé vers /chat", 'Haute'],
  ['A — Annuaire', 'ANNU-08', 'Pagination', "Tester la pagination", "1. Aller sur /annuaire\n2. Cliquer sur page suivante", "Page suivante chargée, compteur mis à jour", 'Moyenne'],
  ['A — Annuaire', 'ANNU-09', 'Exposant à la une', "Vérifier le marquage 'À la une'", "1. Aller sur /annuaire\n2. Identifier les exposants featured", "Les exposants 'À la une' sont mis en évidence (badge, position)", 'Basse'],

  // === MODULE B — CHAT ===
  ['B — Chat', 'CHAT-01', 'Liste conversations', "Afficher la liste des conversations", "1. Aller sur /chat\n2. Observer la liste", "Liste des conversations triée par dernier message, avec expéditeur, extrait, date", 'Haute'],
  ['B — Chat', 'CHAT-02', 'Nouveau message', "Démarrer une nouvelle conversation", "1. Cliquer sur Nouveau message\n2. Rechercher un utilisateur\n3. Saisir un message\n4. Envoyer", "Conversation créée, message envoyé", 'Haute'],
  ['B — Chat', 'CHAT-03', 'Envoi message texte', "Envoyer un message texte", "1. Ouvrir une conversation\n2. Saisir du texte\n3. Appuyer sur Envoyer", "Message apparaît dans la conversation en temps réel", 'Haute'],
  ['B — Chat', 'CHAT-04', 'Temps réel', "Vérifier la réception temps réel", "1. Ouvrir la même conversation sur 2 navigateurs\n2. Envoyer un message depuis le navigateur A", "Le message apparaît instantanément sur le navigateur B", 'Haute'],
  ['B — Chat', 'CHAT-05', 'Indicateur lecture', "Vérifier les indicateurs de lecture", "1. Envoyer un message\n2. Le destinataire ouvre la conversation", "Check visuel 'lu' apparaît sur le message", 'Moyenne'],
  ['B — Chat', 'CHAT-06', 'Partage fichier', "Partager un fichier dans le chat", "1. Ouvrir une conversation\n2. Cliquer sur icône pièce jointe\n3. Sélectionner un fichier\n4. Envoyer", "Fichier uploadé et affiché dans le chat (prévisualisation si image)", 'Moyenne'],
  ['B — Chat', 'CHAT-07', 'Quota messages', "Vérifier le quota pour free trial", "1. Être en free trial\n2. Envoyer des messages jusqu'à la limite", "Message d'avertissement de quota atteint, proposition upgrade", 'Haute'],
  ['B — Chat', 'CHAT-08', 'Blocage utilisateur', "Bloquer un utilisateur du chat", "1. Ouvrir une conversation\n2. Aller dans les options\n3. Cliquer sur Bloquer", "Conversation fermée, plus de messages possibles", 'Moyenne'],

  // === MODULE C — AGENDA ===
  ['C — Agenda', 'AGEN-01', 'Vue programme', "Afficher le programme du salon", "1. Aller sur /agenda\n2. Observer la liste des événements", "Liste/calendrier des événements avec titre, date, lieu, type", 'Haute'],
  ['C — Agenda', 'AGEN-02', 'Filtre par jour', "Filtrer les événements par jour", "1. Aller sur /agenda\n2. Sélectionner un jour", "Événements du jour affichés", 'Moyenne'],
  ['C — Agenda', 'AGEN-03', 'Filtre par type', "Filtrer par type (conférence, atelier, networking)", "1. Aller sur /agenda\n2. Sélectionner un type", "Événements filtrés par type", 'Moyenne'],
  ['C — Agenda', 'AGEN-04', 'Détail événement', "Ouvrir le détail d'un événement", "1. Cliquer sur un événement", "Détail complet : description, intervenants, salle, horaires", 'Haute'],
  ['C — Agenda', 'AGEN-05', 'Créditer RDV', "Créer un rendez-vous B2B", "1. Aller sur /agenda\n2. Cliquer sur Nouveau RDV\n3. Sélectionner participant, date, créneau\n4. Confirmer", "RDV créé avec statut 'pending', notification envoyée", 'Haute'],
  ['C — Agenda', 'AGEN-06', 'Confirmer RDV', "Confirmer un RDV reçu", "1. Recevoir une demande de RDV\n2. Ouvrir la notification\n3. Cliquer sur Confirmer", "RDV passe en statut 'confirmed', notification à l'envoyeur", 'Haute'],
  ['C — Agenda', 'AGEN-07', 'Annuler RDV', "Annuler un RDV", "1. Ouvrir un RDV existant\n2. Cliquer sur Annuler", "RDV passe en 'cancelled', notification à l'autre participant", 'Haute'],
  ['C — Agenda', 'AGEN-08', 'Rappel RDV', "Vérifier les rappels automatiques", "1. Avoir un RDV confirmé\n2. Attendre l'heure du rappel", "Notification push reçue avant le RDV", 'Moyenne'],

  // === MODULE D — VITRINE ===
  ['D — Vitrine', 'VITR-01', 'Vitrine publique', "Consulter la vitrine d'un exposant", "1. Aller sur /vitrine\n2. Sélectionner un exposant", "Vitrine affichée : logo, description, produits, coordonnées", 'Haute'],
  ['D — Vitrine', 'VITR-02', 'Liste produits', "Afficher les produits d'un exposant", "1. Ouvrir une vitrine\n2. Scroller jusqu'aux produits", "Produits listés avec image, nom, description, prix indicatif", 'Moyenne'],
  ['D — Vitrine', 'VITR-03', 'Ajouter produit (exposant)', "Ajouter un produit à sa vitrine", "1. Aller sur /exposant/ma-vitrine\n2. Cliquer sur Ajouter un produit\n3. Remplir formulaire\n4. Sauvegarder", "Produit ajouté à la vitrine", 'Haute'],
  ['D — Vitrine', 'VITR-04', 'Modifier produit', "Modifier un produit existant", "1. Aller sur /exposant/ma-vitrine\n2. Cliquer sur un produit\n3. Modifier les champs\n4. Sauvegarder", "Produit mis à jour", 'Moyenne'],
  ['D — Vitrine', 'VITR-05', 'Supprimer produit', "Supprimer un produit", "1. Aller sur /exposant/ma-vitrine\n2. Cliquer sur supprimer un produit\n3. Confirmer", "Produit supprimé de la vitrine", 'Moyenne'],
  ['D — Vitrine', 'VITR-06', 'Stats vitrine', "Voir les statistiques de la vitrine", "1. Aller sur /exposant/ma-vitrine\n2. Voir les stats en haut", "Vues, clics, contacts générés affichés", 'Basse'],

  // === MODULE E — NEWSLETTER ===
  ['E — Newsletter', 'NEWS-01', 'Page newsletter', "Afficher la page newsletter", "1. Aller sur /newsletter\n2. Observer le contenu", "Liste des newsletters reçues avec date et objet", 'Moyenne'],
  ['E — Newsletter', 'NEWS-02', 'Abonnement', "S'abonner à la newsletter", "1. Aller sur /newsletter\n2. Cliquer sur S'abonner\n3. Confirmer", "Abonné aux newsletters", 'Moyenne'],
  ['E — Newsletter', 'NEWS-03', 'Désabonnement', "Se désabonner", "1. Aller sur /newsletter\n2. Cliquer sur Se désabonner\n3. Confirmer", "Désabonné, confirmation affichée", 'Moyenne'],
  ['E — Newsletter', 'NEWS-04', 'Lien désabonnement email', "Se désabonner via lien dans email", "1. Ouvrir un email newsletter\n2. Cliquer sur lien désabonnement", "Page de confirmation de désabonnement", 'Haute'],
  ['E — Newsletter', 'NEWS-05', 'Filtre par secteur', "Filtrer les newsletters par secteur", "(Fonctionnalité avancée — si implémentée)", "Newsletters filtrées", 'Basse'],

  // === MODULE F — SUPPORT ===
  ['F — Support', 'SUPP-01', 'Page support', "Afficher le centre d'aide", "1. Aller sur /support\n2. Observer la page", "FAQ + bouton Créer un ticket + liste tickets existants", 'Moyenne'],
  ['F — Support', 'SUPP-02', 'Créer ticket', "Ouvrir un ticket de support", "1. Aller sur /support\n2. Cliquer sur Créer un ticket\n3. Sélectionner catégorie\n4. Saisir sujet + description\n5. Envoyer", "Ticket créé, numéro de ticket affiché, confirmation email", 'Haute'],
  ['F — Support', 'SUPP-03', 'Suivi ticket', "Voir l'évolution d'un ticket", "1. Ouvrir un ticket existant\n2. Voir le fil de discussion", "Messages du support affichés, statut du ticket visible", 'Haute'],
  ['F — Support', 'SUPP-04', 'Répondre ticket', "Ajouter un message à un ticket", "1. Ouvrir un ticket\n2. Saisir un message\n3. Envoyer", "Message ajouté au fil du ticket, notification envoyée au support", 'Moyenne'],
  ['F — Support', 'SUPP-05', 'Fermeture ticket', "Fermer un ticket résolu", "1. Ouvrir un ticket résolu\n2. Cliquer sur Fermer", "Ticket fermé, statut mis à jour", 'Moyenne'],

  // === MODULE G — ABONNEMENT ===
  ['G — Abonnement', 'ABO-01', 'Page abonnement', "Afficher la page d'abonnement", "1. Aller sur /abonnement\n2. Observer les offres", "Offres affichées : Free Trial et Payant avec prix et avantages", 'Haute'],
  ['G — Abonnement', 'ABO-02', 'Souscrire abonnement', "Souscrire à l'offre payante", "1. Aller sur /abonnement\n2. Cliquer sur Souscrire\n3. Remplir infos paiement Stripe\n4. Valider", "Abonnement activé, accès aux fonctionnalités premium", 'Haute'],
  ['G — Abonnement', 'ABO-03', 'Statut abonnement', "Vérifier le statut après paiement", "1. Revenir sur /abonnement après paiement\n2. Voir le statut", "Statut 'Actif' avec date de fin affichée", 'Haute'],
  ['G — Abonnement', 'ABO-04', 'Restriction free trial', "Vérifier les restrictions free trial", "1. Être en free trial\n2. Tenter d'accéder à une fonctionnalité payante", "Message d'accès restreint avec proposition d'upgrade", 'Haute'],
  ['G — Abonnement', 'ABO-05', 'Résilier', "Résilier l'abonnement", "1. Aller sur /abonnement\n2. Cliquer sur Résilier\n3. Confirmer", "Abonnement résilié, accès maintenu jusqu'à fin de période", 'Moyenne'],

  // === FEED / FIL ===
  ['Feed', 'FEED-01', 'Fil actualités', "Afficher le fil d'actualités", "1. Aller sur /feed\n2. Observer les posts", "Posts chronologiques avec auteur, contenu, média, date", 'Haute'],
  ['Feed', 'FEED-02', 'Créer post', "Publier un message", "1. Aller sur /feed\n2. Cliquer sur Créer\n3. Saisir texte\n4. Publier", "Post publié dans le feed", 'Haute'],
  ['Feed', 'FEED-03', 'Ajouter image', "Publier avec une image", "1. Créer un post\n2. Ajouter une image\n3. Publier", "Image uploadée et affichée dans le post", 'Moyenne'],
  ['Feed', 'FEED-04', 'Commenter', "Commenter un post", "1. Ouvrir un post\n2. Saisir un commentaire\n3. Envoyer", "Commentaire ajouté, notification à l'auteur", 'Moyenne'],
  ['Feed', 'FEED-05', 'Réagir', "Réagir à un post (like)", "1. Cliquer sur l'icône like d'un post\n2. Observer", "Compteur de réactions incrémenté, notification à l'auteur", 'Moyenne'],
  ['Feed', 'FEED-06', 'Partager', "Partager un post", "1. Ouvrir un post\n2. Cliquer sur Partager\n3. Confirmer", "Post partagé dans le fil", 'Basse'],

  // === RECHERCHE ===
  ['Recherche', 'RECH-01', 'Recherche globale', "Utiliser la recherche", "1. Cliquer sur la barre de recherche (ou Cmd+K)\n2. Saisir un mot-clé", "Résultats : exposants, produits, utilisateurs, posts", 'Haute'],
  ['Recherche', 'RECH-02', 'Raccourci clavier', "Ouvrir la recherche via Cmd+K", "1. Appuyer sur Cmd+K (ou Ctrl+K)\n2. Saisir un mot-clé", "Palette de recherche ouverte", 'Moyenne'],
  ['Recherche', 'RECH-03', 'Recherche vide', "Recherche sans résultats", "1. Saisir un mot-clé inexistant\n2. Observer", "Message 'Aucun résultat trouvé'", 'Basse'],

  // === ADMIN ===
  ['Admin', 'ADM-01', 'Dashboard admin', "Accéder au dashboard admin", "1. Se connecter avec un compte admin\n2. Aller sur /admin", "Dashboard admin avec statistiques et accès à tous les modules", 'Haute'],
  ['Admin', 'ADM-02', 'Gestion exposants', "Lister et modifier les exposants", "1. Aller sur /admin/exposants\n2. Cliquer sur un exposant\n3. Modifier les champs\n4. Sauvegarder", "Exposant modifié", 'Haute'],
  ['Admin', 'ADM-03', 'Créer compte exposant', "Créer un compte exposant depuis l'admin", "1. Aller sur /admin/exposants\n2. Cliquer sur Créer\n3. Remplir formulaire\n4. Valider", "Compte exposant créé, email de credentials envoyé", 'Haute'],
  ['Admin', 'ADM-04', 'Gestion espaces', "Gérer les pavillons/espaces", "1. Aller sur /admin/espaces\n2. Ajouter/modifier/supprimer un espace", "Espace mis à jour", 'Haute'],
  ['Admin', 'ADM-05', 'Gestion abonnements', "Voir les abonnements Stripe", "1. Aller sur /admin/abonnements\n2. Consulter la liste", "Liste des abonnés avec statut, date, montant", 'Haute'],
  ['Admin', 'ADM-06', 'Tickets support', "Gérer les tickets support", "1. Aller sur /admin/tickets\n2. Ouvrir un ticket\n3. Répondre\n4. Changer statut", "Ticket traité, notification envoyée à l'utilisateur", 'Haute'],
  ['Admin', 'ADM-07', 'Signalements', "Modérer les signalements", "1. Aller sur /admin/signalements\n2. Ouvrir un signalement\n3. Décider de l'action", "Action appliquée (avertissement, suspension, rien)", 'Haute'],
  ['Admin', 'ADM-08', 'Gestion utilisateurs', "Gérer les utilisateurs", "1. Aller sur /admin/users\n2. Rechercher un utilisateur\n3. Modifier/suspendre/supprimer", "Action effectuée", 'Haute'],
  ['Admin', 'ADM-09', 'Configuration', "Modifier la configuration plateforme", "1. Aller sur /admin/configuration\n2. Modifier un paramètre\n3. Sauvegarder", "Configuration mise à jour", 'Moyenne'],
  ['Admin', 'ADM-10', "Logs d'audit", "Consulter les logs", "1. Aller sur /admin/logs\n2. Filtrer par action/date/utilisateur", "Logs d'activité affichés avec pagination", 'Moyenne'],
  ['Admin', 'ADM-11', 'Admin newsletter', "Envoyer une newsletter", "1. Aller sur /admin/newsletter\n2. Rédiger le contenu\n3. Sélectionner les destinataires\n4. Envoyer", "Newsletter envoyée aux abonnés sélectionnés", 'Haute'],
  ['Admin', 'ADM-12', 'Programme salon', "Modifier le programme", "1. Aller sur /admin/programme\n2. Ajouter/modifier/supprimer un événement", "Programme mis à jour", 'Haute'],

  // === PWA / MOBILE ===
  ['PWA', 'PWA-01', 'Installation PWA', "Installer l'application PWA", "1. Ouvrir le site sur Chrome mobile\n2. Cliquer sur Installer (bannière ou menu)", "Application installée sur l'écran d'accueil", 'Haute'],
  ['PWA', 'PWA-02', 'Mode hors-ligne', "Tester le mode hors-ligne", "1. Installer la PWA\n2. Couper la connexion\n3. Ouvrir l'app", "Page hors-ligne affichée (/offline) avec message", 'Haute'],
  ['PWA', 'PWA-03', 'Service Worker', 'Vérifier le Service Worker', "1. Ouvrir les dev tools > Application > Service Workers\n2. Vérifier le statut", "Service Worker actif et enregistré", 'Moyenne'],
  ['PWA', 'PWA-04', 'Notifications push', "Tester les notifications push (FCM)", "1. Accepter les notifications\n2. Déclencher une notification (nouveau message, RDV)", "Notification push reçue sur l'appareil", 'Haute'],
  ['PWA', 'PWA-05', 'Manifest', "Vérifier le manifest PWA", "1. Ouvrir les dev tools > Application > Manifest\n2. Vérifier les icônes et configuration", "Manifest valide avec toutes les tailles d'icônes", 'Basse'],

  // === DARK MODE / I18N ===
  ['UX', 'UX-01', 'Dark mode', "Basculer en mode sombre", "1. Cliquer sur l'icône theme (soleil/lune)\n2. Observer toutes les pages", "Toutes les pages s'affichent correctement en dark mode", 'Haute'],
  ['UX', 'UX-02', 'Switch FR/EN', "Changer de langue", "1. Cliquer sur le sélecteur de langue\n2. Changer FR → EN", "Toute l'interface passe en anglais", 'Haute'],
  ['UX', 'UX-03', 'Responsive mobile', "Tester le responsive (mobile < 768px)", "1. Ouvrir le site sur mobile (ou mode responsive devtools)\n2. Naviguer dans tous les modules", "Layout adapté, sidebar cachée, bottom nav visible, tout est utilisable", 'Haute'],
  ['UX', 'UX-04', 'Responsive tablette', "Tester le responsive (tablette 768-1024px)", "1. Ouvrir le site en mode tablette (devtools)\n2. Naviguer", "Layout adapté, navigation fonctionnelle", 'Moyenne'],
  ['UX', 'UX-05', 'Images chargement', "Vérifier le lazy loading des images", "1. Ouvrir /annuaire ou /feed\n2. Scroller rapidement", "Images chargées progressivement (blur-up ou skeleton)", 'Basse'],

  // === PARAMÈTRES / PROFIL ===
  ['Profil', 'PROF-01', 'Paramètres profil', "Modifier son profil", "1. Aller sur /parametres\n2. Modifier nom, email, secteur\n3. Sauvegarder", "Profil mis à jour", 'Haute'],
  ['Profil', 'PROF-02', 'Avatar', "Changer sa photo de profil", "1. Aller sur /parametres\n2. Cliquer sur l'avatar\n3. Uploader une image\n4. Sauvegarder", "Avatar mis à jour", 'Moyenne'],
  ['Profil', 'PROF-03', 'Préférences notifications', "Configurer les notifications", "1. Aller sur /parametres\n2. Modifier les préférences de notification\n3. Sauvegarder", "Préférences appliquées", 'Moyenne'],
  ['Profil', 'PROF-04', 'Changer mot de passe', "Modifier son mot de passe", "1. Aller sur /parametres\n2. Ancien mdp + nouveau mdp\n3. Sauvegarder", "Mot de passe changé, reconnexion requise", 'Haute'],

  // === NOTIFICATIONS ===
  ['Notifications', 'NOTIF-01', 'Dropdown notifications', "Ouvrir le centre de notifications", "1. Cliquer sur l'icône cloche dans le topbar\n2. Observer la liste", "Liste des notifications récentes avec type (message, RDV, like, commentaire)", 'Haute'],
  ['Notifications', 'NOTIF-02', 'Marquer comme lu', "Marquer une notification comme lue", "1. Ouvrir les notifications\n2. Cliquer sur une notification", "Notification marquée comme lue, compteur décrémenté", 'Moyenne'],
  ['Notifications', 'NOTIF-03', 'Notification message', "Recevoir notification pour nouveau message", "1. Faire envoyer un message par un autre utilisateur\n2. Observer", "Notification 'Nouveau message de X' reçue", 'Haute'],
  ['Notifications', 'NOTIF-04', 'Notification RDV', "Recevoir notification pour demande RDV", "1. Faire créer un RDV par un autre utilisateur\n2. Observer", "Notification 'Demande de RDV de X' reçue", 'Haute'],

  // === LANDING PAGE ===
  ['Landing', 'LAND-01', 'Hero section', "Vérifier la section hero", "1. Aller sur /\n2. Observer", "Hero avec mockup téléphone, CTA, badges stores, lien Fondation. Design theme-aware.", 'Haute'],
  ['Landing', 'LAND-02', 'Stats', "Vérifier les compteurs", "1. Scroller vers le bas\n2. Observer StatsSection", "500+ exposants, 2000+ professionnels, 12 mois d'accès", 'Moyenne'],
  ['Landing', 'LAND-03', 'Témoignage', "Vérifier section témoignage", "1. Scroller à la section HowItWorks\n2. Observer", "Citation + auteur + 3 étapes comment ça marche", 'Moyenne'],
  ['Landing', 'LAND-04', 'Features', "Vérifier la grille features", "1. Scroller aux features\n2. Observer les 6 cartes", "6 features (annuaire, chat, agenda, vitrine, newsletter, support) avec icônes et description", 'Moyenne'],
  ['Landing', 'LAND-05', 'Liens utiles', "Vérifier les liens utiles", "1. Scroller à la section UsefulLinks\n2. Cliquer sur chaque lien", "Liens ouvrent les bonnes pages/URLs", 'Basse'],
  ['Landing', 'LAND-06', 'CTA final', "Vérifier le call-to-action final", "1. Scroller au CTA\n2. Cliquer sur le bouton", "Redirigé vers /login", 'Haute'],
  ['Landing', 'LAND-07', 'Footer', "Vérifier le footer", "1. Scroller tout en bas\n2. Vérifier logo, Fondation Inter-Progress, liens, mentions, badge Play Store", "Footer complet, liens fonctionnels, fondation mise en avant", 'Moyenne'],

  // === PAIEMENT STRIPE ===
  ['Stripe', 'STRIPE-01', 'Page paiement', "Vérifier l'ouverture du checkout Stripe", "1. Aller sur /abonnement\n2. Cliquer sur Souscrire", "Redirecté vers le checkout Stripe hébergé", 'Haute'],
  ['Stripe', 'STRIPE-02', 'Paiement réussi', "Tester un paiement avec succès", "1. Utiliser la carte de test 4242 4242 4242 4242\n2. Valider le paiement", "Redirigé vers /abonnement, statut 'Actif'", 'Haute'],
  ['Stripe', 'STRIPE-03', 'Paiement refusé', "Tester un paiement refusé", "1. Utiliser la carte 4000 0000 0000 0002\n2. Valider", "Message d'erreur de paiement affiché", 'Haute'],
  ['Stripe', 'STRIPE-04', 'Webhook Stripe', "Vérifier la réception du webhook", "(Test technique — vérifier les logs Stripe dashboard)", "Webhook reçu et traité (customer.subscription.updated)", 'Haute'],
];

// ─── BUILD WORKBOOK ────────────────────────────────────────────

const wb = XLSX.utils.book_new();

const headers = ['Module', 'N° Test', 'Fonctionnalité', 'Cas de Test', 'Étapes', 'Résultat Attendu', 'Criticité'];
const colW = [18, 10, 24, 40, 45, 45, 10];

// Group tests by module
const groups = {};
for (const t of tests) {
  if (!groups[t[0]]) groups[t[0]] = [];
  groups[t[0]].push(t);
}

const rows = [];
// Header
rows.push(headers.map((h, i) => hdr(h, colW[i])));

// Data rows grouped by module
const moduleKeys = Object.keys(groups);
for (let m = 0; m < moduleKeys.length; m++) {
  const mod = moduleKeys[m];
  const modTests = groups[mod];

  // Module header row (merged visually)
  // We'll insert a colored row
  const moduleHeaderRow = [];
  for (let c = 0; c < headers.length; c++) {
    moduleHeaderRow.push(c === 0 ? cell(mod, { fill: moduleBg, color: moduleFg, bold: true, size: 11, align: 'center' }) : cell('', { fill: moduleBg }));
  }
  rows.push(moduleHeaderRow);

  for (let i = 0; i < modTests.length; i++) {
    const t = modTests[i];
    const row = [];
    for (let c = 0; c < headers.length; c++) {
      if (c === 0) {
        row.push(cell('', { fill: i % 2 === 0 ? undefined : altRow }));
      } else if (c === 3) {
        row.push(cell(t[c - 1] || '', { fill: i % 2 === 0 ? undefined : altRow, bold: true }));
      } else {
        row.push(cell(t[c - 1] || '', { fill: i % 2 === 0 ? undefined : altRow }));
      }
    }
    rows.push(row);
  }
}

// Empty row for spacing
rows.push(headers.map(() => cell('')));

// Status legend
rows.push([cell('LÉGENDE CRITICITÉ', { bold: true, size: 11 }), ...headers.slice(1).map(() => cell(''))]);
rows.push([cell('Haute', { bold: true, color: 'CC0000' }), cell('Fonctionnalité critique, doit impérativement fonctionner pour le GO'), ...headers.slice(2).map(() => cell(''))]);
rows.push([cell('Moyenne', { bold: true, color: 'CC7700' }), cell('Important mais contournement possible temporaire'), ...headers.slice(2).map(() => cell(''))]);
rows.push([cell('Basse', { bold: true, color: '336600' }), cell('Amélioration souhaitable, non bloquante pour le GO'), ...headers.slice(2).map(() => cell(''))]);
rows.push(headers.map(() => cell('')));
rows.push([cell('STATUTS', { bold: true, size: 11 }), ...headers.slice(1).map(() => cell(''))]);
rows.push([cell('✅ PASS', { bold: true, color: '006600' }), cell('Test réussi, conforme au résultat attendu') , ...headers.slice(2).map(() => cell(''))]);
rows.push([cell('❌ FAIL', { bold: true, color: 'CC0000' }), cell('Test échoué, bug à corriger avant le GO'), ...headers.slice(2).map(() => cell(''))]);
rows.push([cell('⏳ BLOCKED', { bold: true, color: 'CC7700' }), cell('Test bloqué par une dépendance ou un prérequis non rempli'), ...headers.slice(2).map(() => cell(''))]);
rows.push([cell('⚠️ WARNING', { bold: true, color: 'CC6600' }), cell('Fonctionnel mais avec des réserves ou anomalies mineures'), ...headers.slice(2).map(() => cell(''))]);

const ws = {};
const range = { s: { r: 0, c: 0 }, e: { r: rows.length - 1, c: headers.length - 1 } };

for (let R = 0; R < rows.length; R++) {
  for (let C = 0; C < rows[R].length; C++) {
    const addr = XLSX.utils.encode_cell({ r: R, c: C });
    ws[addr] = rows[R][C];
  }
}

ws['!ref'] = XLSX.utils.encode_range(range);
ws['!cols'] = colW.map(w => ({ wch: w }));

// Freeze top row
ws['!freeze'] = { xSplit: 0, ySplit: 1 };

XLSX.utils.book_append_sheet(wb, ws, 'Recettage');

// ─── Sheet 2: Résumé ─────────────────────────────────────────

const summaryHeaders = ['Module', 'Total', 'Haute', 'Moyenne', 'Basse', '✅ Pass', '❌ Fail', '⏳ Blocked', '⚠️ Warning', 'Taux de succès'];
const summaryColW = [22, 8, 8, 8, 8, 10, 10, 10, 10, 14];

const summaryRows = [summaryHeaders.map((h, i) => hdr(h, summaryColW[i]))];

for (const mod of moduleKeys) {
  const modTests = groups[mod];
  const total = modTests.length;
  const hautes = modTests.filter(t => t[6] === 'Haute').length;
  const moyennes = modTests.filter(t => t[6] === 'Moyenne').length;
  const basses = modTests.filter(t => t[6] === 'Basse').length;

  const row = summaryHeaders.map((h, i) => {
    if (i === 0) return cell(mod, { bold: true });
    if (i === 1) return cell(total, { align: 'center' });
    if (i === 2) return cell(hautes, { align: 'center', bold: true, color: 'CC0000' });
    if (i === 3) return cell(moyennes, { align: 'center', color: 'CC7700' });
    if (i === 4) return cell(basses, { align: 'center', color: '336600' });
    if (i === 9) return cell('— %', { align: 'center', italic: true });
    return cell('0', { align: 'center' });
  });
  summaryRows.push(row);
}

// Totals row
const totalAll = tests.length;
const totalHautes = tests.filter(t => t[6] === 'Haute').length;
const totalMoyennes = tests.filter(t => t[6] === 'Moyenne').length;
const totalBasses = tests.filter(t => t[6] === 'Basse').length;

const totalRow = summaryHeaders.map((h, i) => {
  if (i === 0) return cell('TOTAL', { bold: true, fill: moduleBg, color: moduleFg });
  if (i === 1) return cell(totalAll, { align: 'center', bold: true, fill: moduleBg, color: moduleFg });
  if (i === 2) return cell(totalHautes, { align: 'center', bold: true, fill: moduleBg, color: 'FF6666' });
  if (i === 3) return cell(totalMoyennes, { align: 'center', fill: moduleBg, color: 'FFAA44' });
  if (i === 4) return cell(totalBasses, { align: 'center', fill: moduleBg, color: '66CC66' });
  if (i === 9) return cell('— %', { align: 'center', italic: true, fill: moduleBg, color: moduleFg });
  return cell('', { fill: moduleBg });
});
summaryRows.push(totalRow);

// Legend
summaryRows.push(summaryHeaders.map(() => cell('')));
summaryRows.push([cell('INSTRUCTIONS', { bold: true, size: 12, color: headerBg }), ...summaryHeaders.slice(1).map(() => cell(''))]);
summaryRows.push([cell(''), cell('Les testeurs doivent exécuter chaque cas de test et noter le statut dans les colonnes ✅ à ⚠️')]);
summaryRows.push([cell(''), cell('Le taux de succès est calculé automatiquement : (Pass / Total) × 100')]);
summaryRows.push([cell(''), cell("Le GO Production nécessite : 100% des tests 'Haute' en ✅ PASS, 90% des tests 'Moyenne'")]);
summaryRows.push([cell(''), cell('Tout test FAIL ou BLOCKED doit être documenté dans la colonne Notes avec les étapes de reproduction.')]);

const ws2 = {};
const range2 = { s: { r: 0, c: 0 }, e: { r: summaryRows.length - 1, c: summaryHeaders.length - 1 } };
for (let R = 0; R < summaryRows.length; R++) {
  for (let C = 0; C < summaryRows[R].length; C++) {
    const addr = XLSX.utils.encode_cell({ r: R, c: C });
    ws2[addr] = summaryRows[R][C];
  }
}
ws2['!ref'] = XLSX.utils.encode_range(range2);
ws2['!cols'] = summaryColW.map(w => ({ wch: w }));
ws2['!freeze'] = { xSplit: 0, ySplit: 1 };

XLSX.utils.book_append_sheet(wb, ws2, 'Résumé');

// ─── Sheet 3: Rapport de Test ─────────────────────────────────

const reportHeaders = ['Testeur', 'Date', 'Module', 'N° Test', 'Fonctionnalité', 'Statut', 'Notes / Commentaires', 'Temps passé'];
const reportColW = [18, 14, 18, 10, 24, 12, 50, 12];
const reportRows = [reportHeaders.map((h, i) => hdr(h, reportColW[i]))];

reportRows.push([cell(''), cell(''), cell(''), cell(''), cell(''), cell(''), cell(''), cell('')]);
for (let i = 0; i < 30; i++) {
  reportRows.push(Array(reportHeaders.length).fill(cell('')));
}

const ws3 = {};
const range3 = { s: { r: 0, c: 0 }, e: { r: reportRows.length - 1, c: reportHeaders.length - 1 } };
for (let R = 0; R < reportRows.length; R++) {
  for (let C = 0; C < reportRows[R].length; C++) {
    const addr = XLSX.utils.encode_cell({ r: R, c: C });
    ws3[addr] = reportRows[R][C];
  }
}
ws3['!ref'] = XLSX.utils.encode_range(range3);
ws3['!cols'] = reportColW.map(w => ({ wch: w }));
ws3['!freeze'] = { xSplit: 0, ySplit: 1 };

XLSX.utils.book_append_sheet(wb, ws3, 'Rapport de Test');

// ─── Write ─────────────────────────────────────────────────────

const output = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
writeFileSync('RECETTAGE_PROMOTE_CONNECT.xlsx', output);
console.log(`✅ Fichier créé : RECETTAGE_PROMOTE_CONNECT.xlsx`);
console.log(`📊 ${tests.length} cas de test - ${moduleKeys.length} modules`);
console.log(`📋 3 feuilles : Recettage, Résumé, Rapport de Test`);
console.log(`\n🔥 Criticité : ${totalHautes} Haute / ${totalMoyennes} Moyenne / ${totalBasses} Basse`);
console.log(`\n👉 Tu peux importer ce fichier dans Google Sheets : Fichier > Importer`);
