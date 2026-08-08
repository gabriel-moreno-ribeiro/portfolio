# Perguntas Pendentes

## Q1 — PDFs de research
**Contexto:** `/research/fintech-rct/paper.pdf` e `/research/chemical-kinetics/paper.pdf` retornam 404.
**Arquivo:** `src/components/Home/Research.tsx`, linhas 29 e 40
**Opção conservadora aplicada:** Remoção do campo `pdf` para os dois itens (badge "Read Paper" não aparece).
**Pergunta:** Você tem esses dois PDFs para subir? Se sim, coloque em `public/research/fintech-rct/paper.pdf` e `public/research/chemical-kinetics/paper.pdf` e descomente os campos.

## Q2 — Comando `resume`
**Contexto:** O terminal abre uma nova aba mas o arquivo não existe.
**Arquivo:** `src/constants/terminal/commands.ts`, linha 196
**Opção conservadora aplicada:** Comando mostra links de contato (email + LinkedIn) em vez de placeholder.
**Pergunta:** Você tem um CV em PDF para subir como `/gabriel-moreno-ribeiro-cv.pdf`?

## Q3 — Nome do co-founder
**Contexto:** `BackgroundGlobe.tsx` diz "Teodoro"; `index.html` JSON-LD diz "Thiago Trevisan".
**Opção conservadora aplicada:** Mantido "Teodoro" na UI (texto que você provavelmente escreveu manualmente); "Thiago Trevisan" no JSON-LD (pode ter sido gerado automaticamente). Registrado com TODO.
**Pergunta:** Qual é o nome correto do co-founder?

## Q4 — Timeline do HIBEEX
**Contexto:** Work Experience diz "January 2026 – Present"; Origins/São Paulo diz "2025 – present" construindo HIBEEX.
**Opção conservadora aplicada:** Mantida a data mais precisa ("January 2026") na experiência; Origins mantém "2025 – present" (pode se referir ao início da ideia).
**Pergunta:** Quando exatamente você começou a construir o HIBEEX? Início da ideia em 2025, fundação formal em Janeiro 2026?

## Q5 — Métricas do card GSAT
**Contexto:** O card do GSAT na seção de work não tem métrica. Os outros têm números.
**Opção conservadora aplicada:** Sem alteração (não inventar números).
**Pergunta:** Alguma métrica para o GSAT? Ex.: número de alunos, taxa de aprovação, receita.
