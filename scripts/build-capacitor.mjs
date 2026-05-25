import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

function stash(src, dst) {
  if (!fs.existsSync(src)) return false;
  if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true, force: true });
  fs.cpSync(src, dst, { recursive: true, force: true });
  fs.rmSync(src, { recursive: true, force: true });
  return true;
}

function unstash(src, dst) {
  if (!fs.existsSync(src)) return false;
  if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true, force: true });
  fs.cpSync(src, dst, { recursive: true, force: true });
  fs.rmSync(src, { recursive: true, force: true });
  return true;
}

const stashes = [
  { label: 'app/api', src: path.join(rootDir, 'app', 'api'), dst: path.join(rootDir, 'api_backup_tmp') },
  { label: 'app/sitemap.ts', src: path.join(rootDir, 'app', 'sitemap.ts'), dst: path.join(rootDir, 'sitemap_backup_tmp') },
  { label: 'app/robots.ts', src: path.join(rootDir, 'app', 'robots.ts'), dst: path.join(rootDir, 'robots_backup_tmp') },
  { label: 'app/apple-icon.tsx', src: path.join(rootDir, 'app', 'apple-icon.tsx'), dst: path.join(rootDir, 'apple_icon_backup_tmp') },
];

try {
  console.log('=== Préparation du build statique Capacitor ===');
  console.log('- Nettoyage du cache...');
  if (fs.existsSync(path.join(rootDir, '.next'))) {
    fs.rmSync(path.join(rootDir, '.next'), { recursive: true, force: true });
    console.log('  → .next supprimé');
  }

  console.log('- Masquage temporaire des fichiers non compatibles static export...');
  for (const s of stashes) {
    if (stash(s.src, s.dst)) console.log(`  → ${s.label}`);
  }

  console.log('\n=== Lancement de Next.js Build (export statique) ===');
  execSync('npm run build', {
    stdio: 'inherit',
    cwd: rootDir,
    env: { ...process.env, CAPACITOR_BUILD: 'true' },
  });

} catch (error) {
  console.error('\n❌ Échec du build:', error.message);
  process.exitCode = 1;
} finally {
  console.log('\n=== Restauration des fichiers dynamiques ===');
  for (const s of stashes) {
    if (unstash(s.dst, s.src)) console.log(`  ✓ ${s.label} restauré`);
  }

  if (process.exitCode !== 1) {
    console.log('\n✅ Build statique généré dans le dossier /out avec succès !');
    console.log('➡️ Prochaine étape : npx cap sync android');
  }
}
