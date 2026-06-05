import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';

const accent = '520a3f';
const gold = 'fcd34d';
const light = 'f5f0f5';
const white = 'FFFFFF';
const headerBg = accent;
const headerFg = white;
const subHeaderBg = 'EDE4ED';
const altRow = 'FAF7FA';

function style(cfg) {
  return {
    font: { name: 'Calibri', size: cfg.size || 11, bold: !!cfg.bold, color: { rgb: cfg.color || '333333' } },
    fill: cfg.fill ? { fgColor: { rgb: cfg.fill } } : undefined,
    alignment: { horizontal: cfg.align || 'left', vertical: 'center', wrapText: !!cfg.wrap },
    border: {
      top: { style: 'thin', color: { rgb: 'D0C8D0' } },
      bottom: { style: 'thin', color: { rgb: 'D0C8D0' } },
      left: { style: 'thin', color: { rgb: 'D0C8D0' } },
      right: { style: 'thin', color: { rgb: 'D0C8D0' } },
    },
  };
}

function hdr(label, w) {
  return { v: label, t: 's', s: style({ bold: true, color: headerFg, fill: headerBg, size: 12 }) };
}

function cell(v, opts = {}) {
  return { v: String(v ?? ''), t: 's', s: style({ wrap: true, fill: opts.fill, size: opts.size || 10 }) };
}

function sheet(name, headers, rows, colWidths) {
  const ws = {};
  const range = { s: { r: 0, c: 0 }, e: { r: rows.length, c: headers.length - 1 } };

  for (let C = 0; C < headers.length; C++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C });
    ws[addr] = hdr(headers[C]);
  }

  for (let R = 0; R < rows.length; R++) {
    for (let C = 0; C < headers.length; C++) {
      const addr = XLSX.utils.encode_cell({ r: R + 1, c: C });
      const val = rows[R][C];
      ws[addr] = cell(val, { fill: R % 2 === 0 ? undefined : altRow });
    }
  }

  ws['!ref'] = XLSX.utils.encode_range(range);
  ws['!cols'] = colWidths.map(w => ({ wch: w }));
  return ws;
}

function sheetFromData(name, data, colWidths) {
  const headers = data[0];
  const rows = data.slice(1);
  return sheet(name, headers, rows, colWidths);
}

// ─── DATA ──────────────────────────────────────────────────────

// Sheet 1: Stack Technique
const stackData = [
  ['Couche', 'Technologie', 'Version'],
  ['Framework', 'Next.js (App Router)', '16.2.6'],
  ['Langage', 'TypeScript (strict)', '5.9.3'],
  ['Styling', 'Tailwind CSS v4 + shadcn/ui', '4.2.4'],
  ['Base de données', 'PostgreSQL (via Supabase)', '—'],
  ['Auth', 'Supabase Auth (SSR)', '0.10.3'],
  ['Client BDD', 'Supabase JS', '2.105.4'],
  ['ORM / SQL', 'postgres (drizzle-like)', '3.4.9'],
  ['Paiement', 'Stripe', '22.1.1'],
  ['Email', 'Resend', '6.12.3'],
  ['State client', 'Zustand', '5.0.13'],
  ['Cache serveur', 'TanStack React Query', '5.100.10'],
  ['Mobile', 'Capacitor (Android TWA)', '8.3.4'],
  ['Monitoring', 'Sentry', '10.53.1'],
  ['Analytics', 'Plausible', '—'],
  ['PWA', 'Service Worker + Manifest', '—'],
  ['Tests unitaires', 'Vitest + Testing Library', '4.1.6'],
  ['Tests e2e', 'Playwright', '1.60.0'],
  ['CI/CD', 'GitHub Actions', '—'],
  ['Automation', 'n8n (self-hosted)', '—'],
  ['UI Kit', 'shadcn/ui (43 composants)', '—'],
  ['Icons', 'Lucide React', '1.16.0'],
  ['Date', 'date-fns', '4.1.0'],
  ['Toast', 'Sonner', '2.0.7'],
];

