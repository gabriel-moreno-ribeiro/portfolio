# Status — `feat/home-alive`

| Fase | Estado | Commit | Nota |
|---|---|---|---|
| 0 · setup | **concluída** | `feat(home): fase 0` | branch, 7 agentes, docs, CLAUDE.md |
| 0.5 · recuperação | **concluída** | `6eb9e25` | 14 arquivos restaurados do deploy |
| 1 · auditoria e baseline | **concluída** | `1ea6acf` | Explore → PLAN.md §Fase 1; baseline em `qa/baseline/REPORT.md` |
| 2 · plano e contratos | **concluída** | `961820d` | PLAN, CONTRACTS, tipos, 8 JSONs, stubs, config compartilhada |
| 3 · build paralelo | **concluída** | `9777d0b` | 5/5 entregues; decisões abaixo |
| 4 · integração | **concluída** | `9777d0b` | Home monta SectionRail + Experience; Suspense com altura reservada; 7 arquivos mortos removidos; smoke 0 erros |
| 5 · QA em loop | **concluída** (3 rodadas) | `afcbb95` `0f020c0` `9639f41` | r1 → r2 → verificação final; ver "Fase 5 — resultado" |
| 6 · entrega | **concluída** | ver `git log` | verificação final: preview desktop 96/100/100/100, mobile 66/100/100/100; 0 erros de console, 0 requisições falhas, 0 violações axe, 0 imagens sem dimensão |

## Fase 0 — o que foi feito

- Branch `feat/home-alive` a partir de `main`.
- `.claude/agents/`: `platform-engineer`, `experience-engineer`, `hero-engineer`,
  `showcase-engineer`, `skills-engineer`, `qa-reviewer`, `runner`.
- `CLAUDE.md`: seção "Regras para subagentes" anexada, com os comandos reais preenchidos.
- `docs/redesign/`: `PLAN.md`, `CONTRACTS.md`, `STATUS.md`.
- Playwright 1.61.1 presente; chromium verificado.

## Incidente na Fase 0 — perda de working tree (25/09)

Ao verificar se o hook de push estava neutralizado, o orquestrador criou um commit vazio e o
desfez com `git reset --hard HEAD~1`. O `--hard` também descartou as alterações **não
commitadas** dos arquivos rastreados, que tinham vindo de `main` junto com a branch.

Intacto: commit `eafea4a` da Fase 0, `origin/main` (nada foi empurrado), o site em produção
(deploy imutável), e todos os arquivos não rastreados (`Files.tsx`, `files.ts`, `files.scss`,
`public/files/`, `Project.tsx`, `projects.ts`, imagens do Candela, JPEGs da raiz).

Perdido no working tree — 14 arquivos rastreados que estavam modificados:

| arquivo | origem da alteração |
|---|---|
| `src/components/Home/MomentsStrip.tsx` | sessão atual |
| `public/robots.txt` | sessão atual |
| `src/hooks/useDocumentHead.ts` | sessão atual |
| `src/App.tsx` | sessão atual + backlog do Gabriel |
| `vercel.json` | sessão atual + backlog do Gabriel |
| `public/sitemap.xml` | backlog do Gabriel |
| `src/components/Home/Hero.tsx` | backlog do Gabriel |
| `src/components/Home/BackgroundGlobe.tsx` | backlog do Gabriel |
| `src/components/Home/FindMyWork.tsx` | backlog do Gabriel |
| `src/components/Shared/CustomMouse.tsx` | backlog do Gabriel |
| `src/components/Canvas/CanvasComponent.jsx` | backlog do Gabriel |
| `src/components/Canvas/PartsAssemblingCanvas.jsx` | backlog do Gabriel |
| `src/providers/MouseInputProvider.ts` | backlog do Gabriel |
| `src/styles/components/home/findMyWork.scss` | backlog do Gabriel |

Recuperação escolhida: o deploy `dpl_3jmGf3qYqKtCGf1NtQHBkeoM9jCV` (24/09 23:45) carrega o
código-fonte desses 14 arquivos. Gabriel baixa pela aba Source do painel e deposita em
`recovery-incoming/`; o orquestrador compara com o HEAD, reintegra e valida com typecheck +
build antes de seguir para a Fase 1.

