const fs = require('fs');
const path = require('path');

const srcDirs = ['app', 'components', 'lib', 'hooks'];
const translationsFile = 'lib/i18n/translations.ts';

// 1. Get all translation keys from translations.ts
const content = fs.readFileSync(translationsFile, 'utf8');
const keys = new Set();
const lines = content.split('\n');
let inFr = false;

for (let line of lines) {
  if (line.includes('fr: {')) inFr = true;
  if (line.includes('en: {')) inFr = false;
  if (inFr) {
    const match = line.match(/^\s*'([^']+)'\s*:/);
    if (match) {
      keys.add(match[1]);
    }
  }
}

console.log(`Found ${keys.size} translation keys in fr.`);

// 2. Scan codebase for t('key')
const missingKeys = new Set();
const foundKeys = new Set();

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (let file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const text = fs.readFileSync(fullPath, 'utf8');
      const matches = text.matchAll(/\bt\(\s*'([^']+)'/g);
      for (let match of matches) {
        const key = match[1];
        foundKeys.add(key);
        if (!keys.has(key)) {
          missingKeys.add(key);
        }
      }
    }
  }
}

for (let dir of srcDirs) {
  if (fs.existsSync(dir)) {
    scanDir(dir);
  }
}

console.log(`Found ${foundKeys.size} unique keys used in code.`);
if (missingKeys.size > 0) {
  console.log(`\nFound ${missingKeys.size} missing keys in translations.ts:`);
  for (let key of missingKeys) {
    console.log(key);
  }
} else {
  console.log('\nAll keys used in code are defined in translations.ts!');
}
