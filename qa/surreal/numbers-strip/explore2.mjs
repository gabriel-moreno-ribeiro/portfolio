// Students cell, round 2: two directions rendered side by side. node qa/surreal/numbers-strip/explore2.mjs
import { chromium } from 'playwright';
const OUT = new URL('./', import.meta.url).pathname;
const f = (n) => Math.round(n * 10) / 10;
const rand = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };

// One child, feet at (x, y), scale s, hair variant v. Returns path pieces by paint.
function kid(x, y, s, v, pack, o) {
  const X = (d) => f(x + d * s), Y = (d) => f(y - d * s);
  const cy = Y(19.6), r = f(3.2 * s);
  o.line += `M${X(-1.4)} ${f(y)}V${Y(6)}M${X(1.4)} ${f(y)}V${Y(6)}M${X(-3)} ${Y(15)}L${X(-4.3)} ${Y(9.5)}M${X(3)} ${Y(15)}L${X(4.3)} ${Y(9.5)}`;
  o.muted += v % 2 ? `M${X(-2.6)} ${Y(9)}L${X(-3.8)} ${Y(4.6)}H${X(3.8)}L${X(2.6)} ${Y(9)}z` : `M${X(-2.8)} ${Y(9)}V${Y(5)}H${X(2.8)}V${Y(9)}z`;
  o.paper += `M${X(-3)} ${Y(9)}V${Y(14.4)}Q${X(-3)} ${Y(16)} ${X(-1.4)} ${Y(16)}H${X(1.4)}Q${X(3)} ${Y(16)} ${X(3)} ${Y(14.4)}V${Y(9)}z`;
  o.paper += `M${X(-3.2)} ${cy}a${r} ${r} 0 1 0 ${f(6.4 * s)} 0a${r} ${r} 0 1 0 ${f(-6.4 * s)} 0z`;
  const cap = `M${X(-3.4)} ${f(cy + 0.4 * s)}a${f(3.4 * s)} ${f(3.4 * s)} 0 0 1 ${f(6.8 * s)} 0q${f(-3.4 * s)} ${f(-2 * s)} ${f(-6.8 * s)} 0z`;
  const h = v % 5;
  if (h === 1) o.back += `M${X(-4.6)} ${f(cy - 0.8 * s)}a${f(4.6 * s)} ${f(4.6 * s)} 0 1 0 ${f(9.2 * s)} 0a${f(4.6 * s)} ${f(4.6 * s)} 0 1 0 ${f(-9.2 * s)} 0z`;
  else o.front += cap;
  if (h === 2) o.back += `M${X(2.4)} ${f(cy - 1.4 * s)}q${f(3.6 * s)} ${f(0.4 * s)} ${f(2.4 * s)} ${f(5 * s)}q${f(-1.8 * s)} ${f(-1.6 * s)} ${f(-2.4 * s)} ${f(-5 * s)}z`;
  if (h === 3) o.front += `M${X(-1.6)} ${f(cy - 4 * s)}a${f(1.6 * s)} ${f(1.6 * s)} 0 1 0 ${f(3.2 * s)} 0a${f(1.6 * s)} ${f(1.6 * s)} 0 1 0 ${f(-3.2 * s)} 0z`;
  if (h === 4) o.back += `M${X(-3.8)} ${f(cy - 1 * s)}V${f(cy + 4.4 * s)}H${X(3.8)}V${f(cy - 1 * s)}z`;
  if (pack) o.pack += `M${X(-4.4)} ${Y(15.2)}h${f(2 * s)}v${f(6 * s)}h${f(-2 * s)}z`;
}
const crowd = (list, seed) => {
  const o = { line: '', muted: '', paper: '', back: '', front: '', pack: '' };
  list.forEach(([x, y, s], k) => kid(x, y, s, Math.floor(rand(seed + k) * 5) + k, rand(seed * 3 + k) < 0.3, o));
  return `<path class="pack" d="${o.pack}"/><path class="ink" d="${o.back}"/><path class="thin" d="${o.line}"/><path class="muted" d="${o.muted}"/><path class="paper" d="${o.paper}"/><path class="ink" d="${o.front}"/>`;
};

