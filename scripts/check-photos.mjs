import fs from 'node:fs';
import path from 'node:path';

const photosDir = path.resolve('src/assets/photos');
const jsonPath = path.join(photosDir, 'photos.json');
const ep02JsonPath = path.resolve('src/content/photos-episode-02.json');

console.log('\n🔍 [Build Step] Checking photo assets, photos.json, and photos-episode-02.json...');

function isIgnoredPhotoFile(fileName) {
  const base = (fileName.split('/').pop() || fileName).trim();
  if (base.toLowerCase() === 'ep-02-wall-displays.jpg') return true;
  if (/^Screenshot_/i.test(base)) return true;
  return false;
}

function matchesPhotoGlob(pattern, fileName) {
  if (!pattern || !fileName) return false;
  const cleanFile = (fileName.split('/').pop() || fileName).trim();
  const cleanPattern = pattern.trim();
  if (cleanPattern.toLowerCase() === cleanFile.toLowerCase()) return true;
  if (cleanPattern.includes('*') || cleanPattern.includes('?')) {
    const escaped = cleanPattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${escaped}$`, 'i');
    return regex.test(cleanFile);
  }
  return false;
}

let metadata = {};
if (fs.existsSync(jsonPath)) {
  try {
    metadata = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  } catch (err) {
    console.error('❌ Error parsing photos.json:', err.message);
  }
}

let ep02Photos = [];
if (fs.existsSync(ep02JsonPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(ep02JsonPath, 'utf-8'));
    if (Array.isArray(raw.photos)) {
      ep02Photos = raw.photos.filter(
        (p) => !isIgnoredPhotoFile(p.file || p.fileMatch || '')
      );
    }
  } catch (err) {
    console.error('❌ Error parsing photos-episode-02.json:', err.message);
  }
}

// Warn on needsFaceCheck (never blocks build)
const faceCheckItems = ep02Photos.filter((p) => p.needsFaceCheck);
if (faceCheckItems.length > 0) {
  console.warn(
    `⚠️  [needsFaceCheck] ${faceCheckItems.length} photo(s) in photos-episode-02.json are marked needsFaceCheck: true (warning only, never blocks build):`
  );
  for (const item of faceCheckItems) {
    const label = item.file || item.fileMatch || item.id;
    const matchInfo = item.fileMatch ? ` [glob: ${item.fileMatch}]` : '';
    console.warn(`    - ${label}${matchInfo} (role: ${item.role || 'photo'})`);
  }
}

if (!fs.existsSync(photosDir)) {
  process.exit(0);
}

const publicPhotosDir = path.resolve('public/assets/photos');
const srcBrandDir = path.resolve('src/assets/brand');
const publicBrandDir = path.resolve('public/assets/brand');

fs.mkdirSync(publicPhotosDir, { recursive: true });
fs.mkdirSync(publicBrandDir, { recursive: true });

if (fs.existsSync(srcBrandDir)) {
  for (const brandFile of fs.readdirSync(srcBrandDir)) {
    if (/\.(jpg|jpeg|png|webp|avif|svg)$/i.test(brandFile)) {
      fs.copyFileSync(
        path.join(srcBrandDir, brandFile),
        path.join(publicBrandDir, brandFile)
      );
    }
  }
}

const files = fs.readdirSync(photosDir);
const missingEntries = [];
let discoveredCount = 0;

for (const file of files) {
  if (file.endsWith('.json') || file.startsWith('.')) continue;
  if (isIgnoredPhotoFile(file)) continue;

  const isImage = /\.(jpg|jpeg|png|webp|avif|svg)$/i.test(file);
  if (!isImage) continue;

  discoveredCount++;
  fs.copyFileSync(
    path.join(photosDir, file),
    path.join(publicPhotosDir, file)
  );

  const baseNoExt = file.replace(/\.(jpg|jpeg|png|webp|avif|svg)$/i, '');
  const hasMetaInPhotosJson = Boolean(metadata[baseNoExt]);
  const hasMetaInEp02 = ep02Photos.some(
    (p) =>
      p.file === file ||
      p.fileMatch === file ||
      p.id === baseNoExt ||
      matchesPhotoGlob(p.fileMatch || p.file || '', file)
  );

  if (!hasMetaInPhotosJson && !hasMetaInEp02) {
    missingEntries.push(file);
  }
}

if (missingEntries.length > 0) {
  console.warn(
    `\n⚠️  BUILD WARNING: The following ${missingEntries.length} photo(s) are missing metadata entries in photos.json / photos-episode-02.json:`
  );
  for (const f of missingEntries) {
    console.warn(`    - ${f}`);
  }
} else {
  console.log(
    `✅ Photo metadata audit passed (${discoveredCount} binary photo files matched & mirrored to public/assets/; ${ep02Photos.length} Episode 02 manifest entries loaded).\n`
  );
}
