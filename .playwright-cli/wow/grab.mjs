// Descobre a URL do mp4 do reel e baixa para reel.mp4
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.dirname(fileURLToPath(import.meta.url));
const ID = 'DcBlbZOh5hx';
const URLS = [
  `https://www.instagram.com/p/${ID}/embed/captioned/`,
  `https://www.instagram.com/reel/${ID}/embed/`,
];
const headless = process.argv.includes('--headed') ? false : true;

const browser = await chromium.launch({
  headless,
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const ctx = await browser.newContext({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 2,
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  locale: 'pt-BR',
});
const page = await ctx.newPage();

const videoResponses = [];
page.on('response', (res) => {
  const ct = res.headers()['content-type'] || '';
  const u = res.url();
  if (ct.startsWith('video/') || /\.mp4(\?|$)/.test(u)) {
    videoResponses.push({ url: u, ct, status: res.status(), len: res.headers()['content-length'] });
  }
});

const report = { headless, tries: [] };
let found = null;

for (const url of URLS) {
  const t = { url };
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    t.status = resp?.status();
    await page.waitForTimeout(4000);
    t.title = await page.title();
    t.videoCount = await page.locator('video').count();

    // tenta achar a URL no HTML (video_url dentro do JSON embutido)
    const html = await page.content();
    t.htmlLen = html.length;
    const m = html.match(/\\?"video_url\\?"\s*:\s*\\?"([^"\\]+(?:\\.[^"\\]*)*)/);
    if (m) {
      let v = m[1];
      try {
        v = JSON.parse('"' + v.replace(/\\\\/g, '\\') + '"');
      } catch {}
      v = v.replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/&amp;/g, '&');
      t.videoUrlFromHtml = v;
    }

    if (t.videoCount === 0) {
      // clica na capa / botão de play
      const candidates = [
        '[aria-label*="Play" i]',
        '[aria-label*="Reproduzir" i]',
        '.EmbeddedMediaImage',
        'img.EmbeddedMediaImage',
        '.Content img',
        'a[href*="/reel/"] img',
      ];
      for (const sel of candidates) {
        const loc = page.locator(sel).first();
        if (await loc.count()) {
          try {
            await loc.click({ timeout: 3000 });
            t.clicked = sel;
            await page.waitForTimeout(3000);
            if (await page.locator('video').count()) break;
          } catch (e) {
            t.clickErr = String(e).slice(0, 160);
          }
        }
      }
      t.videoCountAfterClick = await page.locator('video').count();
    }

    if (await page.locator('video').count()) {
      t.video = await page.evaluate(async () => {
        const v = document.querySelector('video');
        try {
          v.muted = true;
          await v.play();
        } catch (e) {}
        await new Promise((r) => setTimeout(r, 2500));
        return {
          currentSrc: v.currentSrc,
          src: v.src,
          poster: v.poster,
          duration: v.duration,
          w: v.videoWidth,
          h: v.videoHeight,
          readyState: v.readyState,
          paused: v.paused,
          sources: [...v.querySelectorAll('source')].map((s) => s.src),
          rect: (() => {
            const r = v.getBoundingClientRect();
            return { w: r.width, h: r.height };
          })(),
        };
      });
    }
    t.posterImgs = await page.evaluate(() =>
      [...document.querySelectorAll('img')]
        .map((i) => ({ src: i.src, w: i.naturalWidth, h: i.naturalHeight, cls: i.className }))
        .filter((i) => i.w >= 300),
    );
  } catch (e) {
    t.error = String(e).slice(0, 300);
  }
  report.tries.push(t);
  const cand =
    t.video?.currentSrc || t.video?.src || t.videoUrlFromHtml || videoResponses.find((v) => v.ct.startsWith('video/'))?.url;
  if (cand && !cand.startsWith('blob:')) {
    found = cand;
    break;
  }
  if (videoResponses.length) {
    found = videoResponses[0].url;
    break;
  }
}

report.videoResponses = videoResponses.slice(0, 10);
report.found = found;

if (found) {
  // remove range params (bytestart/byteend) para baixar o arquivo inteiro
  const u = new URL(found);
  u.searchParams.delete('bytestart');
  u.searchParams.delete('byteend');
  const full = u.toString();
  report.downloadUrl = full;
  try {
    const r = await ctx.request.get(full, {
      headers: { referer: 'https://www.instagram.com/' },
      timeout: 120000,
    });
    report.downloadStatus = r.status();
    const buf = await r.body();
    report.downloadBytes = buf.length;
    if (r.ok() && buf.length > 10000) {
      fs.writeFileSync(path.join(OUT, 'reel.mp4'), buf);
      report.saved = true;
    }
  } catch (e) {
    report.downloadError = String(e).slice(0, 300);
  }
}

await page.screenshot({ path: path.join(OUT, '_embed-page.png') }).catch(() => {});
fs.writeFileSync(path.join(OUT, '_grab-report.json'), JSON.stringify(report, null, 2));
await browser.close();

// resumo curto no stdout
const short = JSON.parse(JSON.stringify(report));
for (const t of short.tries) {
  if (t.posterImgs) t.posterImgs = t.posterImgs.map((p) => ({ ...p, src: p.src.slice(0, 90) }));
  if (t.videoUrlFromHtml) t.videoUrlFromHtml = t.videoUrlFromHtml.slice(0, 120);
  if (t.video) {
    for (const k of ['currentSrc', 'src', 'poster']) if (t.video[k]) t.video[k] = t.video[k].slice(0, 120);
    t.video.sources = (t.video.sources || []).map((s) => s.slice(0, 80));
  }
}
short.videoResponses = short.videoResponses.map((v) => ({ ...v, url: v.url.slice(0, 120) }));
if (short.found) short.found = short.found.slice(0, 120);
if (short.downloadUrl) short.downloadUrl = short.downloadUrl.slice(0, 120);
console.log(JSON.stringify(short, null, 2));
