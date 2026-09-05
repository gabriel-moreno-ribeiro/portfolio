# 02 — Checklist (ordem: impacto × facilidade; ⚠ = risco maior)

Marque `[x]` ao concluir; cada item tem verificação registrada no LOG.

## Rodada 1

- [x] C1 (D1) Botões primários invisíveis no dark mode → `color: var(--bg)` em `.btn.primary`
- [x] C2 (D2) Navbar mobile cortando o nome → largura colapsada 240 px; testar 320/390
- [x] C3 (D8/E1) Contraste: h1 hero `#e2601a` no claro; tags `var(--accent)`; footer links `#a8a8b8` / dark `.65`
- [x] C4 (E2) Footer: remover `aria-label` do link de email
- [x] C5 (E3) `id="main-content"` em /story, /news, /blog, /obrigado, 404
- [x] C6 (T14/D4) Sidenav label "Experience"
- [x] C7 (D3) Skills canvas: limitar |x| ≤ 520 no desktop
- [x] C8 (D5) Cool Things grid `align-items: start`
- [x] C9 (T4) ⚠ Hero: 2 CTAs (See Work primário + Book a Call); remover "Connect" (LinkedIn fica no Contact/footer)
- [x] C10 (T3) Hero desc reescrita
- [x] C11 (T1/T2) Meta description ≤155 e title/og:title com descritor
- [x] C12 (T5) "GitHub." no footer e navbar
- [x] C13 (T6/T7/T8/T9) Micro-textos: Oxford comma, SAT 1510, data do RCT, GSAT período
- [x] C14 (T13/D6) Contact lead max-width 460
- [x] C15 (D7) Library: Home × rótulo sobrepostos
- [x] C16 (E9) Library canonical/description via useDocumentHead
- [x] C17 (E4/E12) Story: primeira foto eager + fetchpriority; Home: primeira foto do moments fetchpriority
- [x] C18 (E5) Ícones da faixa de skills com width/height
- [x] C19 (E6) `/hibeex.webp` para o sticker
- [x] C20 (E7) Preconnect posthog (index.html) e instagram (News)
- [x] C21 (E8) title nos iframes do Instagram + (D9) fallback do embed
- [x] C22 (E10) Library ticks ≥ 24 px de alvo
- [x] C23 (T10/T11/T12) llms.txt: email, descrição HIBEEX, /blog
- [x] C24 (T16) privacy.html texto do /contact
- [x] C25 (T17/E21) sitemap lastmod
- [x] C26 (E18) `WorkCard.tsx` removido + `workCard.scss` enxuto; `work.ts` FICA (terminal usa)
- [x] C27 (E20) README.md real
- [x] C28 (T15) Contadores do /story: batem com o ensaio depois da animação (121, 21/26, 198:18:37, 31) → sem mudança
- [x] C29 (D10) Elemento largo da home é a faixa do moments (marquee em overflow:hidden) → não é bug, sem mudança
- [x] C30 (E11) srcset do moments: fotos já são exatamente 2x (640 px para 300 px); ganho só em telas 1x → não feito (Decisão 14). ssa02.webp (92 kB) não comprime abaixo de 90 kB em q74 → mantido
- [ ] C31 axe: corrigir o que aparecer na varredura local

## Decisões para eu revisar (recomendação entre parênteses)

Ver seção homônima em `LOG.md`.

## Rodada 2 (Fase 3, Passe D — olhos de fora)

- [ ] C32 Hero desc termina com "18, on a build year." (admissions officer e investidor perguntam "ele está na escola? vai sair para a faculdade?"; o dado só aparecia no texto rotativo de 5 s)
- [ ] C33 Cards HIBEEX e Candela com link (hibeex.com.br; PDF do paper): investidor não tinha como chegar no produto a partir da seção principal
- [x] C34 Passe A: re-extraído (463 strings únicas); diff antes/depois só mostra as mudanças feitas + contadores animados; nada novo
- [x] C35 Passe B: telas de novo (após C32/C33)
- [x] C36 Passe C: Lighthouse local + axe + links + console + build
- [x] C37 (Passe B) Tablet 768: `.background-section`/`.city-panel` 40 px mais largos que a viewport (content-box) → box-sizing: border-box
- [x] C38 (Passe C) axe `scrollable-region-focusable` nas linhas do moments (viram scroll sob reduced-motion) → role=group + tabIndex
- [x] C39 (Passe C) axe `aria-prohibited-attr` em `.bubble__wave` (/story) → role="img"
- [x] C40 (Passe C) Lighthouse `image-aspect-ratio` nos ícones da faixa de skills (width/height 120 em ícones não quadrados) → CSS width:auto
- [x] C41 Footer em dark mode: textos do CTA e copyright brancos sobre cartão claro → cores escuras
- [x] C42 Cool Things: card do HIBEEX ocupa a linha inteira (foto + texto), 3 cards de texto em 3 colunas
- [x] C43 `@media print`

## Rodada 3 (régua mais alta: 320 px, teclado, peso)

- [x] C44 320 px: linha do tempo das cidades com `min-width: 480px` centralizada cortava a 1ª e a última cidade → min-width 0 abaixo de 520 px
- [x] C45 320 px: grade da /news com `minmax(300px, 1fr)` vazava 24 px → `minmax(min(300px, 100%), 1fr)`
- [x] C46 Teclado: anel de foco dos campos do formulário mais visível (alpha 0,18 → 0,35); ordem de Tab conferida na home (skip link → nav lateral → menu → CTAs → conteúdo → formulário)
- [x] C47 Peso por página medido (tabela no relatório); nada a cortar sem mexer no 3D
- [x] C48 ≤360 px: botões flutuantes de câmera/tema cobriam o fim do nome na navbar (o menu expandido já tem os dois) → escondidos abaixo de 360 px
- [x] C49 320 px /news: iframe do Instagram tem mínimo próprio de 320 px (embed.js) e fica 24 px cortado dentro do card; sem correção possível do nosso lado (nota no relatório)
- [x] C50 `public/404.html` (estática) com texto diferente da 404 do app e um travessão → mesmo texto ("Nothing here." / "This page doesn't exist. The rest of the site does." / "Take me home")
- [x] C51 Ritmo vertical da home medido (script): os gaps entre caixas variam (25–89 px) mas os paddings internos compensam e a distância visual entre conteúdos fica em ~105–125 px em todas as seções → sem mudança
