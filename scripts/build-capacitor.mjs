import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const apiDir = path.join(rootDir, 'app', 'api');
const apiBackupDir = path.join(rootDir, 'api_backup_tmp');

const sitemapDir = path.join(rootDir, 'app', 'sitemap.ts');
const sitemapBackupDir = path.join(rootDir, 'sitemap_backup_tmp');

const robotDir = path.join(rootDir, 'app', 'robots.ts');
const robotBackupDir = path.join(rootDir, 'robots_backup_tmp');

const manifestDir = path.join(rootDir, 'app', 'manifest.ts');
const manifestBackupDir = path.join(rootDir, 'manifest_backup_tmp');

try {
  console.log('=== Préparation du build statique Capacitor ===');
  
  if (fs.existsSync(apiDir)) {
    console.log('- Masquage temporaire de app/api...');
    fs.renameSync(apiDir, apiBackupDir);
  }
  
  if (fs.existsSync(sitemapDir)) {
    console.log('- Masquage temporaire de app/sitemap.ts...');
    fs.renameSync(sitemapDir, sitemapBackupDir);
  }

  if (fs.existsSync(robotDir)) {
    console.log('- Masquage temporaire de app/robots.ts...');
    fs.renameSync(robotDir, robotBackupDir);
  }

  if (fs.existsSync(manifestDir)) {
    console.log('- Masquage temporaire de app/manifest.ts...');
    fs.renameSync(manifestDir, manifestBackupDir);
  }

  console.log('\n=== Lancement de Next.js Build (export statique) ===');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });

} catch (error) {
  console.error('\n❌ Échec du build:', error.message);
  process.exitCode = 1;
} finally {
  console.log('\n=== Restauration des fichiers dynamiques ===');
  if (fs.existsSync(apiBackupDir)) {
    fs.renameSync(apiBackupDir, apiDir);
    console.log('- app/api restauré.');
  }
  if (fs.existsSync(sitemapBackupDir)) {
    fs.renameSync(sitemapBackupDir, sitemapDir);
    console.log('- app/sitemap.ts restauré.');
  }
  if (fs.existsSync(robotBackupDir)) {
    fs.renameSync(robotBackupDir, robotDir);
    console.log('- app/robots.ts restauré.');
  }
  if (fs.existsSync(manifestBackupDir)) {
    fs.renameSync(manifestBackupDir, manifestDir);
    console.log('- app/manifest.ts restauré.');
  }
  
  if (process.exitCode !== 1) {
    console.log('\n✅ Build statique généré dans le dossier /out avec succès !');
    console.log('➡️ Prochaine étape : npx cap sync android');
  }
}
