import { createElement, Fragment, type ReactNode } from 'react';

/** "12s ago", "2h ago", "3 days ago". Datas no futuro são tratadas como agora. */
export function formatRelative(iso: string | number, now: number = Date.now()): string {
  const t = typeof iso === 'number' ? iso : Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return d === 1 ? 'yesterday' : `${d} days ago`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo} mo ago`;
  const y = Math.round(mo / 12);
  return `${y}y ago`;
}

/** `**assim**` → <strong>. Sem dangerouslySetInnerHTML. */
export function renderEmphasis(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return createElement(
    Fragment,
    null,
    ...parts.map((part, i) => (i % 2 === 1 ? createElement('strong', { key: i }, part) : part)),
  );
}
