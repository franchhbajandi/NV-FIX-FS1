import React, { useMemo } from 'react';
import photosMetadata from '../assets/photos/photos.json';
import { PhotoFrame } from './PhotoFrame';
import {
  shouldHidePending,
  isStatusPending,
  rawEpisode02Photos,
  IGNORED_METADATA_KEYS,
  isIgnoredPhotoFile,
  matchesPhotoGlob,
} from '../data/contentIntake';

// Auto-discover all photo assets in src/assets/photos/ when running under Vite
let photoModules: Record<string, { default: string }> = {};
try {
  photoModules = import.meta.glob(
    '../assets/photos/*.{jpg,jpeg,png,webp,avif,svg}',
    { eager: true }
  ) as Record<string, { default: string }>;
} catch {
  photoModules = {};
}

export interface PhotoRecord {
  filePath?: string;
  fileName?: string;
  file: string;
  fileMatch: string;
  cleanKey: string;
  episodeNum: string; // '01' through '06'
  indexNum: string;
  slug: string;
  src?: string;
  caption: string;
  alt: string;
  credit?: string;
  role?: string;
  needsFaceCheck?: boolean;
  status?: string;
}

const discoveredMap = new Map<string, PhotoRecord>();
const fileMatchMap = new Map<string, PhotoRecord>();
const globRecords: PhotoRecord[] = [];

// Matches both ep02-01-slug, ep2-01-slug, and ep-02-library-01.webp
const keyRegex = /^ep-?0?([1-6])-(?:(\d{2})-)?([a-z0-9-]+?)(?:-(\d{2}))?(?:\.(jpg|jpeg|png|webp|avif|svg))?$/i;

function parsePhotoIdentifier(rawIdOrFile: string): {
  episodeNum: string;
  indexNum: string;
  slug: string;
  cleanKey: string;
} | null {
  const m = rawIdOrFile.match(keyRegex);
  if (!m) return null;
  const episodeNum = m[1].padStart(2, '0');
  const indexNum = m[2] || m[4] || '01';
  const slug = m[3];
  const baseNoExt = rawIdOrFile.replace(/\.(jpg|jpeg|png|webp|avif|svg)$/i, '');
  return {
    episodeNum,
    indexNum,
    slug,
    cleanKey: baseNoExt,
  };
}

// 1. Seed entries from src/assets/photos/photos.json
for (const [rawKey, meta] of Object.entries(
  photosMetadata as Record<
    string,
    { status?: string; alt?: string; caption?: string; credit?: string; role?: string; needsFaceCheck?: boolean; fileMatch?: string }
  >
)) {
  if (IGNORED_METADATA_KEYS.has(rawKey)) continue;
  const parsed = parsePhotoIdentifier(rawKey);
  if (!parsed) continue;
  const caption = meta.caption !== undefined ? meta.caption : '';
  const alt = meta.alt || caption;
  const fileMatch = meta.fileMatch || `${rawKey}.webp`;
  if (isIgnoredPhotoFile(fileMatch)) continue;

  const rec: PhotoRecord = {
    file: fileMatch,
    fileMatch,
    cleanKey: rawKey,
    episodeNum: parsed.episodeNum,
    indexNum: parsed.indexNum,
    slug: parsed.slug,
    caption,
    alt,
    credit: meta.credit,
    role: meta.role,
    needsFaceCheck: Boolean(meta.needsFaceCheck),
    status: meta.status,
  };
  discoveredMap.set(rawKey, rec);
  fileMatchMap.set(fileMatch, rec);
  fileMatchMap.set(rawKey, rec);
}

// 2. Seed entries from photos-episode-02.json (supports file, glob fileMatch, role, needsFaceCheck)
for (const item of rawEpisode02Photos) {
  const rawFile = item.file || item.fileMatch || item.id || '';
  if (!rawFile || isIgnoredPhotoFile(rawFile)) continue;

  const pattern = item.fileMatch || rawFile;
  const parsed = parsePhotoIdentifier(rawFile) || {
    episodeNum: '02',
    indexNum: '01',
    slug: rawFile.replace(/\.(jpg|jpeg|png|webp|avif|svg)$/i, ''),
    cleanKey: rawFile
      .replace(/\.(jpg|jpeg|png|webp|avif|svg)$/i, '')
      .replace(/[^a-zA-Z0-9_-]/g, '-'),
  };
  const cleanKey = item.id || parsed.cleanKey;
  const fallbackFileName =
    rawFile.includes('*') || rawFile.includes('?') || rawFile.includes('…')
      ? 'misc-schoolhallway-zoomed-on-nosmokingsign.webp'
      : rawFile;
  const rec: PhotoRecord = {
    file: rawFile,
    fileMatch: pattern,
    cleanKey,
    episodeNum: '02',
    indexNum: parsed.indexNum,
    slug: parsed.slug,
    src: `/assets/photos/${fallbackFileName}`,
    caption: item.caption || '',
    alt: item.alt || item.caption || '',
    credit: item.credit,
    role: item.role,
    needsFaceCheck: Boolean(item.needsFaceCheck),
    status: item.status,
  };
  discoveredMap.set(cleanKey, rec);
  fileMatchMap.set(rawFile, rec);
  fileMatchMap.set(pattern, rec);
  fileMatchMap.set(cleanKey, rec);
  if (pattern.includes('*') || pattern.includes('?')) {
    globRecords.push(rec);
  }
}

