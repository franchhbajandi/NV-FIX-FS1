/**
 * Playwright Live Runtime DOM Verifier (Requirement 3 & 4)
 * Waits for document.documentElement.getAttribute('data-verify-ready') === 'true'
 * after animations settle, then compares ONLY rendered element.textContent
 * of every [data-verify-id] node against the source JSON.
 */

import { buildExpectedRecords } from './verify-content';
import { normalizeVerbatimText, countWords } from '../src/data/contentIntake';
import crypto from 'node:crypto';

function sha256Short(text) {
  return crypto
    .createHash('sha256')
    .update(normalizeVerbatimText(text), 'utf8')
    .digest('hex')
    .slice(0, 16);
}

async function runLiveCheck() {
  let playwright;
  try {
    const modName = 'playwright';
    playwright = await import(modName);
  } catch {
    try {
      const globalPath = '/root/.bun/install/global/node_modules/playwright/index.mjs';
      playwright = await import(globalPath);
    } catch {
      console.log(
        'ℹ️ [verify-live-dom] Playwright is not installed in this environment. Install playwright (`npm i -D playwright`) to run live browser DOM verification.'
      );
      process.exit(0);
    }
  }

  const baseUrl = process.env.VERIFY_URL || 'http://localhost:3000';
  const expectedRecords = buildExpectedRecords();

  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    for (const route of ['/', '/print']) {
      const url = `${baseUrl}${route}`;
      console.log(`🔗 [verify-live-dom] Inspecting live route: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForSelector('html[data-verify-ready="true"]', { timeout: 10000 });

      // Assert data-verify-source is used ONLY inside aria-hidden="true" decorative layers
      const illegalSources = await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll('[data-verify-source]'));
        return nodes
          .filter((el) => !el.closest('[aria-hidden="true"]') || el.hasAttribute('data-verify-id'))
          .map((el) => el.outerHTML.slice(0, 100));
      });

      if (illegalSources.length > 0) {
        console.error(
          `❌ [verify-live-dom] Illegal data-verify-source outside aria-hidden="true" on ${route}:`,
          illegalSources
        );
        process.exit(1);
      }

      // Compare ONLY element.textContent for every expected record
      const liveTextMap = await page.evaluate(() => {
        const out = {};
        document.querySelectorAll('[data-verify-id]').forEach((el) => {
          const id = el.getAttribute('data-verify-id');
          if (id) {
            out[id] = el.textContent || '';
          }
        });
        return out;
      });

      for (const rec of expectedRecords) {
        const actualRaw = liveTextMap[rec.id];
        if (actualRaw === undefined) {
          console.error(`❌ [verify-live-dom] Missing [data-verify-id="${rec.id}"] on ${route}`);
          process.exit(1);
        }
        const normExpected = normalizeVerbatimText(rec.sourceText);
        const normActual = normalizeVerbatimText(actualRaw);
        if (
          countWords(normExpected) !== countWords(normActual) ||
          sha256Short(normExpected) !== sha256Short(normActual)
        ) {
          console.error(
            `❌ [verify-live-dom] Live textContent mismatch on ${route} for ${rec.id}:\n` +
              `   Expected: "${normExpected}"\n` +
              `   Got:      "${normActual}"`
          );
          process.exit(1);
        }
      }
    }

    console.log(
      `✅ [verify-live-dom] All ${expectedRecords.length} [data-verify-id] nodes matched exact source textContent on live / and /print routes!`
    );
  } finally {
    await browser.close();
  }
}

runLiveCheck();
