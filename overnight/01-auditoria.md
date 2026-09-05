# 01 — Auditoria (Fase 1, 2026-09-05 07:00–07:30)

Formato: **onde** · o que está errado · **gravidade** · proposta.

## 1.1 Cada palavra (de `palavras.md`, 459 strings únicas)

O texto já passou por uma rodada de humanização (commit c803cfc). Não há "passionate", "leverage", "journey", emoji em heading nem aberturas de template. O que sobrou:

| # | Onde | Problema | Grav. | Proposta |
|---|---|---|---|---|
| T1 | `index.html` meta description (191 chars) | Acima de 155; corta no Google | média | "18, founder and researcher on a build year. CEO of HIBEEX, backoffice AI for small and medium businesses. Founder of Projeto Candela. 39 olympiad medals." (152) |
| T2 | `index.html` `<title>`, og:title, twitter:title = só o nome | Aba e cards sociais não dizem o que ele faz | média | "Gabriel Moreno Ribeiro — Founder, HIBEEX" (40 chars). h1 e nome no site não mudam. |
| T3 | Hero `.desc`: "Building Backoffice AI for Small and Medium Businesses @ HIBEEX. Founder @ Projeto Candela." | Title Case no meio da frase; "@" duas vezes (cara de bio de Twitter) | média | "CEO of HIBEEX, backoffice AI for small and medium businesses. Founder of Projeto Candela." (igual ao fallback `<noscript>`). |
| T4 | Hero: 3 CTAs (Connect, See Work, Book a Call) + no mobile mais 2 fixos (Get in Touch, Book a Call) = 5 botões na primeira tela | Nenhuma chamada é "a" chamada | média | Hero com 2: **See Work** (primário) + **Book a Call**. LinkedIn continua no Contact e no footer. |
| T5 | Footer/Navbar "Github." vs Contact "GitHub" | Grafia inconsistente (o nome oficial é GitHub) | baixa | "GitHub." |
| T6 | Cool Things › Medals: "math, physics, chemistry, and astronomy" | Vírgula de Oxford só aqui; o resto do site não usa | baixa | remover a vírgula antes de "and" |
| T7 | Numbers: "SAT 1,510 / 1600" | Separador de milhar no primeiro número e não no segundo | baixa | renderizar 1510 sem separador |
| T8 | Work Experience › "Independent Researcher @ Fintech Savings RCT" com a linha de data = "Advised by …" | Único item sem data | baixa | "2025 · Advised by Aaron Litvin, Ph.D. (Harvard)" (ano vem do card de Research) |
| T9 | Cool Things › GSAT: "A test-prep platform I built from scratch as founding CEO." | Sem contexto/resultado; único card sem número ou data | baixa | acrescentar período que já está em Experience: "… as founding CEO, November 2025 to May 2026." |
| T10 | `public/llms.txt` Email: gabrielmribeiro@hibeex.com.br | Todo o resto do site (JSON-LD, footer, contato) usa me@gabrielmr.com | média | me@gabrielmr.com (registrar em Decisões, caso o e-mail HIBEEX fosse intencional) |
| T11 | `public/llms.txt` "HIBEEX, a fintech startup that turns the messy financial data…" | Site inteiro descreve como "backoffice AI for SMBs" | baixa | alinhar com a descrição do site |
| T12 | `public/llms.txt` "/blog: writing" | /blog está vazio e noindex | baixa | "/blog: writing (nothing published yet)" |
| T13 | Contact lead "Building something, hiring, or just curious? Write to me." | Em 1440 quebra deixando "me." sozinho | baixa | max-width do lead 420→460px |
| T14 | Sidenav "PROFESSIONAL EXPERIENCE" | Label mais largo que a calha esquerda (240 px > 194 px): sobrepõe o texto do Contact e dos cards em 1440 | média | label da nav "Experience" (o h2 da seção continua "Professional Experience.") |
| T15 | `/story` textos dos infográficos ("107 laptops", "19 / 26", "122:55:51", "20 repos") | Divergem do ensaio (121, 21/26, 198:18:37, 31) | verificar | Provavelmente contadores animados capturados no meio da contagem. Confirmar esperando a animação; se for texto fixo, corrigir para os números do ensaio. |
| T16 | `/privacy` "If you submit the contact form at /contact" | A rota /contact redireciona para /#contact (funciona) | baixa | manter link; trocar texto para "at the bottom of the home page (/#contact)" |
| T17 | `sitemap.xml` lastmod 2026-08-20 na home | Home mudou em 5 set (commits c58da1f, c803cfc) | baixa | atualizar lastmod da home para 2026-09-05 |
| T18 | Hero scramble "Founder / Builder / Researcher / Developer & Curious." | Efeito de "digitação" é clichê da lista; mas é parte da identidade atual | decisão | Não mexer. Registrar recomendação: trocar por uma linha estática "Founder, builder, researcher." |
| T19 | Heading "Cool Things" para a seção de prova principal | Casual para admissions/investidor; subtítulo "What I've built and what I've won." salva | decisão | Não mexer. Registrar alternativa: "Work" (a nav já chama de Cool Things). |
| T20 | `/story` usa travessão/meia-risca ("Numbers, though – those") em 3 lugares | Feedback anterior pede sem em dash; mas o arquivo diz "text is verbatim" (personal statement) | decisão | Não mexer no ensaio. Registrar. |