// 3. Attach discovered binary/vector image files from src/assets/photos/
for (const [modPath, mod] of Object.entries(photoModules)) {
  const fileName = modPath.split('/').pop() || '';
  if (fileName.endsWith('.json') || fileName.startsWith('.')) continue;
  if (isIgnoredPhotoFile(fileName)) continue;

  const baseNoExt = fileName.replace(/\.(jpg|jpeg|png|webp|avif|svg)$/i, '');
  let existing =
    fileMatchMap.get(fileName) ||
    discoveredMap.get(baseNoExt) ||
    globRecords.find((g) => matchesPhotoGlob(g.fileMatch, fileName));

  if (existing) {
    existing.filePath = modPath;
    existing.fileName = fileName;
    existing.src = mod.default;
    fileMatchMap.set(fileName, existing);
    fileMatchMap.set(baseNoExt, existing);
  } else {
    const parsed = parsePhotoIdentifier(fileName);
    if (parsed) {
      const rec: PhotoRecord = {
        filePath: modPath,
        fileName,
        file: fileName,
        fileMatch: fileName,
        cleanKey: parsed.cleanKey,
        episodeNum: parsed.episodeNum,
        indexNum: parsed.indexNum,
        slug: parsed.slug,
        src: mod.default,
        caption: '',
        alt: `Observation documentation for Episode ${parsed.episodeNum}`,
      };
      discoveredMap.set(parsed.cleanKey, rec);
      fileMatchMap.set(fileName, rec);
    }
  }
}

export function getPhotoByFileMatch(fileMatchOrKey: string): PhotoRecord | undefined {
  if (!fileMatchOrKey || isIgnoredPhotoFile(fileMatchOrKey)) return undefined;
  const direct =
    fileMatchMap.get(fileMatchOrKey) ||
    discoveredMap.get(fileMatchOrKey.replace(/\.(jpg|jpeg|png|webp|avif|svg)$/i, ''));
  if (direct) return direct;

  return Array.from(discoveredMap.values()).find(
    (rec) =>
      matchesPhotoGlob(rec.fileMatch, fileMatchOrKey) ||
      matchesPhotoGlob(fileMatchOrKey, rec.fileName || rec.file)
  );
}

export function getPhotosForEpisode(episodeNumber: string, roleFilter?: string): PhotoRecord[] {
  const padded = episodeNumber.padStart(2, '0');
  const hidePending = shouldHidePending();
  return Array.from(discoveredMap.values()).filter((p) => {
    if (p.episodeNum !== padded) return false;
    if (roleFilter && p.role !== roleFilter) return false;
    const verifyId = `photo-${p.cleanKey}-caption`;
    if (hidePending && isStatusPending(p.status, `photos.${p.cleanKey}`, verifyId)) return false;
    return true;
  });
}

export interface AutoPhotoFrameProps {
  photo?: PhotoRecord;
  assetKey?: string;
  verifyIdOverride?: string;
  treatment?: 'none' | 'duotone' | 'halftone';
  shape?: 'index-card' | 'sticky' | 'plain';
  tilt?: boolean;
  captionOverride?: string;
  className?: string;
}

export const AutoPhotoFrame: React.FC<AutoPhotoFrameProps> = ({
  photo,
  assetKey,
  verifyIdOverride,
  treatment = 'halftone',
  shape = 'index-card',
  tilt = false,
  captionOverride,
  className = '',
}) => {
  const hidePending = shouldHidePending();

  const record = useMemo(() => {
    if (photo) return photo;
    if (!assetKey) return null;
    return getPhotoByFileMatch(assetKey) || null;
  }, [photo, assetKey]);

  if (!record) {
    if (hidePending && !verifyIdOverride) return null;
    return (
      <PhotoFrame
        caption={captionOverride !== undefined ? captionOverride : ''}
        alt={captionOverride || `Classroom documentation slot for ${assetKey || 'episode'}`}
        verifyId={verifyIdOverride}
        treatment={treatment}
        shape={shape}
        tilt={tilt}
        assetSlotLabel={assetKey}
        className={className}
      />
    );
  }

  const verifyId = verifyIdOverride !== undefined ? verifyIdOverride : `photo-${record.cleanKey}-caption`;
  if (hidePending && verifyId && isStatusPending(record.status, `photos.${record.cleanKey}`, verifyId)) {
    return null;
  }

  const finalCaption = captionOverride !== undefined ? captionOverride : record.caption;

  return (
    <PhotoFrame
      src={record.src}
      alt={record.alt}
      caption={finalCaption}
      credit={record.credit}
      role={record.role}
      needsFaceCheck={record.needsFaceCheck}
      verifyId={verifyId}
      treatment={treatment}
      shape={shape}
      tilt={tilt}
      assetSlotLabel={record.fileName || record.file || record.fileMatch || record.cleanKey}
      className={className}
    />
  );
};