// Sheet 2: Routes
const routeData = [
  ['Route', 'Fichier', 'Type', 'Description'],
  // Publiques
  ['/', 'app/page.tsx', 'Publique', 'Landing page marketing'],
  ['/login', 'app/(auth)/login/page.tsx', 'Publique', 'Connexion'],
  ['/register', 'app/(auth)/register/page.tsx', 'Publique', 'Inscription'],
  ['/forgot-password', 'app/(auth)/forgot-password/page.tsx', 'Publique', 'Mot de passe oublié'],
  ['/reset-password', 'app/(auth)/reset-password/page.tsx', 'Publique', 'Réinitialisation mot de passe'],
  ['/offline', 'app/offline/page.tsx', 'Publique', 'Page hors-ligne PWA'],
  ['/condition', 'app/condition/page.tsx', 'Publique', "Conditions générales d'utilisation"],
  ['/privacy', 'app/privacy/page.tsx', 'Publique', 'Politique de confidentialité'],
  ['/guide', 'app/guide/page.tsx', 'Publique', 'Guide utilisateur'],
  // Dashboard
  ['/app', 'app/(dashboard)/app/page.tsx', 'Dashboard', 'Dashboard principal'],
  ['/feed', 'app/(dashboard)/feed/page.tsx', 'Dashboard', "Fil d'actualités"],
  ['/annuaire', 'app/(dashboard)/annuaire/page.tsx', 'Dashboard', 'Annuaire exposants'],
  ['/annuaire/[exposantId]', 'app/(dashboard)/annuaire/[exposantId]/page.tsx', 'Dashboard', 'Fiche exposant'],
  ['/chat', 'app/(dashboard)/chat/page.tsx', 'Dashboard', 'Messagerie (liste)'],
  ['/chat/[conversationId]', 'app/(dashboard)/chat/[conversationId]/page.tsx', 'Dashboard', 'Conversation'],
  ['/agenda', 'app/(dashboard)/agenda/page.tsx', 'Dashboard', 'Agenda / Programme'],
  ['/agenda/[eventId]', 'app/(dashboard)/agenda/[eventId]/page.tsx', 'Dashboard', "Détail d'événement"],
  ['/vitrine', 'app/(dashboard)/vitrine/page.tsx', 'Dashboard', 'Vitrine produits (liste)'],
  ['/vitrine/[exposantId]', 'app/(dashboard)/vitrine/[exposantId]/page.tsx', 'Dashboard', 'Vitrine exposant'],
  ['/exposant/ma-vitrine', 'app/(dashboard)/exposant/ma-vitrine/page.tsx', 'Dashboard', 'Édition vitrine'],
  ['/abonnement', 'app/(dashboard)/abonnement/page.tsx', 'Dashboard', 'Abonnement Stripe'],
  ['/newsletter', 'app/(dashboard)/newsletter/page.tsx', 'Dashboard', 'Newsletter'],
  ['/support', 'app/(dashboard)/support/page.tsx', 'Dashboard', 'Support tickets (liste)'],
  ['/support/[ticketId]', 'app/(dashboard)/support/[ticketId]/page.tsx', 'Dashboard', 'Détail ticket support'],
  ['/parametres', 'app/(dashboard)/parametres/page.tsx', 'Dashboard', 'Paramètres utilisateur'],
  ['/recherche', 'app/(dashboard)/recherche/page.tsx', 'Dashboard', 'Recherche globale'],
  // Admin
  ['/admin', 'app/admin/page.tsx', 'Admin', 'Dashboard admin'],
  ['/admin/exposants', 'app/admin/exposants/page.tsx', 'Admin', 'Gestion exposants (liste)'],
  ['/admin/exposants/[id]', 'app/admin/exposants/[exposantId]/page.tsx', 'Admin', 'Détail exposant'],
  ['/admin/espaces', 'app/admin/espaces/page.tsx', 'Admin', 'Gestion espaces/pavillons'],
  ['/admin/abonnements', 'app/admin/abonnements/page.tsx', 'Admin', 'Abonnements Stripe'],
  ['/admin/signalements', 'app/admin/signalements/page.tsx', 'Admin', 'Signalements modération'],
  ['/admin/tickets', 'app/admin/tickets/page.tsx', 'Admin', 'Tickets support (liste)'],
  ['/admin/tickets/[id]', 'app/admin/tickets/[ticketId]/page.tsx', 'Admin', 'Détail ticket support'],
  ['/admin/users', 'app/admin/users/page.tsx', 'Admin', 'Gestion utilisateurs'],
  ['/admin/configuration', 'app/admin/configuration/page.tsx', 'Admin', 'Configuration plateforme'],
  ['/admin/logs', 'app/admin/logs/page.tsx', 'Admin', "Audit logs d'activité"],
  ['/admin/newsletter', 'app/admin/newsletter/page.tsx', 'Admin', 'Newsletter (admin)'],
  ['/admin/programme', 'app/admin/programme/page.tsx', 'Admin', 'Programme salon'],
];

