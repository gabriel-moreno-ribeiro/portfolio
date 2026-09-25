# Contratos — `feat/home-alive`

> **Congelado a partir da Fase 2.** Subagentes leem, não editam. Precisa de uma mudança de
> contrato? Peça no relatório; só o orquestrador altera este arquivo.

Estado: **rascunho da Fase 0.** Os tipos, assinaturas, mapa de propriedade e política de refresh
são escritos na Fase 2, depois da auditoria da Fase 1 dizer qual é a estrutura real do repo.

## Índice previsto

1. Tipos dos dados locais (`src/data/*.json` + zod)
2. Tipos das fontes externas (GitHub, Open-Meteo, relógio)
3. Assinaturas dos hooks de dados
4. API das primitivas de motion
5. API dos helpers (`useSectionProgress`, `pathSampler`, `useVisible`)
6. API de registro de comandos do terminal Ctrl+K
7. Mapa de propriedade de arquivos por agente
8. Política de refresh e ordem das seções no mobile
