# Status — `feat/home-alive`

| Fase | Estado | Commit | Nota |
|---|---|---|---|
| 0 · setup | **concluída** | `feat(home): fase 0` | branch, 7 agentes, docs, CLAUDE.md |
| 0.5 · recuperação | **concluída** | `6eb9e25` | 14 arquivos restaurados do deploy |
| 1 · auditoria e baseline | **concluída** | `1ea6acf` | Explore → PLAN.md §Fase 1; baseline em `qa/baseline/REPORT.md` |
| 2 · plano e contratos | **concluída** | `961820d` | PLAN, CONTRACTS, tipos, 8 JSONs, stubs, config compartilhada |
| 3 · build paralelo | em curso | — | platform ✔; experience ✔ (sprites: 0 frames > 50 ms vs 17 do GLB; 52 ms vs 801 ms; 250 KB vs 3 MB); showcase ✔ (terminal destravado: Escape, dialog, Ctrl+K); hero, skills rodando; follow-ups: getSnapshot (platform) e tags do Candela (showcase) |
| 4 · integração | pendente | — | — |
| 5 · QA em loop | pendente | — | — |
| 6 · entrega | pendente | — | — |

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
