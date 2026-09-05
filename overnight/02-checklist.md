# 02 — Checklist (ordem: impacto × facilidade; ⚠ = risco maior)

Marque `[x]` ao concluir; cada item tem verificação registrada no LOG.

## Rodada 1

- [ ] C1 (D1) Botões primários invisíveis no dark mode → `color: var(--bg)` em `.btn.primary`
- [ ] C2 (D2) Navbar mobile cortando o nome → largura colapsada 240 px; testar 320/390
- [ ] C3 (D8/E1) Contraste: h1 hero `#e2601a` no claro; tags `var(--accent)`; footer links `#a8a8b8` / dark `.65`
- [ ] C4 (E2) Footer: remover `aria-label` do link de email
- [ ] C5 (E3) `id="main-content"` em /story, /news, /blog, /obrigado, 404
- [ ] C6 (T14/D4) Sidenav label "Experience"
- [ ] C7 (D3) Skills canvas: limitar |x| ≤ 520 no desktop
- [ ] C8 (D5) Cool Things grid `align-items: start`
- [ ] C9 (T4) ⚠ Hero: 2 CTAs (See Work primário + Book a Call); remover "Connect" (LinkedIn fica no Contact/footer)
- [ ] C10 (T3) Hero desc reescrita
- [ ] C11 (T1/T2) Meta description ≤155 e title/og:title com descritor
- [ ] C12 (T5) "GitHub." no footer e navbar
- [ ] C13 (T6/T7/T8/T9) Micro-textos: Oxford comma, SAT 1510, data do RCT, GSAT período
- [ ] C14 (T13/D6) Contact lead max-width 460
- [ ] C15 (D7) Library: Home × rótulo sobrepostos
- [ ] C16 (E9) Library canonical/description via useDocumentHead
- [ ] C17 (E4/E12) Story: primeira foto eager + fetchpriority; Home: primeira foto do moments fetchpriority
- [ ] C18 (E5) Ícones da faixa de skills com width/height
- [ ] C19 (E6) `/hibeex.webp` para o sticker
- [ ] C20 (E7) Preconnect posthog (index.html) e instagram (News)
- [ ] C21 (E8) title nos iframes do Instagram + (D9) fallback do embed
- [ ] C22 (E10) Library ticks ≥ 24 px de alvo
- [ ] C23 (T10/T11/T12) llms.txt: email, descrição HIBEEX, /blog
- [ ] C24 (T16) privacy.html texto do /contact
- [ ] C25 (T17/E21) sitemap lastmod
- [ ] C26 (E18) Remover `work.ts` e `WorkCard.tsx` (+ scss se órfão)
- [ ] C27 (E20) README.md real
- [ ] C28 (T15) Verificar contadores do /story (esperar animação); corrigir se forem fixos
- [ ] C29 (D10) Elemento 64 px mais largo na home
- [ ] C30 (E11) Avaliar srcset do moments (só se ganho > 100 kB e sem risco)
- [ ] C31 axe: corrigir o que aparecer na varredura local

## Decisões para eu revisar (recomendação entre parênteses)

Ver seção homônima em `LOG.md`.