Verificado e OK: nomes de projetos consistentes (HIBEEX, Projeto Candela, GSAT Education, Fundação Estudar, Instituto Principia, IFT-UNESP, St Andrews, Insper); números consistentes entre seções (39/19/49, 3.392/28/30→10, 208/130%, 59 págs/97%, 0,7%/70/10.000+, 14, 17/47%/62%); datas coerentes (HIBEEX jan/2026–presente; GSAT nov/2025–mai/2026; Olympic Club ago/2024–mai/2026; FE jan/2025–mar/2026; Principia jan/2023–jul/2025); alt de todas as imagens presente e descritivo; 404, obrigado, formulário, placeholders e mensagens de erro em voz direta.

## 1.2 Conteúdo e estrutura

- **Hero (5 segundos):** nome → papel (scramble) → uma linha com HIBEEX e Candela → 3 botões → frase rotativa com prova. Funciona; melhora com T3/T4. **alta** para T4 no mobile (5 CTAs).
- **Projetos (Cool Things):** ordem certa (HIBEEX primeiro). Cards Candela/Medals/GSAT não têm imagem e o grid `1fr 1fr` estica o card da Candela até a altura do card com foto → ~350 px de vazio (`before/tiles/home-1440-t02.png`). **média.** Proposta: `align-items: start` no grid (cards sem mídia ficam na altura do conteúdo) e mídia do HIBEEX ocupa a coluna inteira? Não: manter grid, só alinhar ao topo. Não há mídia em `public/work/candela|medals|gsat` (só .gitkeep) → registrar em Decisões (subir fotos).
- **Research:** bom. Cards sem PDF não são clicáveis e não parecem clicáveis — OK. Os dois PDFs ausentes já estão como TODO no código → Decisões.
- **Sobre:** não há seção "About" inchada; o /story cumpre o papel. OK.
- **Contato:** email visível, 4 canais, formulário com validação. OK.
- **Leitor com pressa (só headings):** "Gabriel Moreno Ribeiro. / Where I Come From. / Cool Things / HIBEEX / Projeto Candela / 39 Olympiad Medals / GSAT / Research / … / Professional Experience / Let's talk." — sai sabendo. OK.
- **Sobra:** `/blog` vazio (noindex, não linkado no menu; llms.txt aponta) → manter, ajustar llms.txt (T12). `src/constants/work.ts` e `src/components/Home/WorkCard.tsx` não são importados por ninguém → código morto (§1.4).

## 1.3 Design visual

| # | Onde | Problema | Grav. | Proposta |
|---|---|---|---|---|
| D1 | Hero, **dark mode**, 1440 e 390 | Botões "Connect" e "Book a Call" são pílulas brancas sem texto visível (`.btn.primary { color:#fff; background: var(--fg) }` e `--fg` é branco no dark) (`before/sections/hero-bottomtext-1440-dark.png`) | **alta** | `color: var(--bg)`; hover mantém inversão |
| D2 | Navbar, 390 | Pílula colapsada tem largura fixa 175 px e o nome "Gabriel Moreno Ribeiro." é cortado ("…Ribeirc") em todas as páginas (`before/tiles/home-390-t00.png`) | **alta** | largura colapsada mobile ≈ 240 px (ou auto); verificar 320 |
| D3 | Skills (canvas de ícones), 1440 | Ícones espalhados até x=±700·escala: o da direita corta na borda, os da esquerda cobrem a nav lateral (`before/sections/skills-1440.png`) | média | limitar |x| a ~520 px; a nav lateral fica livre |
| D4 | Sidenav × conteúdo, 1440 | Label "PROFESSIONAL EXPERIENCE" (≈240 px) invade a coluna de conteúdo (começa em 194 px) (`before/sections/contact-1440.png`) | média | T14 |
| D5 | Cool Things grid, ≥600 | Card sem mídia esticado (ver 1.2) | média | `align-items: start` |
| D6 | Contact lead, 1440 | "me." órfão | baixa | T13 |
| D7 | `/library`, 1440 | Botão "← Home" (pílula) sobrepõe o rótulo "LIBRARY · 28 BOOKS" no canto superior esquerdo (`before/tiles/library-1440-t00.png`) | média | empilhar ou afastar: rótulo à direita do botão com gap |
| D8 | Contraste (Lighthouse `color-contrast`) | h1 do hero `#f0732d` sobre `#fff8f4` = 2,78:1 (< 3:1 para texto grande); tags dos cards laranja sobre laranja claro; links do footer `#5f5f5f` sobre `rgba(#111,.9)` = 2,5:1; footer no dark `rgba(#111,.5)` sobre branco = 3,5:1 | **alta** (a11y) | h1: `#e2601a` (3,37:1 no claro; no dark continua `#f0732d` via variável). Tags: `color: var(--accent)`. Footer: `#a8a8b8` (6,8:1); dark `rgba(#111,.65)` |
| D9 | `/news`, embeds do Instagram | Enquanto o embed.js não roda (bloqueador, headless) o card é uma caixa branca de 420 px com só "View this post on Instagram" (`before/tiles/news-1440-t00.png`) | baixa | estilizar o fallback (link centralizado, altura mínima menor) |
| D10 | Home | Documento tem `scrollWidth` 1504 px em viewport 1440 (elemento 64 px mais largo, escondido por `overflow-x:hidden`) | baixa | localizar (provavelmente `.moments__row` ou `.sticker-stage`) e conter |
| D11 | Hero, 1440 | Robô 3D + nome + roles + desc + 3 botões + frase: hierarquia OK; robô entra depois do texto (fade) → sem CLS. OK | — | — |
| D12 | Estados | `:focus-visible` global existe; hover em botões/links existe; `prefers-reduced-motion` respeitado. OK | — | — |
| D13 | Clichês | Nuvem de logos (skills) e "typing" no hero existem, mas são a identidade atual → Decisões (T18) | decisão | — |

