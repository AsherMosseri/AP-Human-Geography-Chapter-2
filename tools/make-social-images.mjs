// Renders the link-preview images (Open Graph, 1200x630) and the site icons.
//
//   NODE_PATH=$(npm root -g) node tools/make-social-images.mjs
//
// Writes og.png, og-<subject>.png and icon PNGs to the repo root, then
// `python3 tools/make-favicon.py` packs favicon.ico. Link-preview scrapers cache images hard, so a
// redesigned image needs a NEW filename (og-2.png), not a re-upload under the same name.
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; font-family: "Liberation Sans", Helvetica, Arial, sans-serif;
         background: #0d1117; color: #e6edf3; }
  .wrap { position: absolute; inset: 0; padding: 72px 80px; display: flex; flex-direction: column; }
  .kicker { font-size: 26px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #4493f8; }
  h1 { font-size: 84px; line-height: 1.04; font-weight: 700; margin-top: 22px; letter-spacing: -1px; max-width: 640px; }
  p { font-size: 32px; line-height: 1.35; color: #9198a1; margin-top: 26px; max-width: 640px; }
  .chips { display: flex; gap: 14px; margin-top: auto; }
  .chip { font-size: 26px; padding: 10px 20px; border-radius: 999px; border: 2px solid #30363d; color: #e6edf3; }
  .chip.on { background: #1f6feb; border-color: #1f6feb; }
  .chip.soon { color: #9198a1; }
  .url { position: absolute; right: 80px; bottom: 80px; font-size: 24px; color: #9198a1; }
  .art { position: absolute; right: 80px; top: 92px; width: 330px; }
  .bar { height: 30px; border-radius: 0 6px 6px 0; margin-bottom: 14px; }
  .b1 { background: #3987e5; } .b2 { background: #d95926; }
  .pyr .row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 7px; }
  .pyr .m { justify-self: end; height: 20px; background: #3987e5; border-radius: 4px 0 0 4px; }
  .pyr .f { height: 20px; background: #d95926; border-radius: 0 4px 4px 0; }
`;

// Decorative motifs drawn from scratch: a bar chart for the home image, a pyramid for Human Geography.
const bars = [[92, 'b1'], [70, 'b2'], [100, 'b1'], [54, 'b2'], [80, 'b1'], [38, 'b2']]
  .map(([w, c]) => `<div class="bar ${c}" style="width:${w}%"></div>`).join('');
const pyramid = [8, 14, 22, 32, 42, 54, 66, 78, 90, 100]
  .map(w => `<div class="row"><span class="m" style="width:${w}%"></span><span class="f" style="width:${w * 0.97}%"></span></div>`).join('');

const IMAGES = [
  { file: 'og.png', html: `
    <div class="wrap">
      <div class="kicker">Study Guides</div>
      <h1>Learn the reading, not just the words</h1>
      <p>Tap any term, chart or figure to go deeper.</p>
      <div class="chips"><span class="chip on">AP Human Geography</span><span class="chip soon">Biology · soon</span></div>
    </div>
    <div class="art">${bars}</div>
    <div class="url">study.thejunkdrawerapp.com</div>` },
  { file: 'og-human-geo.png', html: `
    <div class="wrap">
      <div class="kicker">Study Guides</div>
      <h1>AP Human Geography</h1>
      <p>Reading quizzes and chapter tests, with charts built from the book's data.</p>
      <div class="chips"><span class="chip on">Quizzes</span><span class="chip">Tests</span></div>
    </div>
    <div class="art pyr">${pyramid}</div>
    <div class="url">study.thejunkdrawerapp.com</div>` },
];

// Icon: rounded blue tile with a white "SG" monogram.
const ICON_HTML = size => `<!doctype html><html><head><style>
  * { margin: 0; } body { width: ${size}px; height: ${size}px; background: transparent; }
  .t { width: ${size}px; height: ${size}px; border-radius: ${Math.round(size * 0.22)}px; background: #1f6feb;
       display: grid; place-items: center; font-family: "Liberation Sans", Arial, sans-serif; font-weight: 700;
       color: #fff; font-size: ${Math.round(size * 0.46)}px; letter-spacing: ${(-size * 0.02).toFixed(1)}px; }
</style></head><body><div class="t">SG</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const img of IMAGES) {
  await page.setContent(`<!doctype html><html><head><style>${BASE_CSS}</style></head><body>${img.html}</body></html>`);
  await page.screenshot({ path: path.join(ROOT, img.file) });
  console.log('wrote', img.file);
}
// apple-touch-icon must be opaque (iOS fills transparency with black), so it gets a full-bleed tile.
for (const [file, size, opaque] of [['apple-touch-icon.png', 180, true], ['favicon-192.png', 192, false], ['favicon-32.png', 32, false],
                                    ['tools/.icon-48.png', 48, false], ['tools/.icon-16.png', 16, false]]) {
  await page.setViewportSize({ width: size, height: size });
  let html = ICON_HTML(size);
  if (opaque) html = html.replace('border-radius:', 'border-radius: 0; --r:');
  await page.setContent(html);
  await page.screenshot({ path: path.join(ROOT, file), omitBackground: !opaque });
  console.log('wrote', file);
}
await browser.close();
