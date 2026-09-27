// How many card reviews (first sentence) are cut by the 2-line clamp, at 1440 and 390.
import { chromium } from 'playwright';
import fs from 'node:fs';
const books = JSON.parse(fs.readFileSync('C:/portfolio-gabriel/src/data/books.json', 'utf8'));
const list = (Array.isArray(books) ? books : books.books).map(x => ({ title: x.title, review: x.review ? (x.review.match(/^(.+?[.!?])(\s|$)/)?.[1] ?? x.review) : '' }));
const b = await chromium.launch();
const out = {};
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto('http://localhost:5173/library', { waitUntil: 'load' });
  await p.waitForSelector('.library__review', { timeout: 60000 });
  out[w] = await p.evaluate((list) => {
    const src = document.querySelector('.library__caption-body:last-child .library__review');
    const cut = [];
    for (const { title, review } of list) {
      const c = src.cloneNode(); c.textContent = `\u201c${review}\u201d`; src.parentElement.appendChild(c);
      if (c.scrollHeight > c.clientHeight + 1) cut.push(title);
      c.remove();
    }
    return { cut: cut.length, of: list.length, titles: cut };
  }, list);
  await p.close();
}
console.log(JSON.stringify(out));
fs.writeFileSync('C:/portfolio-gabriel/qa/libnews-repair/review-clamp.json', JSON.stringify(out, null, 2));
await b.close();