// Sheet 3: API Routes
const apiData = [
  ['Endpoint', 'Méthode', 'Description', 'Auth'],
  ['/api/auth/forgot-password', 'POST', "Envoi d'email de réinitialisation", 'Non'],
  ['/api/chat/initiate', 'POST', 'Créer une nouvelle conversation', 'Oui (JWT)'],
  ['/api/chat/send', 'POST', 'Envoyer un message', 'Oui (JWT)'],
  ['/api/chat/check-quota', 'GET', 'Vérifier le quota de messages', 'Oui (JWT)'],
  ['/api/feed/sorted', 'GET', 'Feed trié par date', 'Oui (JWT)'],
  ['/api/feed/upload', 'POST', 'Uploader une image pour le feed', 'Oui (JWT)'],
  ['/api/posts/create', 'POST', 'Créer une publication', 'Oui (JWT)'],
  ['/api/search', 'GET', 'Recherche globale', 'Oui (JWT)'],
  ['/api/newsletter', 'POST', 'Gestion newsletter', 'Oui (JWT)'],
  ['/api/newsletter/subscribe', 'POST', "S'abonner à la newsletter", 'Non'],
  ['/api/newsletter/unsubscribe', 'POST', 'Se désabonner', 'Non (via token)'],
  ['/api/generate-rdv', 'POST', 'Générer un RDV automatique', 'Oui (Edge)'],
  ['/api/rdv/notify', 'POST', 'Notification de RDV', 'Oui (JWT)'],
  ['/api/vitrine/list', 'GET', 'Lister les vitrines', 'Oui (JWT)'],
  ['/api/vitrine/offers/create', 'POST', 'Créer une offre produit', 'Oui (JWT)'],
  ['/api/webhooks/stripe', 'POST', 'Webhook événements Stripe', 'Signature'],
  ['/api/webhooks/fcm', 'POST', 'Webhook notifications push FCM', 'Bearer'],
  ['/api/cron/rdv-reminder', 'GET', 'Cron rappel de RDV', 'Bearer'],
  ['/api/admin/espaces', 'GET/POST', 'CRUD espaces/pavillons', 'Admin'],
  ['/api/admin/espaces/exposants', 'GET/POST', 'Gestion exposants espaces', 'Admin'],
  ['/api/admin/users', 'GET/POST', 'Gestion utilisateurs', 'Admin'],
  ['/api/admin/users/reset-password', 'POST', 'Reset password utilisateur', 'Admin'],
  ['/api/admin/logs', 'GET', "Consultation logs d'audit", 'Admin'],
];

