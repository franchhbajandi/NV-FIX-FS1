/**
 * Playwright PDF Exporter & PDF Binary Text Verifier for "The Observer's Edition"
 * 1. Exports the static print route (/print) to /dist/Bajandi_FS1_Portfolio.pdf
 *    and copies to /public/Bajandi_FS1_Portfolio.pdf.
 * 2. Extracts text from the generated PDF file (normalizing whitespace, hyphenation,
 *    and ligatures) and confirms every non-pending answer appears verbatim (Requirement 4).
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function normalizePdfText(text) {
  return text
    .replace(/\uFB00/g, 'ff')
    .replace(/\uFB01/g, 'fi')
    .replace(/\uFB02/g, 'fl')
    .replace(/\uFB03/g, 'ffi')
    .replace(/\uFB04/g, 'ffl')
    .replace(/-\s*\r?\n\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactForPdfMatch(text) {
  return normalizePdfText(text)
    .replace(/\s+/g, '')
    .replace(/Skiptomaincontent/gi, '');
}

/**
 * Extracts text from a generated PDF file buffer by decoding FlateDecode streams
 * and resolving Chromium/Skia per-font /ToUnicode CMap tables in pure Node.
 */
async function extractTextFromPdfFile(pdfFilePath) {
  const buffer = fs.readFileSync(pdfFilePath);
  const raw = buffer.toString('latin1');

  const objMap = new Map();
  const objRe = /(\d+)\s+0\s+obj\b([\s\S]*?)endobj/g;
  let m;
  while ((m = objRe.exec(raw)) !== null) {
    objMap.set(Number(m[1]), m[2]);
  }

  function inflateObj(id) {
    const body = objMap.get(id) || '';
    const sm = body.match(/stream\r?\n([\s\S]*?)\r?\nendstream/);
    if (!sm) return '';
    try {
      return zlib.inflateSync(Buffer.from(sm[1], 'latin1')).toString('latin1');
    } catch {
      return sm[1];
    }
  }

  const fontCMap = new Map();
  for (const [id, body] of objMap.entries()) {
    const tm = body.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
    if (tm) {
      const cmapTxt = inflateObj(Number(tm[1]));
      const map = new Map();
      const bfc = cmapTxt.match(/beginbfchar([\s\S]*?)endbfchar/g) || [];
      for (const blk of bfc) {
        const pairRe = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
        let pm;
        while ((pm = pairRe.exec(blk)) !== null) {
          const code = parseInt(pm[1], 16);
          const hex = pm[2];
          let str = '';
          for (let i = 0; i < hex.length; i += 4) {
            str += String.fromCharCode(parseInt(hex.slice(i, i + 4), 16));
          }
          map.set(code, str);
        }
      }
      const bfr = cmapTxt.match(/beginbfrange([\s\S]*?)endbfrange/g) || [];
      for (const blk of bfr) {
        const rngRe = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
        let rm;
        while ((rm = rngRe.exec(blk)) !== null) {
          const start = parseInt(rm[1], 16);
          const end = parseInt(rm[2], 16);
          const base = parseInt(rm[3], 16);
          for (let c = start; c <= end; c++) {
            map.set(c, String.fromCharCode(base + (c - start)));
          }
        }
      }
      fontCMap.set(id, { map, bytes: cmapTxt.includes('<0000>') ? 2 : 1 });
    }
  }

  const out = [];
  for (const [id] of objMap.entries()) {
    const dec = inflateObj(id);
    if (!dec || !dec.includes('BT')) continue;
    let curFont = null;
    const tokRe = /\/F(\d+)\s+[\d.]+\s+Tf|<([0-9A-Fa-f]+)>|\((?:\\.|[^\\()])*\)/g;
    let tm;
    while ((tm = tokRe.exec(dec)) !== null) {
      if (tm[1]) {
        curFont = fontCMap.get(Number(tm[1])) || null;
      } else if (tm[2] && curFont) {
        const hex = tm[2];
        const step = curFont.bytes * 2;
        let s = '';
        for (let i = 0; i < hex.length; i += step) {
          const code = parseInt(hex.slice(i, i + step), 16);
          s += curFont.map.get(code) || '';
        }
        out.push(s);
      } else if (tm[0].startsWith('(') && curFont) {
        const inner = tm[0]
          .slice(1, -1)
          .replace(/\\([0-7]{1,3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\b/g, '\b')
          .replace(/\\f/g, '\f')
          .replace(/\\([()\\])/g, '$1');
        let s = '';
        if (curFont.bytes === 2) {
          for (let i = 0; i < inner.length; i += 2) {
            const code = (inner.charCodeAt(i) << 8) | (inner.charCodeAt(i + 1) || 0);
            s += curFont.map.get(code) || '';
          }
        } else {
          for (let i = 0; i < inner.length; i++) {
            s += curFont.map.get(inner.charCodeAt(i)) || '';
          }
        }
        out.push(s);
      }
    }
  }

  return normalizePdfText(out.join(''));
}

function collectNonPendingAnswers() {
  const statusRegistryPath = path.join(rootDir, 'src/content/status-registry.json');
  const registry = fs.existsSync(statusRegistryPath)
    ? JSON.parse(fs.readFileSync(statusRegistryPath, 'utf8'))
    : { episodes: {}, fields: {} };

  const answers = [];
  for (let i = 1; i <= 6; i++) {
    const num = String(i).padStart(2, '0');
    const epId = `ep-${num}`;
    if (registry.episodes?.[epId] && String(registry.episodes[epId]).toUpperCase() === 'PENDING') {
      continue;
    }
    const epPath = path.join(rootDir, `src/content/episode-${num}.json`);
    if (!fs.existsSync(epPath)) continue;
    const raw = JSON.parse(fs.readFileSync(epPath, 'utf8'));
    const ep = raw.episode || raw;

    const allLists = [
      ...(ep.questions || []),
      ...(ep.classroomQuestions || []),
      ...(ep.reflectSchool || []),
      ...(ep.psychosocialReflect || []),
      ...(ep.activity1?.interviewGuide?.questions || []),
      ...(ep.activity1?.answer?.questions || []),
      ...(ep.activity2?.classObservation?.questions || []),
      ...((ep.activity2?.teacherInterview?.parts || []).flatMap((p) => p.questions || [])),
      ...(ep.activity2?.answer?.questions || []),
    ];

    allLists.forEach((q, idx) => {
      const qId = q.id || `ep-${num}-q-${q.n ?? idx + 1}`;
      const status = registry.fields?.[qId] || q.status;
      if (status && String(status).toUpperCase() === 'PENDING') return;
      if (q.answer && q.answer.trim()) {
        answers.push({ id: qId, answer: normalizePdfText(q.answer) });
      }
    });
  }
  return answers;
}

async function exportPDF() {
  let playwright;
  try {
    const modName = 'playwright';
    playwright = await import(modName);
  } catch {
    try {
      const globalPath = '/root/.bun/install/global/node_modules/playwright/index.mjs';
      playwright = await import(globalPath);
    } catch {
      console.error('\n[Error] Playwright is not installed in dependencies.');
      console.error('To run PDF generation locally:');
      console.error('  npm install -D playwright');
      console.error('  npx playwright install chromium');
      console.error('  npm run pdf\n');
      process.exit(1);
    }
  }

  const { chromium } = playwright;
  const targetUrl = process.env.PRINT_URL || 'http://localhost:3000/print';
  const distDir = path.join(rootDir, 'dist');
  const publicDir = path.join(rootDir, 'public');

  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const distPdfPath = path.join(distDir, 'Bajandi_FS1_Portfolio.pdf');
  const publicPdfPath = path.join(publicDir, 'Bajandi_FS1_Portfolio.pdf');

  console.log(`\n📄 Launching Chromium for A4 Print Edition export...`);
  console.log(`🔗 Navigating to: ${targetUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await page.waitForTimeout(800);

    console.log(`🖨️ Rendering A4 PDF with exact print background and margins...`);
    await page.pdf({
      path: distPdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: {
        top: '12mm',
        bottom: '12mm',
        left: '15mm',
        right: '15mm',
      },
    });

    fs.copyFileSync(distPdfPath, publicPdfPath);

    console.log(`\n🔍 Extracting text from generated PDF (${distPdfPath}) to verify answers...`);
    const extractedPdfText = await extractTextFromPdfFile(distPdfPath);
    const compactExtracted = compactForPdfMatch(extractedPdfText);
    const expectedAnswers = collectNonPendingAnswers();
    const missingAnswers = [];

    for (const item of expectedAnswers) {
      if (!compactExtracted.includes(compactForPdfMatch(item.answer))) {
        missingAnswers.push(item.id);
      }
    }

    if (missingAnswers.length > 0) {
      console.error(
        `❌ PDF text verification failed: ${missingAnswers.length} answer(s) missing from extracted PDF text: ${missingAnswers.join(', ')}`
      );
      process.exit(1);
    }

    console.log(
      `✅ PDF Export & Text Extraction Check successful! All ${expectedAnswers.length} non-pending answers confirmed in Bajandi_FS1_Portfolio.pdf.`
    );
    console.log(`   Dist output:   ${distPdfPath}`);
    console.log(`   Public output: ${publicPdfPath}\n`);
  } catch (error) {
    console.error(`\n❌ PDF export failed:`, error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

exportPDF();
