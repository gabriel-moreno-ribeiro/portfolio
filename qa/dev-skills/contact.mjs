/** Contact: foco visível nos 3 campos e no botão, estados contra o mock de /api/contact. */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const OUT = path.resolve('qa/dev-skills');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
await p.goto('http://localhost:5173', { waitUntil: 'load' });
await p.locator('#contact').scrollIntoViewIfNeeded();
await sleep(1200);

const out = { focus: {}, clock: null, states: {}, tabOrder: [], enterInTextarea: null, errors: errs };
out.clock = (await p.locator('.contact-section__clock').textContent()).trim();

// Foco por teclado: outline tem de existir e o raio tem de ser o do componente.
for (const id of ['contact-name', 'contact-email', 'contact-message']) {
  await p.locator(`#${id}`).focus();
  await p.keyboard.press('Shift+Tab');
  await p.keyboard.press('Tab');
  out.focus[id] = await p.evaluate((i) => {
    const s = getComputedStyle(document.getElementById(i));
    return { outlineWidth: s.outlineWidth, outlineStyle: s.outlineStyle, outlineColor: s.outlineColor, radius: s.borderRadius };
  }, id);
}
await p.locator('.contact-section__submit').focus();
await p.keyboard.press('Shift+Tab');
await p.keyboard.press('Tab');
out.focus.submit = await p.evaluate(() => {
  const s = getComputedStyle(document.querySelector('.contact-section__submit'));
  return { outlineWidth: s.outlineWidth, outlineStyle: s.outlineStyle, outlineColor: s.outlineColor, radius: s.borderRadius };
});

// Erros de validação: submeter vazio.
await p.locator('.contact-section__submit').click();
await sleep(300);
out.states.emptySubmit = {
  errors: await p.locator('.contact-section__error').allTextContents(),
  describedby: await p.locator('#contact-name').getAttribute('aria-describedby'),
  invalid: await p.locator('#contact-name').getAttribute('aria-invalid'),
  roles: await p.locator('.contact-section__error[role="alert"]').count(),
};

await p.fill('#contact-name', 'QA');
await p.fill('#contact-email', 'qa@example.com');
await p.fill('#contact-message', 'Mensagem de teste com mais de dez caracteres.');

// Enter dentro do textarea não pode enviar.
await p.locator('#contact-message').focus();
await p.keyboard.press('Enter');
await sleep(400);
out.enterInTextarea = { stillForm: (await p.locator('.contact-section__form').count()) === 1 };

// Ordem de Tab a partir do campo de nome.
await p.locator('#contact-name').focus();
for (let i = 0; i < 3; i++) {
  await p.keyboard.press('Tab');
  out.tabOrder.push(await p.evaluate(() => document.activeElement?.id || document.activeElement?.className || document.activeElement?.tagName));
}

// Enviando -> enviado (mock responde em ~600 ms).
await p.locator('.contact-section__submit').click();
await sleep(180);
out.states.submitting = {
  label: await p.locator('.contact-section__submit').textContent().catch(() => null),
  busy: await p.locator('.contact-section__submit').getAttribute('aria-busy').catch(() => null),
  disabled: await p.locator('.contact-section__submit').isDisabled().catch(() => null),
};
await sleep(1500);
out.states.sent = {
  status: await p.locator('.contact-section__sent[role="status"]').count(),
  text: await p.locator('.contact-section__sent h3').textContent().catch(() => null),
};
await p.locator('#contact').screenshot({ path: path.join(OUT, 'shot-contact-sent.png') });

// Erro de rede: derrubar a rota e reenviar.
await p.locator('.contact-section__link-btn').click();
await sleep(300);
await p.route('**/api/contact', r => r.abort());
await p.fill('#contact-name', 'QA');
await p.fill('#contact-email', 'qa@example.com');
await p.fill('#contact-message', 'Mensagem de teste com mais de dez caracteres.');
await p.locator('.contact-section__submit').click();
await sleep(1200);
out.states.networkError = {
  text: await p.locator('#contact-message-error').textContent().catch(() => null),
  describedby: await p.locator('#contact-message').getAttribute('aria-describedby'),
  role: await p.locator('#contact-message-error').getAttribute('role'),
};
fs.writeFileSync(path.join(OUT, 'contact.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await b.close();