**Resolvido em 25/09.** Os 14 arquivos foram baixados do deploy pela API da Vercel com um token
temporário do Gabriel (revogado em seguida) e commitados em `6eb9e25`, separado e antes da
Fase 1. Typecheck e build verdes. Os cinco arquivos da sessão de `/files` voltaram com as marcas
esperadas (`FilesPage`, `Disallow: /files`, `noindex`, `With my brothers`); os nove do backlog
voltaram com 304 inserções e 162 remoções no total.

Vias descartadas: histórico local do VSCode não cobre esses arquivos; `git fsck` não tem os
blobs (nunca foram staged).

Correção de diagnóstico: o 403 inicial da API **não** era incompatibilidade do token do CLI com
a REST, era token vencido (`expiresAt` havia passado ~3h antes, e `vercel whoami` não renova o
valor gravado em `auth.json`). Lição: checar `expiresAt` antes de descartar uma via de
autenticação.

Armadilha encontrada na comparação: os arquivos baixados vêm com CRLF e o `git show` devolve LF,
o que inflava o diff para "todas as linhas diferentes". A comparação real exige normalizar o CR
antes. Sem isso, `useDocumentHead.ts` aparentava 81 linhas alteradas em vez de 11.

Medida adotada: `core.hooksPath` local aponta para `.git/hooks-disabled`, então o
`post-commit` global que roda `git push` não dispara neste repo. Reverter com
`git config --local --unset core.hooksPath`.

**A Fase 1 não começa antes da reintegração** — quatro dos arquivos perdidos (`Hero.tsx`,
`BackgroundGlobe.tsx`, `FindMyWork.tsx`, `CustomMouse.tsx`) são centrais na auditoria da Home,
e auditar o estado atual daria um retrato errado.

## Riscos abertos

1. ~~Agentes novos podem não estar despacháveis nesta sessão.~~ **Resolvido:** os sete
   apareceram no registro sem reiniciar.
2. ~~Backlog grande de alterações não commitadas.~~ **Resolvido** em `6eb9e25` (restauração) e
   `f32a4c5` (páginas `/files` e `/work/:slug`). Ficam fora do git, de propósito: os PDFs de
   `public/files/` (documentos pessoais) e os 17 JPEGs da raiz (agora no `.gitignore`).
3. **Modelo dos operários.** Os arquivos dos agentes pedem `claude-opus-5-5`, e o Claude Code
   desta sessão (2.1.278) só aceita esse modelo a partir da 2.1.280. O primeiro disparo do
   `qa-reviewer` morreu com `400 does not support this model`. Contorno adotado: cada disparo
   passa `model: opus` (o Opus disponível), sem alterar os arquivos em `.claude/agents/`, que
   voltam a valer como escritos depois de um `claude update`. Vale para os cinco operários e o
   QA; o `runner` (haiku) e o Explore não são afetados.

## Fase 3 — decisões tomadas nos relatórios

- **platform**: `topRepos` recusado (fora da spec). Semântica de erro sem cache (`data` = mock,
  `status: 'error'`) mantida e escrita no CONTRACTS §3.
- **experience**: técnica do carro = **sprites** (48 WebP 256×256, 250 KB), por medição em CPU 4×:
  GLB 17 frames > 50 ms e 801 ms até o 1º frame (mobile) vs sprites 0 e 52 ms. Correção à
  auditoria: o GLB tem as quatro rodas num nó só. Pisca-alerta acende quando o carro estaciona na
  última parada (não em `progress > 0,97`, que deixava trecho morto). `qa/experience-bench/` fica.
  Remoção dos arquivos antigos (WorkExperience, PartsAssemblingCanvas, D20Truck,
  workExperience.scss + linha do index.scss) é feita na integração.
- **showcase**: `getSnapshot()` aprovado e adicionado ao CONTRACTS §3 (platform implementa).
  Tags duplicadas do Candela cortadas no componente, não em `projects.ts` (fonte de `/work`).
  Caixas de altura reservada nos `Suspense` da Home: o orquestrador faz na integração.
- **hero**: correção à auditoria — Navbar é importada por 7 rotas e Footer por 6; testadas todas
  sem quebra. `useGitHub()` do rodapé passa a rodar em todas as rotas (cache 10 min): aceito.
  Piscada (sem olhos no GLB) e lampião (fundo é foto) ficam registrados como fora.
