// O que tinha de continuar funcionando: ids/foco pelo hash, legenda, odômetro, pisca-alerta, CTA,
// links das cidades, e as camadas ligadas pela distância do carro (capas, faróis, figurantes,
// carga). Nada escreve com a seção fora da tela.
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 160)));
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 160)));
await page.goto('http://localhost:5173/#exp-hibeex');
await page.waitForSelector('#work-experience .exp__car');
await page.waitForTimeout(4500);
const arrive = await page.evaluate(() => ({ focused: document.activeElement?.id, arrived: document.getElementById('exp-hibeex').classList.contains('is-arrived'), ids: [...document.querySelectorAll('.exp__stop')].map((e) => e.id).join() }));
await page.evaluate(() => window.dispatchEvent(new Event('wheel')));
const state = () => page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const covers = [];
  document.querySelectorAll('.exp__cover').forEach((e) => { covers[+e.dataset.k] = e.classList.contains('is-over') ? 'on' : '-'; });
  return {
    year: q('.exp__odo-year').textContent, odoAway: q('.exp__odo').classList.contains('is-away'),
    noteGone: q('.exp__d20').classList.contains('is-gone'), hazard: q('.exp__hazard').classList.contains('is-on'),
    cta: q('.exp__card-cta').classList.contains('is-on'), lit: [...document.querySelectorAll('.exp__stop.is-lit')].map((e) => e.id).join(),
    'covers (3 skids, tunnel, deck, arch)': covers.join(), beam: q('.exp__beam')?.classList.contains('is-on'),
    actors: [...document.querySelectorAll('.exp__actor')].map((a) => a.className.split('--')[1].split(' ')[0] + ':' + a.style.transform.replace(/translate3d\(([-\d.]+)px, ([-\d.]+)px, 0px\) rotate\(([-\d.]+)deg\)/, '$1,$2,$3°')).join(' '),
    cargo: q('.exp__cargo').dataset.got, routeLinks: document.querySelectorAll('.exp__route a').length,
    cityLinks: [...document.querySelectorAll('.exp__card-city a')].map((a) => a.getAttribute('href')).join(),
  };
});
const top = await page.evaluate(() => document.querySelector('section.exp').getBoundingClientRect().top + scrollY);
const h = await page.evaluate(() => document.querySelector('section.exp').offsetHeight);
const ys = await page.evaluate(() => {
  const s = document.querySelector('section.exp');
  const t = s.getBoundingClientRect().top;
  return [...s.querySelectorAll('.exp__stop')].map((li) => { const r = li.getBoundingClientRect(); return r.top - t + r.height / 2; });
});
const mid = (i, u) => top + ys[i] + (ys[i + 1] - ys[i]) * u - 450;
const out = { arrive };
for (const [name, y] of [['start', top - 100], ['stop2', mid(1, 0)], ['afterSwitchback', mid(2, 0)], ['inTunnel', mid(4, 0.33)], ['afterTunnel', mid(4, 0.75)], ['cloverOver', mid(5, 0.1)], ['cloverUnder', mid(5, 0.5)], ['end', mid(5, 1) + 4], ['past', top + h + 300]]) {
  // desce em passos: o carro percorre a estrada (as capas dependem de por onde ele passou)
  let cur = await page.evaluate(() => scrollY);
  for (let k = 1; k <= 12; k++) { await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), cur + ((y - cur) * k) / 12); await page.waitForTimeout(30); }
  await page.waitForTimeout(1800);
  out[name] = await state();
}
// Aba oculta / fora da tela: o rAF da seção não pode rodar.
await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), 0);
await page.waitForTimeout(1500);
out.offscreenWrites = await page.evaluate(() => new Promise((res) => {
  const layer = document.querySelector('.exp__car-layer'); let n = 0;
  const mo = new MutationObserver((l) => { n += l.length; }); mo.observe(layer, { attributes: true, subtree: true });
  let y = 0; const id = setInterval(() => { y += 40; scrollTo({ top: y, behavior: 'instant' }); }, 16);
  setTimeout(() => { clearInterval(id); mo.disconnect(); res(n); }, 1000);
}));
out.errors = errors;
console.log(JSON.stringify(out, null, 1));
await browser.close();