// Sheet 4: Database Tables
const dbData = [
  ['Table', 'Description', 'Colonnes clés', 'RLS'],
  ['profiles', 'Profils utilisateurs (extends auth.users)', 'id, full_name, company, role, sector, country, subscription_tier, stripe_customer_id', 'Oui'],
  ['exposants', 'Fiches exposants du salon', 'id, profile_id, nom, description, secteur, pavillon, stand, pays, website, logo_url, is_featured', 'Oui'],
  ['produits', 'Produits/Services des exposants', 'id, exposant_id, nom, description, categorie, image_url, prix_indicatif', 'Oui'],
  ['conversations', 'Conversations de chat', 'id, participant_a, participant_b, last_message_at', 'Oui'],
  ['messages', 'Messages de chat', 'id, conversation_id, sender_id, content, is_read, created_at', 'Oui'],
  ['evenements', 'Programme du salon', 'id, titre, description, pavillon, salle, starts_at, ends_at, type, speakers', 'Oui'],
  ['rendez_vous', 'RDV B2B entre participants', 'id, demandeur_id, destinataire_id, starts_at, ends_at, status, notes', 'Oui'],
  ['subscriptions', 'Abonnements Stripe', 'id, profile_id, stripe_customer_id, stripe_subscription_id, status, current_period_end', 'Oui'],
  ['feed_posts', 'Publications du fil', "id, author_id, content, media_url, media_type, is_pinned, created_at", 'Oui'],
  ['feed_comments', 'Commentaires sur les posts', 'id, post_id, author_id, content, parent_id, created_at', 'Oui'],
  ['feed_reactions', 'Réactions aux posts', 'id, post_id, user_id, emoji, created_at', 'Oui'],
  ['feed_shares', 'Partages de posts', 'id, post_id, user_id, created_at', 'Oui'],
  ['support_tickets', 'Tickets de support', 'id, user_id, subject, description, status, category, assigned_to', 'Oui'],
  ['notifications', 'Notifications utilisateur', 'id, user_id, type, title, content, is_read, created_at', 'Oui'],
  ['blocked_users', 'Utilisateurs bloqués', 'id, blocker_id, blocked_id, reason, created_at', 'Oui'],
  ['reports', 'Signalements modération', 'id, reporter_id, reported_user_id, reason, status, created_at', 'Oui'],
  ['audit_logs', "Logs d'audit administrateur", 'id, user_id, action, details, ip_address, created_at', 'Oui'],
  ['newsletter_subscribers', 'Abonnés newsletter', 'id, email, locale, subscribed, unsubscribe_token', 'Oui'],
  ['platform_config', 'Configuration plateforme', 'id, key, value, updated_at', 'Oui'],
  ['user_preferences', 'Préférences utilisateur', 'id, user_id, notifications_enabled, locale, theme', 'Oui'],
  ['espaces', 'Espaces/Pavillons du salon', 'id, nom, type, description, capacite', 'Oui'],
  ['rate_limits', 'Rate limiting', 'id, identifier, action, window_start, count', 'Oui'],
  ['fcm_tokens', 'Tokens Firebase Cloud Messaging', 'id, user_id, token, created_at', 'Oui'],
  ['webhook_events', 'Suivi webhooks', 'id, source, event_type, status, received_at', 'Oui'],
];