- **skills**: física fica (passo médio 2,5 ms, pico 22 ms; rAF para ao assentar); os frames > 50 ms
  da página vêm de outras seções. Ícone do Flutter tinha sido apagado por "sem respaldo": era
  conteúdo do site → restaurado e adicionado ao `skills.json`. Django/MySQL/Firebase/GCloud/NestJS
  vieram das imagens dos ícones já existentes; confirmar com o Gabriel.
- **platform (follow-ups)**: `getSnapshot()` e guarda de rate limit via `/rate_limit` (grátis) com
  reset persistido em `localStorage`.

## Fase 5 — r1 e o que se aprendeu

- Lighthouse de produção (preview): 43 desktop / 47 mobile. O `bootup-time` atribui **4,9 s de
  Script Evaluation ao chunk `vendor-react` (61 KB)** — não é parse, é a renderização da aplicação
  sob o React, com o CPU 4× que o Lighthouse desktop simula. Coincide com o frame de 5 109 ms que
  o QA mediu na Experience integrada em CPU 4×: os dois bloqueios são provavelmente o mesmo bug.
- Depois do robô adiado (hero): desktop 46 → 61 (TBT 3,1 → 1,3 s), a11y 100, mobile −1,2 MB.
- Contraste (axe) zerado; carrossel do Candela só carrega atual + próxima (mobile −37 %).
- Sticker preto: era `height="469"` como presentational hint contra `width:130px` do CSS; nenhum
  filtro cortado.
- Skip link: `:focus, :focus-visible` sem transição (orquestrador, `globals.scss`).
- Commits desta fase serão por rodada (r1, r2…), não um só: o incidente da Fase 0 mostrou o custo
  de deixar trabalho solto no working tree.

## Fase 5 — resultado (r2 + verificação final, preview de produção)

| Métrica | baseline (dev) | final |
|---|---|---|
| Lighthouse desktop perf / a11y / BP / SEO | 35 / 97 / 100 / 100 (dev) | **95–96 / 100 / 100 / 100** (preview) · dev 53–60 |
| Lighthouse mobile perf / a11y | 31 / 97 (dev) | **64–70 / 100** (preview) · dev 32–35 |
| TBT desktop / mobile (preview) | — | 19–64 ms / 378–564 ms |
| Peso transferido preview 1440 / 390 | (dev 21,4 / 10,4 MB) | **3,66 / 1,78 MB** |
| Experience CPU 4×, seção montada, 1440 / 390 | 45 / 2 frames > 50 ms | **0 / 3** (máx 33 / 167 ms; dos 3 do mobile, só um de 52 ms é da seção) |
| Erros de console / requisições falhas | 0 / 0 | **0 / 0** (dev e preview) |
| Violações axe | 0 | 1 (CTA do card, 4,41:1) → corrigido na verificação final |
| Imagens sem dimensão | 2 | **0** |
| Herói normal vs reduce | 703 → 363 px | **737 → 737** |
| WebGL na Experience | 1 contexto | **0** (sprites) |
| CLS rolagem rápida @390 | — | 0,045 (era 0,26 no r1 com as caixas erradas) |
| `dist/` · JS gzip · chunk `index` | 14,7 MB · 833 KB · — | **13,05 MB · 851 KB · 48 KB** |

Meta de performance mobile (≥ 80) **não atingida**: 64–70. O LCP simulado (4,8–5,7 s em 4G lento +
CPU 4×) é o primeiro render do React de uma SPA renderizada no cliente; sem throttle o LCP é
172 ms. O corte seguinte é estrutural (pré-render do hero no build) e fica como próximo passo.

Decisões de diretor de arte na Fase 5: cortado o botão flutuante "Let's talk" (virou linha do
card); cortado o espaço vazio da caixa de Skills (398 → 240 px); sticker preto **é** o logo da
abelha (RGB 8/8/8 no arquivo), não defeito; hover-preview do Research mantido.

## Rodada de feedback do Gabriel (25/09, depois da entrega)

