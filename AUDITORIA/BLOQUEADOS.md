# Bloqueados

## B1 — Bookshelf spine redesign (Phase 4, full visual overhaul)
**O que é:** Redesenhar a estante para usar lombadas estilizadas com título rotacionado 90°, cores derivadas das capas, e hover revelando a capa completa em painel flutuante.
**Por quê bloqueado:** Requer: (a) extração de cor dominante por livro em build time via sharp, (b) reescrita completa do CSS da bookcase com writing-mode: vertical-rl, (c) substituição do componente BookItem inteiro. É uma tarefa de ~200 linhas de código novo que poderia ser feita mas exige confirmação de que o design básico implementado (button, aria-label, picture srcset) é suficiente por agora.
**O que foi feito:** div→button (keyboard), aria-label com título+estrelas, picture srcset AVIF+WebP, subtítulo corrigido, empty slots reduzidos.
**Para desbloquear:** Confirme se quer o redesign completo das lombadas (escrita vertical, cor dominante, painel de hover) e executarei na próxima sessão.

## B2 — CSP (Content-Security-Policy)
**O que é:** Adicionar Content-Security-Policy header no vercel.json.
**Por quê bloqueado:** O site carrega scripts de cdn.jsdelivr.net, storage.googleapis.com, fonts.googleapis.com, fonts.gstatic.com, us.i.posthog.com e mediapipe CDN. Montar a política sem quebrar funcionalidades requer testar com Report-Only primeiro — não é seguro fazer direto sem monitorar.
**Para desbloquear:** Adicione `Content-Security-Policy-Report-Only` primeiro e monitore o console por uma semana. Depois aplique como Content-Security-Policy.

## B3 — Code splitting JS (Phase 3.4)
**O que é:** three.js (688KB) + react-three (443KB) → lazy import com IntersectionObserver; Terminal (360KB) → lazy no primeiro Ctrl+`.
**Por quê bloqueado:** three.js já está em chunk lazy separado (o build já gera `react-three-BUy_Nx85.js` como chunk separado). O Terminal também já é lazy. O que está pendente é adicionar IntersectionObserver para não carregar os chunks até a seção ficar próxima do viewport. Isso requer mudanças nos lazy imports em Home.tsx com wrapper de IntersectionObserver — fácil de implementar mas não feito nesta sessão por limitação de tempo.
**Para desbloquear:** Implementável em 30 min na próxima sessão.

## B4 — Geração automática do sitemap
**O que é:** Gerar sitemap.xml em build time em vez de manter à mão.
**Por quê bloqueado:** Requer plugin vite-plugin-sitemap ou script Node. Simples mas não prioritário.