// Sheet 5: Composants
const compData = [
  ['Composant', 'Catégorie', 'Description'],
  ['MarketingNavbar', 'Landing', 'Barre navigation fixe avec logo, liens, toggles, login'],
  ['HeroSection', 'Landing', 'Hero fullscreen avec mockup téléphone, CTA, badges stores'],
  ['StatsSection', 'Landing', 'Statistiques clés (500+ exposants, 2000+ pros, 12 mois)'],
  ['HowItWorksSection', 'Landing', 'Témoignage + 3 étapes comment ça marche'],
  ['FeaturesSection', 'Landing', 'Grille 6 fonctionnalités avec icônes'],
  ['UsefulLinksSection', 'Landing', 'Liens utiles vers ressources officielles'],
  ['CtaSection', 'Landing', 'Section CTA finale avec bouton accès'],
  ['MarketingFooter', 'Landing', 'Footer avec logo, Fondation, liens, badges stores'],
  ['UserSidebar', 'Layout', 'Sidebar navigation utilisateur dashboard'],
  ['UserTopbar', 'Layout', 'Topbar avec notifications + profil'],
  ['MobileBottomNav', 'Layout', 'Navigation mobile bottom'],
  ['TrialBanner', 'Layout', "Bannière d'essai gratuit / abonnement"],
  ['NotificationDropdown', 'Layout', 'Dropdown notifications temps réel'],
  ['AdminSidebar', 'Layout Admin', 'Sidebar navigation admin'],
  ['AdminTopbar', 'Layout Admin', 'Topbar admin'],
  ['EvenementCard', 'Agenda', "Carte d'événement du programme"],
  ['RdvCard', 'Agenda', 'Carte de rendez-vous B2B'],
  ['ProgrammeFormDialog', 'Agenda', 'Formulaire de programme (admin)'],
  ['NewRdvDialog', 'Agenda', 'Dialogue création RDV'],
  ['ChatInput', 'Chat', 'Zone de saisie de message'],
  ['MessageBubble', 'Chat', 'Bulle de message'],
  ['CreatePost', 'Feed', 'Création de publication'],
  ['CreatePostFAB', 'Feed', 'Bouton flottant création post'],
  ['PostCard', 'Feed', "Carte d'une publication"],
  ['SearchBar', 'Recherche', 'Barre de recherche'],
  ['SearchCommandPalette', 'Recherche', 'Palette de commandes (Cmd+K)'],
  ['SearchResultItem', 'Recherche', "Élément de résultat d'recherche"],
  ['ScrollReveal', 'Shared', 'Animation au scroll (IntersectionObserver)'],
  ['AppStoreBadges', 'Shared', 'Badge Google Play Store'],
  ['UserIdentity', 'Shared', 'Avatar + nom utilisateur'],
  ['NotificationProvider', 'Shared', 'Provider notifications temps réel'],
  ['PwaRegister', 'Shared', "Enregistrement PWA Service Worker"],
  ['MentionInput', 'Shared', 'Zone de saisie avec mentions @'],
  ['ReportButton', 'Shared', 'Bouton de signalement'],
  ['ConversionModal', 'Shared', 'Modal conversion abonnement payant'],
  ['NativeAuthGuard', 'Shared', 'Guard authentification Capacitor'],
  ['SentryErrorBoundary', 'Shared', 'Error boundary Sentry'],
  ['AdminPagination', 'Shared', 'Pagination admin'],
  ['PlausibleAnalytics', 'Shared', 'Script analytics Plausible'],
];

// Sheet 6: Hooks & Stores
const hooksData = [
  ['Nom', 'Type', 'Description'],
  ['useAgenda', 'Hook', 'Événements et rendez-vous'],
  ['useAnnuaire', 'Hook', 'Annuaire exposants avec filtres'],
  ['useBlockedUsers', 'Hook', 'Gestion des utilisateurs bloqués'],
  ['useChat', 'Hook', 'Messagerie temps réel'],
  ['useExposants', 'Hook', 'Données exposants'],
  ['useFeed', 'Hook', "Fil d'actualités"],
  ['useIdentity', 'Hook', 'Identité utilisateur courante'],
  ['useIntersectionObserver', 'Hook', "Observer d'intersection pour animations"],
  ['useMediaQuery', 'Hook', 'Media queries responsive'],
  ['use-mobile', 'Hook', 'Détection mobile'],
  ['useNotifications', 'Hook', 'Notifications temps réel'],
  ['usePermissions', 'Hook', 'Vérification des permissions'],
  ['useProfilePosts', 'Hook', 'Posts publiés par un profil'],
  ['useSearch', 'Hook', 'Recherche globale'],
  ['useSettings', 'Hook', 'Paramètres utilisateur'],
  ['useSupport', 'Hook', 'Tickets de support'],
  ['agendaStore', 'Store Zustand', 'État agenda (événements, RDV, filtres)'],
  ['chatStore', 'Store Zustand', 'État chat (conversations, messages)'],
  ['userStore', 'Store Zustand', 'État utilisateur (profil, préférences, abonnement)'],
];

