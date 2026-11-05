import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

// A small Markdown renderer for the blog, built as React elements (no innerHTML).
// Blocks: ## / ### headings, paragraphs, - and 1. lists, > quotes, ``` code,
// ![alt](src) images, --- rules, | tables |, $$ math $$ blocks and <!-- notes -->
// (skipped). Inline: **bold**, *italic*, `code`, [text](url), $math$.
// Math is rendered by KaTeX from the post's own source (trusted, ours).

const INLINE = /(\$[^$\n]+\$|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

function TeX({ tex, block }: { tex: string; block?: boolean }) {
  const html = katex.renderToString(tex, { displayMode: !!block, throwOnError: false, output: 'htmlAndMathml' });
  return block
    ? <div className="blog-math" dangerouslySetInnerHTML={{ __html: html }} />
    : <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function inline(text: string, key = ''): ReactNode[] {
  return text.split(INLINE).filter(Boolean).map((part, i) => {
    const k = `${key}-${i}`;
    if (part.length > 2 && part.startsWith('$') && part.endsWith('$')) return <TeX key={k} tex={part.slice(1, -1)} />;
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

    if (line.startsWith('<!--')) {
      while (i < lines.length && !lines[i].includes('-->')) i++;
      i++;
      continue;
    }

    if (line.trim().startsWith('$$')) {
      const tex: string[] = [line.trim().slice(2)];
      while (!tex[tex.length - 1].trim().endsWith('$$') && i + 1 < lines.length) tex.push(lines[++i]);
      i++;
      out.push(<TeX key={k} tex={tex.join('\n').trim().replace(/\$\$$/, '')} block />);
      continue;
    }

    if (line.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        const cells = lines[i++].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        if (!cells.every((c) => /^:?-+:?$/.test(c))) rows.push(cells);
      }
      const [head, ...body] = rows;
      out.push(
        <div key={k} className="blog-table" role="region" aria-label="Table" tabIndex={0}>
          <table>
            <thead><tr>{head.map((c, j) => <th key={j} scope="col">{inline(c, `${k}h${j}`)}</th>)}</tr></thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri}>{r.map((c, j) => <td key={j}>{inline(c, `${k}r${ri}c${j}`)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

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

    // ![alt](src "WxH"): the size reserves the box before the photo loads (no layout shift).
    const img = line.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"(\d+)x(\d+)")?\)\s*$/);
    if (img) {
      out.push(
        <figure key={k}>
          <img src={img[2]} alt={img[1]} width={img[3]} height={img[4]} loading="lazy" decoding="async" />
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
    while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|```|>|[-*]\s|\d+\.\s|!\[|\||\$\$|<!--)/.test(lines[i])) para.push(lines[i++]);
    if (!para.length) para.push(lines[i++]);
    out.push(<p key={k}>{inline(para.join(' '), k)}</p>);
  }

  return <>{out}</>;
}