Pergunta final ("o que um designer apontaria primeiro?"): 1440 → a coluna de ícones sobre a nav lateral e o card vazio da Candela; 390 → o nome cortado na navbar e cinco botões na primeira tela; dark → os dois botões brancos sem texto.

## 1.4 Técnico

**Lighthouse produção (mobile):** ver `00-baseline.md`. Ações baratas identificadas:

| # | Item | Grav. | Proposta |
|---|---|---|---|
| E1 | `color-contrast` (D8) | alta | ver D8 |
| E2 | `label-content-name-mismatch`: footer `<a aria-label="Send email to Gabriel">me@gabrielmr.com</a>` | média | remover `aria-label` |
| E3 | `skip-link` sem alvo em /story, /news (também /blog, /obrigado, 404) | média | `id="main-content"` no wrapper principal dessas páginas |
| E4 | `lcp-lazy-loaded` em /story: primeira foto (`fig-town__photo img`) com `loading="lazy"` | média | primeira figura `loading="eager"` + `fetchpriority="high"` |
| E5 | `unsized-images`: ícones da faixa horizontal de skills sem width/height | média | `width={80} height={80}` (medir o CSS) |
| E6 | `modern-image-formats`: `/hibeex.png` (sticker, 39 kB) | baixa | gerar `/hibeex.webp` com sharp, trocar `imageSrc`; manter o .png (og/legado) |
| E7 | `uses-rel-preconnect`: posthog (/story) e instagram (/news) | baixa | `<link rel="preconnect">` para `us.i.posthog.com`/`us-assets.i.posthog.com`; instagram só na /news (inserir no head ao montar) |
| E8 | `frame-title`: iframes do Instagram sem `title` | baixa | após `Embeds.process()`, observar e setar `title="Instagram post"` |
| E9 | `canonical` em /library aponta para a home | média | `useDocumentHead` na Library com canonical `/library` e description |
| E10 | `target-size`: ticks da /library (28 livros) muito pequenos | baixa | `min-width: 24px` via `::before` invisível ou padding |
| E11 | `uses-responsive-images`: fotos do moments (300×220 exibidas, ~600 px servidas), research 01.webp | baixa | gerar variantes 320w com sharp + `srcset` no MomentsStrip; ou aceitar (retina usa 2x). Decidir na execução: gerar `-2x` só se ganho > 100 kB |
| E12 | `prioritize-lcp-image`: primeira foto do moments é o LCP | baixa | `fetchpriority="high"` na primeira imagem |
| E13 | axe | — | rodado na Fase 1 (ver resultado no LOG) |
| E14 | Links: 73 URLs testadas, 0 quebradas | OK | — |
| E15 | Console: limpo | OK | — |
| E16 | Meta: title único por página só no cliente (SPA); OG/description só da home para crawlers sem JS | decisão | prerender exige mudança de stack → registrar |
| E17 | Build warning: chunk `three` 717 kB | estrutural | registrar; não mexer em manualChunks (três seções dependem) |
| E18 | Código morto: `src/constants/work.ts`, `src/components/Home/WorkCard.tsx` (+ `workCard.scss`?) | média | remover se nada importar (verificar `WorkCardWindow`, `react-player`) |
| E19 | `react-player`, `html2canvas-pro`: usados só em `WorkCardWindow`/`DraggableWindow` (terminal) — manter | — | — |
| E20 | README.md é o boilerplate do Create React App | média | reescrever com stack, comandos, estrutura, deploy |
| E21 | `sitemap.xml`: lastmod desatualizado (T17); `/blog` fora (correto, noindex) | baixa | atualizar |
| E22 | Fontes self-hosted, `font-display: swap`, subset latin/latin-ext. OK. `/privacy` e `/terms` puxam Google Fonts externo | decisão | páginas estáticas fora do build; deixar |
| E23 | `.letta/` sem track | — | adicionado ao .gitignore (Decisões) |

## 1.5 Priorização → `02-checklist.md`
