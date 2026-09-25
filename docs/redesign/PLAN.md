# Reforma da Home — `feat/home-alive`

Escopo desta rodada: **só a Home**, mais os compartilhados que ela precisa (nav pill, rodapé).
Library, News e Story ficam para a próxima rodada.

Não é rebrand. A identidade (creme `#fff8f4`, serif itálico nos títulos, sans no corpo, laranja
como acento, pílula de navegação central, rodapé escuro arredondado, cursor custom, toggles de som
e tema, ícones 3D em quadrado escuro) é premissa, não variável. O que muda é **vida**: dado real,
movimento com propósito, interação.

---

## Fase 0 — setup (concluída)

- Branch `feat/home-alive` criada a partir de `main`.
- Sete agentes escritos em `.claude/agents/`.
- Seção "Regras para subagentes" anexada ao `CLAUDE.md` (nada apagado).
- `docs/redesign/{PLAN,CONTRACTS,STATUS}.md` criados.
- Playwright 1.61.1 já instalado; chromium verificado.

### Comandos reais do projeto

| | comando |
|---|---|
| dev | `npm run dev` (Vite, 5173) |
| typecheck | `npx tsc --noEmit` |
| lint | **não existe** |
| build | `npm run build` (`tsc && vite build`) |
| test | **não existe** |

### Decisão: não introduzir ESLint nesta rodada

O repo nunca teve ESLint nem Prettier. Adicionar agora significaria ou um flood de erros sobre
código pré-existente que não é desta rodada, ou uma config tão frouxa que não pega nada. Nos dois
casos é custo sem retorno dentro do escopo. **O portão de qualidade é `npx tsc --noEmit` + build +
QA com Playwright.** Se depois da rodada houver apetite, ESLint entra sozinho, num PR próprio,
com `--max-warnings=0` só sobre `src/components/Home/` e `src/lib/`.

---

## Fase 1 — auditoria e baseline

_(a preencher na Fase 1)_

## Fase 2 — plano e contratos

_(a preencher na Fase 2)_
