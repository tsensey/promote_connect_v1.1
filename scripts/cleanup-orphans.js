/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const isDryRun = process.argv.includes('--dry-run');

const BLOCKING_CHECKS = [
  { table: 'conversations', column: 'participant_a' },
  { table: 'conversations', column: 'participant_b' },
  { table: 'messages', column: 'sender_id' },
  { table: 'rendez_vous', column: 'demandeur_id' },
  { table: 'rendez_vous', column: 'destinataire_id' },
  { table: 'support_tickets', column: 'profile_id' },
  { table: 'support_messages', column: 'sender_id' },
  { table: 'newsletter_subscriptions', column: 'profile_id' },
  { table: 'audit_logs', column: 'actor_id' },
];

async function listAllUsers() {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users || [];
}

async function countBlockingRefs(profileId) {
  const refs = [];
  for (const { table, column } of BLOCKING_CHECKS) {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq(column, profileId);
    if (error) throw error;
    if (count > 0) refs.push({ table, column, count });
  }
  return refs;
}

async function cleanupOrphanExposants() {
  console.log('\n--- Exposants sans profile_id (orphelins) ---');

  const { data: orphans, error } = await supabase
    .from('exposants')
    .select('id, nom')
    .is('profile_id', null);

  if (error) throw error;

  stats.orphanExposants = orphans.length;
  console.log(`  Trouves: ${orphans.length}`);

  for (const exp of orphans) {
    console.log(`  -> ${exp.nom} (${exp.id})`);

    if (!isDryRun) {
      const { error: delProdErr } = await supabase
        .from('produits')
        .delete()
        .eq('exposant_id', exp.id);

      if (delProdErr) {
        stats.errors.push(`produits pour ${exp.nom}: ${delProdErr.message}`);
        console.log(`     ERREUR produits: ${delProdErr.message}`);
        continue;
      }

      const { error: delExpErr } = await supabase
        .from('exposants')
        .delete()
        .eq('id', exp.id);

      if (delExpErr) {
        stats.errors.push(`${exp.nom}: ${delExpErr.message}`);
        console.log(`     ERREUR: ${delExpErr.message}`);
      } else {
        stats.orphanExposantsDeleted++;
        console.log(`     SUPPRIME`);
      }
    }
  }

  if (isDryRun && orphans.length > 0) {
    console.log(`  [DRY-RUN] ${orphans.length} exposants seront supprimes`);
  }
}

async function cleanupOrphanProfiles() {
  console.log('\n--- Profils role=exposant sans exposant lie (orphelins) ---');

  const { data: linkedProfileIds, error: linkErr } = await supabase
    .from('exposants')
    .select('profile_id')
    .not('profile_id', 'is', null);

  if (linkErr) throw linkErr;

  const linkedSet = new Set(linkedProfileIds.map((r) => r.profile_id));

  const { data: exposantProfiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'exposant');

  if (profErr) throw profErr;

  const orphans = exposantProfiles.filter((p) => !linkedSet.has(p.id));

  stats.orphanProfiles = orphans.length;
  console.log(`  Trouves: ${orphans.length}`);

  const allAuthUsers = await listAllUsers();
  const authByProfileId = new Map(allAuthUsers.map((u) => [u.id, u]));

  for (const profile of orphans) {
    const authUser = authByProfileId.get(profile.id);
    const email = authUser?.email || 'N/A';
    console.log(`  -> ${profile.full_name || 'Sans nom'} <${email}> (${profile.id})`);

    const refs = await countBlockingRefs(profile.id);

    if (refs.length > 0) {
      stats.orphanProfilesSkipped++;
      console.log(`     IGNORE (dependances trouvees):`);
      for (const r of refs) {
        console.log(`       - ${r.table}.${r.column}: ${r.count} ligne(s)`);
      }
      continue;
    }

    if (isDryRun) {
      console.log(`     [DRY-RUN] sera supprime`);
      continue;
    }

    const { error: delProfErr } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profile.id);

    if (delProfErr) {
      stats.errors.push(`profile ${profile.id}: ${delProfErr.message}`);
      console.log(`     ERREUR profile: ${delProfErr.message}`);
      continue;
    }

    if (authUser) {
      const { error: delAuthErr } = await supabase.auth.admin.deleteUser(profile.id);
      if (delAuthErr) {
        stats.errors.push(`auth user ${profile.id}: ${delAuthErr.message}`);
        console.log(`     ERREUR auth: ${delAuthErr.message}`);
      }
    }

    stats.orphanProfilesDeleted++;
    console.log(`     SUPPRIME`);
  }

  if (isDryRun && orphans.length > 0) {
    console.log(`  [DRY-RUN] ${orphans.length} profils seront supprimes`);
  }
}

const stats = {
  orphanExposants: 0,
  orphanExposantsDeleted: 0,
  orphanProfiles: 0,
  orphanProfilesDeleted: 0,
  orphanProfilesSkipped: 0,
  errors: [],
};

async function main() {
  console.log('========================================');
  console.log('  Nettoyage des comptes orphelins');
  console.log('========================================');
  if (isDryRun) console.log('  MODE DRY-RUN — aucune suppression reelle\n');

  await cleanupOrphanExposants();
  await cleanupOrphanProfiles();

  console.log('\n========================================');
  console.log('  Rapport final');
  console.log('========================================');
  console.log(`  Exposants orphelins trouves:      ${stats.orphanExposants}`);
  console.log(`  Exposants orphelins supprimes:    ${stats.orphanExposantsDeleted}`);
  console.log(`  Profils orphelins trouves:        ${stats.orphanProfiles}`);
  console.log(`  Profils orphelins supprimes:      ${stats.orphanProfilesDeleted}`);
  console.log(`  Profils orphelins ignores:        ${stats.orphanProfilesSkipped}`);
  if (stats.errors.length > 0) {
    console.log(`  Erreurs:                           ${stats.errors.length}`);
    for (const err of stats.errors) console.log(`    - ${err}`);
  }
  console.log('========================================');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