// ── B: one public school, with the kit on a desk ───────────────────────────
function sceneB() {
  const win = (x) => `<rect class="paper" x="${x}" y="120" width="22" height="19" rx="1"/><path class="thin" d="M${x + 5.5} 120v19M${x + 11} 120v19M${x + 16.5} 120v19M${x} 129.5h22"/>`;
  const cobogo = Array.from({ length: 12 }, (_, k) => `M${f(408 + (k % 4) * 6 + 2.2)} ${f(122 + Math.floor(k / 4) * 6)}a2.2 2.2 0 1 0 -4.4 0a2.2 2.2 0 1 0 4.4 0`).join('');
  const behind = [[222, 188, 1.12], [240, 189, 1.1], [262, 188, 1.14], [284, 189, 1.1]];
  const sides = [[196, 199, 1.26], [334, 199, 1.24]];
  const queue = Array.from({ length: 11 }, (_, k) => [366 + k * 20 + rand(k) * 4, 197 + rand(k + 9) * 3, 1.18 + rand(k + 4) * .1]);
  const tree = [[40, 198, 1.2], [64, 199, 1.14], [88, 197, 1.26], [112, 199, 1.18], [140, 198, 1.22]];
  return `<svg viewBox="0 58 590 146" class="scene">
  <path class="ground" d="M0 170H590"/>
  <path class="thin" d="M500 74q4-4 8 0q4-4 8 0M528 84q3-3 6 0q3-3 6 0"/>
  <ellipse class="shade" cx="90" cy="198" rx="62" ry="5"/>
  <g transform="translate(0 -6)">
  <path class="line" d="M84 176c2-16-1-30 3-44M94 176c-1-16 2-28-2-44M88 150l-12-12M91 146l12-10"/>
  <path class="leaf" d="M38 112c-8-18 8-36 26-32c4-17 30-22 42-9c16-6 34 6 30 23c13 8 8 30-8 31c-5 13-25 14-33 6c-11 8-31 5-35-6c-15 1-27-6-22-13z"/>
  <path class="orange" d="M58 116a3 4 0 1 0 0.1 0zM104 122a3 4 0 1 0 0.1 0zM118 102a3 4 0 1 0 0.1 0zM70 94a3 4 0 1 0 0.1 0zM90 110a3 4 0 1 0 0.1 0z"/>
  <path class="paper" d="M150 176V110H440V176"/>
  <path class="band" d="M150 150H440V176H150z"/>
  <path class="line" d="M150 150H440"/>
  <path class="paper" d="M142 111L160 94H430L448 111z"/>
  <path class="thin" d="M152 102.5H438"/>
  ${[166, 198, 230, 330, 362].map(win).join('')}
  <path class="thin" d="${cobogo}"/>
  <rect class="paper" x="276" y="104" width="38" height="72"/>
  <path class="paper" d="M270 106L295 88L320 106z"/>
  <rect class="band2" x="281" y="111" width="28" height="7" rx="1"/>
  <rect class="paper" x="283" y="132" width="24" height="44"/>
  <path class="thin" d="M295 132v44M287 132v44M291 132v44M299 132v44M303 132v44"/>
  <path class="line" d="M456 176V86"/><path class="orange" d="M456 86h14l-3 5 3 5h-14z"/>
  </g>
  <g class="kids">${crowd(tree, 13)}</g>
  <g class="kids">${crowd(behind, 1)}</g>
  <path class="paper" d="M204 177H322V181H204z"/><path class="line" d="M210 181V199M316 181V199"/>
  <path class="paper" d="M220 164H258V177H220z"/>
  <path class="paper" d="M220 164L213 151H251L258 164z"/>
  <path class="orange" d="M225 168h10v5h-10zM239 168h14v5h-14z"/>
  <path class="line" d="M260 164L314 176"/><path class="thin" d="M309 175v-4"/>
  <circle class="orange ball" cx="310" cy="172.6" r="3"/>
  <g class="kids">${crowd(sides, 7)}</g>
  <g class="kids">${crowd(queue, 21)}</g>
</svg>`;
}

