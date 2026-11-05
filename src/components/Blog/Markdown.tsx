import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

// A small Markdown renderer for the blog, built as React elements (no innerHTML).
// Blocks: ## / ### headings, paragraphs, - and 1. lists, > quotes, ``` code,
// ![alt](src) images, --- rules. Inline: **bold**, *italic*, `code`, [text](url).

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

function inline(text: string, key = ''): ReactNode[] {
  return text.split(INLINE).filter(Boolean).map((part, i) => {
    const k = `${key}-${i}`;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={k}>{inline(part.slice(2, -2), k)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={k}>{part.slice(1, -1)}</code>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={k}>{inline(part.slice(1, -1), k)}</em>;
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const [, label, href] = link;
      return href.startsWith('/') ? (
        <Link key={k} to={href}>{inline(label, k)}</Link>
      ) : (
        <a key={k} href={href} target="_blank" rel="noreferrer">{inline(label, k)}</a>
      );
    }
    return part;
  });
}

export default function Markdown({ source }: { source: string }) {
  const lines = source.split(/\r?\n/);
  const out: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const k = `b${i}`;

    if (!line.trim()) { i++; continue; }

    if (line.startsWith('```')) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
      i++;
      out.push(<pre key={k}><code>{code.join('\n')}</code></pre>);
      continue;
    }

    const h = line.match(/^(#{2,3})\s+(.*)$/);
    if (h) {
      out.push(h[1].length === 2 ? <h2 key={k}>{inline(h[2], k)}</h2> : <h3 key={k}>{inline(h[2], k)}</h3>);
      i++;
      continue;
    }

    if (/^-{3,}\s*$/.test(line)) { out.push(<hr key={k} />); i++; continue; }

    const img = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/);
    if (img) {
      out.push(
        <figure key={k}>
          <img src={img[2]} alt={img[1]} loading="lazy" decoding="async" />
          {img[1] && <figcaption>{img[1]}</figcaption>}
        </figure>,
      );
      i++;
      continue;
    }

    if (line.startsWith('>')) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) q.push(lines[i++].replace(/^>\s?/, ''));
      out.push(<blockquote key={k}><p>{inline(q.join(' '), k)}</p></blockquote>);
      continue;
    }

    const ordered = /^\d+\.\s/.test(line);
    if (ordered || /^[-*]\s/.test(line)) {
      const items: string[] = [];
      const re = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
      while (i < lines.length && re.test(lines[i])) items.push(lines[i++].replace(re, ''));
      const lis = items.map((t, j) => <li key={j}>{inline(t, `${k}-${j}`)}</li>);
      out.push(ordered ? <ol key={k}>{lis}</ol> : <ul key={k}>{lis}</ul>);
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|```|>|[-*]\s|\d+\.\s|!\[)/.test(lines[i])) para.push(lines[i++]);
    if (!para.length) para.push(lines[i++]);
    out.push(<p key={k}>{inline(para.join(' '), k)}</p>);
  }

  return <>{out}</>;
}
