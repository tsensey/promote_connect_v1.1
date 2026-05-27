const fs = require('fs');
const frAdditions = {
  "abonnement.my_limits": "Mes limites",
  "abonnement.daily_messages": "Messages quotidiens",
  "abonnement.max_posts": "Publications maximum",
  "abonnement.max_vitrine": "Produits vitrine maximum",
  "annuaire.restricted_title": "Accès restreint",
  "annuaire.restricted_desc": "Cette fonctionnalité est réservée aux abonnés Premium.",
  "annuaire.unlock_access": "Débloquer l'accès",
  "annuaire.detail.country": "Pays",
  "common.reset": "Réinitialiser",
  "admin.espaces.toast_network": "Espaces mis à jour",
  "exposant.vitrine.revenue": "Chiffre d'affaires",
  "admin.users.col_role": "Rôle",
  "Abonnements": "Abonnements",
  "Configuration": "Configuration",
  "Signalements": "Signalements",
};

const enAdditions = {
  "abonnement.my_limits": "My limits",
  "abonnement.daily_messages": "Daily messages",
  "abonnement.max_posts": "Maximum posts",
  "abonnement.max_vitrine": "Maximum showcase products",
  "annuaire.restricted_title": "Restricted access",
  "annuaire.restricted_desc": "This feature is reserved for Premium subscribers.",
  "annuaire.unlock_access": "Unlock access",
  "annuaire.detail.country": "Country",
  "common.reset": "Reset",
  "admin.espaces.toast_network": "Spaces updated",
  "exposant.vitrine.revenue": "Revenue",
  "admin.users.col_role": "Role",
  "Abonnements": "Subscriptions",
  "Configuration": "Configuration",
  "Signalements": "Reports",
};

let content = fs.readFileSync('lib/i18n/translations.ts', 'utf8');

const frPart = Object.entries(frAdditions).map(([k, v]) => `    '${k}': "${v}",`).join('\n');
const enPart = Object.entries(enAdditions).map(([k, v]) => `    '${k}': "${v}",`).join('\n');

const enStartIndex = content.indexOf('en: {');
content = content.slice(0, enStartIndex - 6) + '\n    // ─── Ajouts manquants ───\n' + frPart + '\n  },\n  ' + content.slice(enStartIndex);

const exportFuncIndex = content.indexOf('export function getTranslation');
const endOfEnObjIndex = content.lastIndexOf('  },\n};', exportFuncIndex);

if (endOfEnObjIndex !== -1) {
  content = content.slice(0, endOfEnObjIndex) + '    // ─── Missing Additions ───\n' + enPart + '\n  },\n};\n' + content.slice(endOfEnObjIndex + 7);
}

fs.writeFileSync('lib/i18n/translations.ts', content);
console.log('Fixed translations.ts!');