// Sheet 7: Modules
const modulesData = [
  ['Module', 'Priorité', 'Description', 'Pages'],
  ['A — Annuaire Exposants', 'Haute', 'Liste paginée + filtres (secteur, pays, pavillon, type activité) + fiches détaillées avec bouton contacter. Temps chargement cible < 2s.', '/annuaire, /annuaire/[id]'],
  ['B — Chat Privé', 'Haute', 'Messagerie 1-to-1 temps réel via Supabase Realtime. Historique conservé 12 mois. Chiffrement, indicateurs lecture, partage fichiers. Notifications push FCM.', '/chat, /chat/[id]'],
  ['C — Agenda Interactif', 'Haute', 'Programme salon mis à jour temps réel. Gestion RDV B2B avec statuts pending/confirmed/cancelled. Rappels notifications. Sync Google/Outlook (Ph3).', '/agenda, /agenda/[id]'],
  ['D — Vitrine Produits', 'Moyenne', 'CRUD produits/services par exposant. Visibilité communauté PROMOTE-CONNECT. Stats vues, clics, contacts générés.', '/vitrine, /vitrine/[id], /exposant/ma-vitrine'],
  ['E — Newsletter', 'Moyenne', 'Envoi automatisé via n8n + Resend. Personnalisation par secteur. Archivage espace personnel.', '/newsletter, /admin/newsletter'],
  ['F — Support Technique', 'Moyenne', 'Chat support intégré. Système de tickets avec catégories. Base de connaissances FAQ.', '/support, /support/[id]'],
  ['G — Accès 12 mois', 'Haute', "Gestion abonnement via Stripe. Prolongation automatique post-salon. Renouvellement et résiliation. Vérification subscription_tier = 'paid'.", '/abonnement, /admin/abonnements'],
];

// Sheet 8: Emails
const emailsData = [
  ['Template', 'Déclencheur', 'Description'],
  ['WelcomeEmail', 'Inscription', "Email de bienvenue avec lien d'accès à la plateforme"],
  ['NewsletterEmail', 'Envoi newsletter', 'Template de newsletter personnalisée par secteur'],
  ['RdvConfirmationEmail', 'Confirmation RDV', 'Confirmation avec date, heure et participant'],
  ['CredentialsEmail', 'Création admin', "Envoi identifiants de connexion (admin)"],
  ['ForgotPasswordEmail', 'Mot de passe oublié', 'Lien de réinitialisation du mot de passe'],
  ['ResetPasswordEmail', 'Confirmation reset', 'Confirmation que le mot de passe a été changé'],
];

// Sheet 9: Edge Functions
const edgeData = [
  ['Fonction', 'Runtime', 'Déclencheur', 'Description'],
  ['generate-rdv', 'Deno', 'API / cron', 'Génération automatique de RDV B2B basée sur les centres d\'intérêt'],
  ['send-newsletter', 'Deno', 'API / n8n', 'Envoi de newsletters via Resend avec template React Email'],
  ['send-push-notification', 'Deno', 'API / webhook FCM', 'Envoi de notifications push Firebase Cloud Messaging'],
];

// Sheet 10: Scripts
const scriptsData = [
  ['Script', 'Type', 'Description'],
  ['seed.js', 'Node.js', 'Seed initial de la base de données avec données de test'],
  ['create-admin.mjs', 'Node.js', 'Création d\'un compte administrateur en CLI'],
  ['cleanup-orphans.js', 'Node.js', 'Nettoyage des données orphelines (profils sans auth, etc.)'],
  ['generate-pwa-icons.mjs', 'Node.js + Sharp', 'Génération des icônes PWA 72-512px + maskable'],
  ['build-capacitor.mjs', 'Node.js', 'Build export statique pour Capacitor (Android)'],
  ['check-production-env.mjs', 'Node.js', 'Vérification des variables d\'environnement requises'],
];

