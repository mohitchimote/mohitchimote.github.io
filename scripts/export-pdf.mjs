// Renders /portfolio from the built site and exports it as a single PDF.
// Requires `npm run build` to have already produced dist/ — this script
// serves that output with `astro preview` and prints it with Playwright,
// so the PDF is generated from the exact same case-study content as the site.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distDir = join(root, 'dist');
const outPath = join(distDir, 'mohit-chimote-portfolio.pdf');
const port = 4322;
const baseUrl = `http://localhost:${port}`;

if (!existsSync(distDir)) {
  console.error('dist/ not found — run `npm run build` before `npm run export-pdf`.');
  process.exit(1);
}

function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const controller = new AbortController();
        const abortTimer = setTimeout(() => controller.abort(), 2000);
        try {
          const res = await fetch(url, { signal: controller.signal });
          if (res.ok) return resolve();
        } finally {
          clearTimeout(abortTimer);
        }
      } catch {
        // not up yet, or this attempt timed out — retry below
      }
      if (Date.now() - start > timeoutMs) return reject(new Error(`Timed out waiting for ${url}`));
      setTimeout(attempt, 300);
    };
    attempt();
  });
}

const preview = spawn('npx', ['astro', 'preview', '--port', String(port)], {
  cwd: root,
  stdio: 'pipe',
});

let previewOutput = '';
preview.stdout.on('data', (d) => { previewOutput += d.toString(); });
preview.stderr.on('data', (d) => { previewOutput += d.toString(); });

const cleanup = () => {
  preview.kill();
};

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms: ${label}`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

try {
  await withTimeout(waitForServer(`${baseUrl}/portfolio`), 25000, 'waitForServer()');

  // --no-sandbox is required in containerized CI runners (e.g. GitHub Actions),
  // where Chromium's sandbox can't initialize and would otherwise hang silently.
  const browser = await withTimeout(
    chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] }),
    30000,
    'chromium.launch()'
  );
  const page = await browser.newPage();
  await withTimeout(
    page.goto(`${baseUrl}/portfolio`, { waitUntil: 'load', timeout: 30000 }),
    35000,
    'page.goto(/portfolio)'
  );
  await page.emulateMedia({ media: 'print' });

  mkdirSync(dirname(outPath), { recursive: true });
  await withTimeout(
    page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
    }),
    30000,
    'page.pdf()'
  );

  await browser.close();
  console.log(`✓ Exported ${outPath}`);
} catch (err) {
  console.error('PDF export failed:', err.message);
  console.error('--- astro preview output ---');
  console.error(previewOutput);
  process.exitCode = 1;
} finally {
  cleanup();
}

// Force-exit: npx's process tree (it can spawn astro as a grandchild) doesn't
// always die cleanly from preview.kill() in containerized CI, which would
// otherwise leave an open stdio handle keeping this script alive indefinitely
// even after everything above has actually finished.
process.exit(process.exitCode ?? 0);
