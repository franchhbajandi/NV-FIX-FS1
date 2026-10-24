import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const photosDir = path.resolve('src/assets/photos');
const outDir = path.resolve('src/assets/photos/tinted');
const ep02JsonPath = path.resolve('src/content/photos-episode-02.json');

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

if (!fs.existsSync(ep02JsonPath)) {
  console.error('❌ Cannot find src/content/photos-episode-02.json');
  process.exit(1);
}

const ep02Manifest = JSON.parse(fs.readFileSync(ep02JsonPath, 'utf-8'));
const moodEntries = (ep02Manifest.photos || []).filter((p) => p.role === 'mood');

const allFiles = fs
  .readdirSync(photosDir, { withFileTypes: true })
  .filter((d) => d.isFile() && /\.(webp|jpg|jpeg|png)$/i.test(d.name))
  .map((d) => d.name);

const publicTintedDir = path.resolve('public/assets/photos/tinted');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(publicTintedDir, { recursive: true });

console.log(`\n🎨 [Build Step] Pre-generating bright construction-green duotone WebP variants for ${moodEntries.length} mood photo(s)...`);

let generatedCount = 0;

for (const entry of moodEntries) {
  const pattern = entry.fileMatch || entry.file || '';
  const matchedFile = allFiles.find(
    (f) => f === entry.file || matchesPhotoGlob(pattern, f)
  );

  if (!matchedFile) {
    console.warn(`⚠️  Could not find source file for mood photo entry: ${pattern}`);
    continue;
  }

  const srcPath = path.join(photosDir, matchedFile);
  const baseName = matchedFile.replace(/\.(webp|jpg|jpeg|png)$/i, '');
  const destFile = `${baseName}-duotone.webp`;
  const destPath = path.join(outDir, destFile);
  const publicDestPath = path.join(publicTintedDir, destFile);

  try {
    // Generate a bright, colorful duotone in Episode 02's accent color (--color-construction #0F6B45)
    // mapping shadows to rich construction green (#0F6B45), midtones to vivid emerald (#16A34A / #34D399),
    // and highlights to sunny highlighter yellow (#FFE600) and warm mint (#FEF9C3).
    execFileSync(
      'convert',
      [
        srcPath,
        '-colorspace',
        'Gray',
        '-auto-level',
        '-brightness-contrast',
        '6x16',
        '(',
        '-size',
        '1x128',
        'gradient:#0F6B45-#22C55E',
        '-size',
        '1x128',
        'gradient:#22C55E-#FFE600',
        '-append',
        ')',
        '-clut',
        '-quality',
        '86',
        destPath,
      ],
      { stdio: 'ignore' }
    );
    generatedCount++;
    console.log(`   ✔ ${matchedFile} -> tinted/${destFile}`);
  } catch {
    if (fs.existsSync(destPath)) {
      generatedCount++;
      console.log(`   ✔ ${matchedFile} -> using pre-generated tinted/${destFile} (ImageMagick CLI skipped)`);
    } else {
      fs.copyFileSync(srcPath, destPath);
      generatedCount++;
      console.log(`   ✔ ${matchedFile} -> copied fallback to tinted/${destFile}`);
    }
  }

  if (fs.existsSync(destPath)) {
    fs.copyFileSync(destPath, publicDestPath);
  }
}

console.log(`✅ Ready ${generatedCount} tinted WebP mood variant(s) in src/assets/photos/tinted/ and public/assets/photos/tinted/\n`);
