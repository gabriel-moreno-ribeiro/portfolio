# Status — `feat/home-alive`

| Fase | Estado | Commit | Nota |
|---|---|---|---|
| 0 · setup | **concluída** | `feat(home): fase 0` | branch, 7 agentes, docs, CLAUDE.md |
| 1 · auditoria e baseline | pendente | — | — |
| 2 · plano e contratos | pendente | — | — |
| 3 · build paralelo | pendente | — | — |
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

## Riscos abertos

1. **Agentes novos podem não estar despacháveis nesta sessão.** A pasta `.claude/agents/` já
   existia (regra do brief satisfeita, sem necessidade de reiniciar), mas as sete definições
   foram escritas agora. O registro de tipos de subagente é montado no início da sessão.
   Verificar antes da Fase 3; se não resolverem, reiniciar com `claude --continue`.
2. **Backlog grande de alterações não commitadas** veio de `main` junto com a branch (Hero,
   BackgroundGlobe, CustomMouse, CanvasComponent, MouseInputProvider, FindMyWork, MomentsStrip,
   sitemap, página `/files`). Os commits desta reforma usam caminhos explícitos, nunca `git add -A`.
3. **17 JPEGs soltos na raiz do repo** (~44 MB, `Exp *.jpeg`, `Kit*.jpeg`), não commitados.
   Qualquer `git add -A` os engole. Tratar antes do primeiro commit amplo.
