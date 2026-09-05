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

---

## Decisões para eu revisar

(itens que precisam da opinião do Gabriel; recomendação em cada um)

1. **`.letta/` adicionado ao `.gitignore`.** Era um diretório sem track (estado local do agente Letta, tem `settings.local.json`). Recomendação: manter ignorado; se quiser versionar, remover a linha.