// ── A: a contact sheet of 28 façades, Bahia then Ceará ─────────────────────
function sceneA() {
  let out = '';
  for (let k = 0; k < 28; k++) {
    const col = k < 17 ? k % 9 : (k - 17) % 6, row = k < 17 ? Math.floor(k / 9) : Math.floor((k - 17) / 6);
    const x = (k < 17 ? 10 : 384) + col * 40, y = 20 + row * 80;
    const v = k % 4;
    const roof = v === 0 ? `M${x} ${y + 30}L${x + 17} ${y + 18}L${x + 34} ${y + 30}z` : v === 1 ? `M${x - 2} ${y + 30}L${x + 4} ${y + 22}H${x + 30}L${x + 36} ${y + 30}z` : v === 2 ? `M${x} ${y + 30}H${x + 34}V${y + 26}H${x}z` : `M${x} ${y + 30}L${x + 34} ${y + 22}V${y + 30}z`;
    out += `<rect class="paper" x="${x}" y="${y + 30}" width="34" height="24"/><rect class="band" x="${x}" y="${y + 44}" width="34" height="10"/><path class="paper" d="${roof}"/><path class="thin" d="M${x + 5} ${y + 35}h7v6h-7zM${x + 22} ${y + 35}h7v6h-7zM${x + 14} ${y + 54}v-9h6v9"/>`;
    if (rand(k) > 0.6) out += `<path class="leaf" d="M${x + 38} ${y + 40}a6 7 0 1 0 0.1 0z"/><path class="thin" d="M${x + 38} ${y + 47}v7"/>`;
    out += crowd([[x + 8, y + 72, .6], [x + 17, y + 72, .62], [x + 26, y + 72, .6]], k * 5);
  }
  return `<svg viewBox="0 0 640 180" class="scene"><path class="ground" d="M0 74H640M0 154H640"/>${out}</svg>`;
}

const css = `
:root { --bg:#fff8f4; --surface:#fff; --fg:#111; --muted:#5f5f5f; --border:#e7e7e7; --o:#f0732d; }
.dark { --bg:#14100d; --surface:#211a15; --fg:#fff; --muted:#b0a69c; --border:rgba(255,255,255,.14); }
body { margin:0; background:var(--bg); color:var(--fg); font:13px ui-monospace, monospace; }
section { padding:24px 32px; width:640px; }
.scene { width:100%; display:block; overflow:visible; }
.paper { fill:var(--bg); stroke:var(--fg); stroke-width:1; stroke-linejoin:round; }
.line { fill:none; stroke:var(--fg); stroke-width:1; stroke-linecap:round; }
.thin { fill:none; stroke:var(--fg); stroke-width:.7; stroke-linecap:round; }
.ink { fill:var(--fg); }
.muted { fill:color-mix(in srgb, var(--fg) 55%, var(--bg)); }
.pack, .orange { fill:var(--o); }
.band { fill:color-mix(in srgb, var(--o) 22%, var(--bg)); }
.band2 { fill:color-mix(in srgb, var(--o) 55%, var(--bg)); }
.leaf { fill:color-mix(in srgb, var(--fg) 5%, var(--bg)); stroke:var(--fg); stroke-width:1; }
.shade { fill:color-mix(in srgb, var(--fg) 6%, transparent); }
.ground { stroke:var(--border); stroke-width:1; }
h2 { font-size:12px; letter-spacing:.08em; color:var(--muted); font-weight:400; }
.count { display:flex; gap:10px; align-items:baseline; } .count em { font:italic 34px "DM Serif Display", Georgia, serif; color:#b8501a; }
`;
const html = (dark) => `<html class="${dark ? 'dark' : ''}"><style>${css}</style><body>
<section><h2>B · ONE PUBLIC SCHOOL, THE KIT RUNNING ON A DESK, × 28</h2>${sceneB()}<div class="count"><em>× 28</em> SCHOOLS · 17 IN BAHIA, 11 IN CEARÁ</div></section>
<section><h2>A · A CONTACT SHEET OF 28 FAÇADES, LIGHT LINES</h2>${sceneA()}</section></body></html>`;

const browser = await chromium.launch();
for (const dark of [false, true]) {
  const page = await browser.newPage({ viewport: { width: 720, height: 800 }, deviceScaleFactor: 2 });
  await page.setContent(html(dark));
  await page.screenshot({ path: `${OUT}explore2-${dark ? 'dark' : 'light'}.png`, fullPage: true });
  for (const [i, n] of [[0, 'b'], [1, 'a']]) await page.locator('section').nth(i).screenshot({ path: `${OUT}explore2-${n}${dark ? '-dark' : ''}.png` });
}
await browser.close();
