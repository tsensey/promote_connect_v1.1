/**
 * Script de conversion des images publiques en WebP
 * Usage : node scripts/optimize-images.mjs
 * 
 * Requiert : sharp (déjà installé en devDependencies)
 */
import sharp from 'sharp';
import { readdir, stat, rename } from 'fs/promises';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

// Fichiers à ne PAS convertir (déjà optimaux ou nécessaires en format original)
const SKIP = new Set([
  'favicon.ico',
  'apple-touch-icon.png',
  'favicon-96x96.png',
  'web-app-manifest-192x192.png',
  'web-app-manifest-512x512.png',
  'site.webmanifest',
  'sw.js',
]);

const EXTENSIONS_TO_CONVERT = ['.png', '.jpg', '.jpeg'];

async function optimizeImages() {
  const files = await readdir(PUBLIC_DIR);
  
  console.log('🖼️  Optimisation des images publiques...\n');
  
  let totalSaved = 0;
  
  for (const file of files) {
    if (SKIP.has(file)) continue;
    
    const ext = extname(file).toLowerCase();
    if (!EXTENSIONS_TO_CONVERT.includes(ext)) continue;
    
    const inputPath = join(PUBLIC_DIR, file);
    const stats = await stat(inputPath);
    const originalSize = stats.size;
    
    const name = basename(file, ext);
    // Nettoyer le nom de fichier (espaces → tirets)
    const cleanName = name.replace(/\s+/g, '-').replace(/[^a-z0-9-_]/gi, '');
    const outputPath = join(PUBLIC_DIR, `${cleanName}.webp`);
    
    try {
      const quality = ext === '.png' ? 85 : 80; // PNG peut supporter qualité plus haute
      
      await sharp(inputPath)
        .webp({ quality, effort: 6 })
        .toFile(outputPath);
      
      const newStats = await stat(outputPath);
      const newSize = newStats.size;
      const saved = originalSize - newSize;
      const percent = Math.round((saved / originalSize) * 100);
      
      totalSaved += saved;
      
      console.log(
        `✅ ${file} → ${cleanName}.webp` +
        `  ${formatSize(originalSize)} → ${formatSize(newSize)}` +
        `  (-${percent}%)`
      );
    } catch (err) {
      console.error(`❌ Erreur sur ${file}:`, err.message);
    }
  }
  
  console.log(`\n💾 Total économisé : ${formatSize(totalSaved)}`);
  console.log('\n⚠️  IMPORTANT: Mettez à jour les références dans le code si vous renommez les fichiers.');
  console.log('   Fichiers originaux conservés — supprimez-les manuellement après vérification.\n');
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

optimizeImages().catch(console.error);
