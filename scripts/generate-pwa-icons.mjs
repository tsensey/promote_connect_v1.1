/**
 * Script de génération des icônes PWA à partir du logo PROMOTE.
 *
 * Prérequis : npm install -D sharp
 * Usage    : node scripts/generate-pwa-icons.mjs
 *
 * Placez votre logo source dans public/logo-promote.png (vérifié).
 * Les icônes générées seront dans public/icons/.
 */

import sharp from 'sharp';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
const ICONS_DIR = join(PUBLIC_DIR, 'icons');
const LOGO_PATH = join(PUBLIC_DIR, 'logo-promote.png');

const SIZES = [72, 96, 128, 192, 256, 384, 512];

async function generateIcons() {
  if (!existsSync(LOGO_PATH)) {
    console.error(`Logo introuvable : ${LOGO_PATH}`);
    console.error('Placez votre logo au format PNG dans public/logo-promote.png');
    process.exit(1);
  }

  if (!existsSync(ICONS_DIR)) {
    mkdirSync(ICONS_DIR, { recursive: true });
  }

  const logoBuffer = readFileSync(LOGO_PATH);

  for (const size of SIZES) {
    const outputPath = join(ICONS_DIR, `icon-${size}x${size}.png`);
    await sharp(logoBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(outputPath);
    console.log(`✓ Généré : icon-${size}x${size}.png`);
  }

  // Génère aussi une version maskable (avec padding pour la safe zone)
  const maskableSize = 512;
  const maskablePath = join(ICONS_DIR, `icon-${maskableSize}x${maskableSize}-maskable.png`);
  await sharp(logoBuffer)
    .resize(Math.round(maskableSize * 0.75), Math.round(maskableSize * 0.75), {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .extend({
      top: Math.round(maskableSize * 0.125),
      bottom: Math.round(maskableSize * 0.125),
      left: Math.round(maskableSize * 0.125),
      right: Math.round(maskableSize * 0.125),
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(maskablePath);
  console.log(`✓ Généré : icon-${maskableSize}x${maskableSize}-maskable.png`);

  console.log('\n✅ Toutes les icônes PWA ont été générées dans public/icons/');
}

generateIcons().catch(console.error);