// Sheet 11: Internationalisation
const i18nData = [
  ['Locale', 'Code', 'Clés', 'Statut'],
  ['Français (défaut)', 'fr', '~1600+ clés', 'Complet'],
  ['Anglais', 'en', '~1600+ clés', 'Complet'],
  ['Provider', '—', 'lib/i18n/I18nProvider.tsx', 'Client-side'],
  ['Hook', '—', 'useTranslation()', '—'],
  ['Fichier source', '—', 'lib/i18n/translations.ts', '~3280 lignes'],
];

// Sheet 12: Sécurité
const secData = [
  ['Mesure', 'Détail'],
  ['Content Security Policy (CSP)', 'Scripts, connect-src, frame-src, worker-src blob:, img-src, style-src, font-src stricts (next.config.mjs)'],
  ['HSTS', 'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload'],
  ['X-Frame-Options', 'DENY — impossible d\'encastrer dans une iframe'],
  ['Permissions Policy', 'Caméra, microphone, géolocalisation bloquées'],
  ['Row Level Security (RLS)', 'Toutes les tables Supabase ont RLS activé avec politiques fines'],
  ['Rate Limiting', 'lib/rate-limit.ts — limite les endpoints exposés (FCM, upload, auth)'],
  ['Sanitization HTML', 'dompurify — nettoie le contenu HTML avant affichage'],
  ['Webhook Stripe', 'Validation de signature via stripe.webhooks.constructEvent + idempotency'],
  ['Auth', 'Supabase SSR avec refresh tokens, session management'],
  ['MDP oublié', 'Reset via email avec token temporaire'],
  ['CSP pour PWA', 'worker-src \'self\' blob: nécessaire pour le Service Worker'],
  ['Blocage utilisateurs', 'Table blocked_users + vérification dans les requêtes chat/messages'],
];

// ─── BUILD WORKBOOK ────────────────────────────────────────────

const wb = XLSX.utils.book_new();

XLSX.utils.book_append_sheet(wb, sheetFromData('Stack', stackData, [22, 35, 14]), 'Stack Technique');
XLSX.utils.book_append_sheet(wb, sheetFromData('Routes', routeData, [30, 40, 14, 50]), 'Routes');
XLSX.utils.book_append_sheet(wb, sheetFromData('API', apiData, [38, 12, 50, 14]), 'API');
XLSX.utils.book_append_sheet(wb, sheetFromData('Tables BDD', dbData, [22, 40, 60, 8]), 'Tables BDD');
XLSX.utils.book_append_sheet(wb, sheetFromData('Composants', compData, [28, 16, 60]), 'Composants');
XLSX.utils.book_append_sheet(wb, sheetFromData('Hooks & Stores', hooksData, [22, 16, 65]), 'Hooks & Stores');
XLSX.utils.book_append_sheet(wb, sheetFromData('Modules', modulesData, [24, 10, 65, 30]), 'Modules');
XLSX.utils.book_append_sheet(wb, sheetFromData('Emails', emailsData, [22, 22, 55]), 'Emails');
XLSX.utils.book_append_sheet(wb, sheetFromData('Edge Functions', edgeData, [22, 10, 14, 55]), 'Edge Functions');
XLSX.utils.book_append_sheet(wb, sheetFromData('Scripts', scriptsData, [28, 14, 60]), 'Scripts');
XLSX.utils.book_append_sheet(wb, sheetFromData('i18n', i18nData, [22, 10, 18, 12]), 'i18n');
XLSX.utils.book_append_sheet(wb, sheetFromData('Sécurité', secData, [28, 80]), 'Sécurité');

const output = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
writeFileSync('RECETTE_PROMOTE_CONNECT.xlsx', output);
console.log(`✅ Fichier créé : RECETTE_PROMOTE_CONNECT.xlsx (${(output.length / 1024).toFixed(0)} KB, ${wb.SheetNames.length} feuilles)`);