Doze itens, seis por seletor e seis por área. As áreas foram casadas com os elementos reais por
tamanho e posição (`.playwright-cli/match.mjs`) e leram-se, na ordem do scroll: Cool Things →
By the Numbers → Skills → Experience. O item 9 (Skills) foi confirmado com ele.

| Item | Decisão |
|---|---|
| nav pill com status | **cortado**; pílula como antes; investigar/corrigir o que ficava estranho ao abrir `/library` |
| linha de status e "latest" do hero | **cortados**; hero = nome, roles, desc, botões |
| filtros de cidade em Moments | **cortados**; eyebrow com os nomes como texto; legendas `o que · lugar · ano` ficam |
| linha "last shipped" do HIBEEX e contadores/barra do Candela | **cortados**; tags do Candela voltam |
| By the Numbers | **restaurado** o carrossel pré-reforma byte a byte (só o intervalo pausa fora da tela) |
| Skills | **restaurado** byte a byte (ícones flutuantes + marquees); `matter-js` removido |
| cabeçalho da Experience (subtítulo + índice) | **cortado**; fica só o título |
| carro e estrada | aprovados ("gostei muito"); pedido: mais fluido → suavização, histerese de frame, lerps |
| rodapé "last commit · site updated" | **cortado**, junto com o `useGitHub()` do rodapé |

A camada de dados (`src/lib/data`), o `numbers.json`/`skills.json`/`press.json`/`changelog.json` e
as primitivas de motion continuam no repo; na Home só a Experience, o Contact (relógio), o
Origins (hora por cidade) e o terminal (`getSnapshot`) os consomem agora.

Pedido final dele: colocar online para ver do celular → **preview da Vercel** (URL própria), sem
tocar em gabrielmr.com.

## Rodada 2 de feedback (26/09) — o que foi feito

Onze itens do Gabriel sobre o preview, mais uma sessão paralela (outra instância do Claude)
cuidando de Navbar, Footer, Library, News, Story, resumé e ícones do Contact.

| Item | Decisão |
|---|---|
| marquee de skills | **cortado** (a seção Skills de ícones flutuantes fica) |
| cards em cima / longe da estrada | estrada passa a ser desenhada a partir dos cards: apex no card ± (32 px + meia largura), medido em 1280/1366/1440 (32 px) e 390 (20 px) |
| "CEO / founder / algo do gênero" | **removido de todo o site**: metas do `index.html`, JSON-LD, shell estático, `useDocumentHead`, hero, `experience.json` (roles vazios), `projects.ts`, terminal, `api/chat.ts`, `llms.txt`, `gallery.json`; "President" e "Researcher" ficam |
| resto da estrada como incógnita | asfalto, borda e faixa dissolvem ~360 px à frente do carro (300 no mobile); sem retângulo, sem brilho; reduced-motion vê a estrada inteira |
| D-20 do avô | legenda em serif itálico ligada ao carro por um fio: "My grandfather Adalberto's red Chevrolet D-20, from his garage in Missão Velha." + "read the story" (→ /story); some quando o carro anda. "from his garage" é inferência (story.ts diz que ele tinha a garagem e comprou a D20) — confirmar |
| odômetro "cara de AI" | só o ano, grande, serif itálico na cor de acento, na margem direita; sem pílula, sem "stop N/6"; nunca vaza para o Contact |
| títulos no mesmo formato | classe `.section-title` em `globals.scss`: centralizado, Title Case, "Palavra <em>Palavra</em>", sem ponto — Origins, Cool Things, By the Numbers, Research Papers, Experience. **Exceção por decisão do Gabriel (via a outra sessão): Contact mantém "Let's talk." com eyebrow e layout anterior** |
| relógio e eyebrow do Contact | relógio cortado; eyebrow voltou por escolha dele no layout anterior |
| rodapé "last commit" | cortado (rodada anterior) |
| carro "mais fluido" | rodada anterior; nesta, a névoa nova custava 20 frames > 50 ms (pintura do SVG por frame) → recorte composto com só transform: rasterização 1 932 → 145 ms, 0 frames longos da seção no bench quente |

Fora da Experience no caminho frio (CPU 4×): montagem das seções lazy pelo React, avaliação do
módulo do sticker (agora só no desktop e em idle), handler de scroll do PostHog
(`disable_scroll_properties`), e o trilho lateral (leitura de layout por frame → cache).
