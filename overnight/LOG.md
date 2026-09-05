# LOG da madrugada — gabrielmr.com

**Início:** sáb, 5 set 2026, 06:48 (horário local, UTC-3)
**Fim previsto do trabalho:** ~11:48 · Fase 4 (publicar) só depois de 11:18 (4h30)
**Branch:** `overnight/2026-09-05` (a partir de `main` = `c803cfc`, igual a `origin/main`)

Como ler: cada turno adiciona linhas abaixo. Ao retomar depois de compactação de contexto, releia este arquivo e `02-checklist.md`.

---

## Turnos

### Turno 1 — 06:48 → (Fase 0)
- 06:48 `date`, `git status` (só `.letta/` sem track; adicionado ao .gitignore junto com `overnight/screenshots/`).
- main == origin/main (`c803cfc`). Branch `overnight/2026-09-05` criada.
- Stack descoberta (ver `00-baseline.md`). Build passa em ~65s com 1 warning (chunk `three` > 500 kB).
- Deploy: CLI `npx vercel --prod` (credencial ok: `gabrielmribeiro`), ~40s por deploy. Site atrás de Cloudflare (Age no HTML cacheado).
- Scripts criados: `overnight/screenshot.mjs`, `overnight/extract-text.mjs`.
- Preview local em http://localhost:4173 (log em `overnight/preview.log`).
- Screenshots prod-before e before rodando.
- 07:05 Lighthouse produção (4 páginas) e local; axe; links (73 URLs, 0 quebradas). Ver `00-baseline.md`.
- 07:30 `01-auditoria.md` e `02-checklist.md` escritos; commit `91acb85`. Commit acidental dos relatórios HTML do Lighthouse corrigido em `66a4f90` (removidos do git, ignorados).

### Turno 2 — 07:30 → 08:08 (Fase 2, lotes 1 e 2) — sessão interrompida
- Lote 1 (C1–C14) e lote 2 (C15–C27) aplicados no working tree. Build ok às 07:33 (lote 1); screenshots `after/` do lote 1 confirmaram: botões do hero visíveis no dark, navbar mobile com nome inteiro, ícones de skills fora da nav lateral, lead do contato em uma linha, footer legível.
- `work.ts` NÃO é código morto (o terminal Ctrl+K usa em `constants/terminal/fileSystem.ts`): restaurado. Só `WorkCard.tsx` saiu; `workCard.scss` ficou só com `.workcard-window__content`.
- Sonda (`probe.mjs`): contadores do /story batem com o ensaio depois da animação (121, 21/26, 198:18:37, 31) → C28 sem mudança. Elemento largo da home é a faixa do moments (marquee dentro de `overflow:hidden`) → C29 não é bug.
- 08:08 sessão caiu no meio do build do lote 2 (preview segurava `dist/` no Windows: parar o preview antes de buildar).

### Turno 3 — retomada (relógio do sistema agora marca 02:14; contabilizo 1h20 de trabalho feitos antes da queda)
- Regra de tempo: publicar só depois de 4h30 acumuladas → não antes de 05:24 no relógio atual; fim do trabalho ~05:54.
- Build completo do lote 2 passa (44s, mesmo warning do chunk `three`). Preview reiniciado.

---

## Decisões para eu revisar

(itens que precisam da opinião do Gabriel; recomendação em cada um)

1. **`.letta/` adicionado ao `.gitignore`.** Era um diretório sem track (estado local do agente Letta, tem `settings.local.json`). Recomendação: manter ignorado; se quiser versionar, remover a linha.
