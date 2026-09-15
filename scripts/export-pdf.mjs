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
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch {
        // server not up yet
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

try {
  await waitForServer(`${baseUrl}/portfolio`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/portfolio`, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });

  mkdirSync(dirname(outPath), { recursive: true });
  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
  });

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
