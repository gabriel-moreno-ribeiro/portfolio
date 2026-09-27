// Index drawer: every book in shelf order, grouped by the age it was read at, with filters.
// A row opens its book on the shelf; without WebGL each row expands inline so the page is complete without 3D.
import { useEffect, useRef, useState } from "react";
import { FiArrowUpRight, FiChevronDown, FiX } from "react-icons/fi";
import type { Book } from "../../types/book";
import { books, catalog, periodText } from "./shelf/catalog";
import { siteConfig } from "./shelf/site-config";

const pad = (n: number) => String(n).padStart(2, "0");

type Filter = "all" | "favorites" | "reading";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "favorites", label: "Favorites" },
  { key: "reading", label: "Reading now" },
];

type Props = {
  open: boolean;
  fallback: boolean;
  activeIndex: number | null;
  /** Without WebGL, the row that starts expanded (a deep link) */
  expandIndex: number | null;
  onClose: () => void;
  onBrowse: (index: number) => void;
  onOpen: (index: number) => void;
};

type Row = { book: Book; index: number };

// The book being read now is the one orange title; the rest stay in ink
function rowText(book: Book, index: number) {
  const reading = book.status === "reading";
  return (
    <>
      <span className="library__row-num">{pad(index + 1)}</span>
      <span className="library__row-text">
        <span className={`library__row-title ${reading ? "is-reading" : ""}`}>{book.title}</span>
        <span className="library__row-meta">
          <span>{book.author}</span>
          <span>{book.year}</span>
          {reading && <span>reading now</span>}
        </span>
      </span>
    </>
  );
}

export default function IndexDrawer({ open, fallback, activeIndex, expandIndex, onClose, onBrowse, onOpen }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const rows = books
    .map((book, index) => ({ book, index }))
    .filter(({ book }) => filter === "all" || (filter === "favorites" ? book.favorite : book.status === "reading"));
  // Shelf order is reading order, so consecutive rows share an age
  const groups = rows.reduce<{ age: number; period: string; rows: Row[] }[]>((acc, row) => {
    const last = acc[acc.length - 1];
    if (last && last.age === row.book.readAge) last.rows.push(row);
    else acc.push({ age: row.book.readAge, period: row.book.readPeriod, rows: [row] });
    return acc;
  }, []);

  // Focus lands on the close button and the active row is brought into view
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      // preventScroll: the sheet is still sliding in, and a plain focus() would scroll the page container
      closeRef.current?.focus({ preventScroll: true });
      const list = listRef.current;
      const row = list?.querySelector<HTMLElement>('[aria-current="true"]');
      const group = row?.closest<HTMLElement>(".library__group");
      if (list && row && group) {
        const top = (el: HTMLElement) => el.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
        // Clean starts only: a group's top, or a row right under its group's sticky heading,
        // so no row sits half hidden. Pick the one closest to the row's own heading that
        // the list can reach and that keeps the row in view.
        const headOf = (g: Element) => g.querySelector<HTMLElement>(".library__group-head")?.offsetHeight ?? 0;
        const maxScroll = list.scrollHeight - list.clientHeight;
        const rowTop = top(row);
        const starts: number[] = [];
        list.querySelectorAll<HTMLElement>(".library__group").forEach((g) => {
          starts.push(top(g));
          g.querySelectorAll<HTMLElement>(".library__row").forEach((r, i) => { if (i > 0) starts.push(top(r) - headOf(g)); });
        });
        const fits = starts.filter((t) => t <= maxScroll + 1 && rowTop >= t && rowTop + row.offsetHeight <= t + list.clientHeight);
        const want = top(group);
        list.scrollTop = fits.length
          ? fits.reduce((a, t) => (Math.abs(t - want) < Math.abs(a - want) ? t : a))
          : rowTop - headOf(group);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  // The body stays put behind the sheet on phones
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Tab cycles inside the dialog; Escape is handled by the page.
  // Without WebGL the list is the page, so it does not trap focus.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (fallback || e.key !== "Tab" || !dialogRef.current) return;
    const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], summary"));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const renderRow = ({ book, index }: Row) => {
    const current = index === activeIndex ? "true" : undefined;
    if (fallback) {
      const entry = catalog[index];
      return (
        <li key={book.id} className="library__row library__row--details" aria-current={current}>
          <details
            open={index === expandIndex || undefined}
            onToggle={(e) => { if (e.currentTarget.open) onBrowse(index); }}
          >
            <summary className="library__row-main">
              {rowText(book, index)}
              <FiChevronDown className="library__row-chev" aria-hidden="true" />
            </summary>
            <div className="library__row-body">
              <p>{entry.description}</p>
              {entry.quote && (
                <blockquote className="library__quote">
                  <p>“{entry.quote}”</p>
                  <cite>{entry.quoteBy}</cite>
                </blockquote>
              )}
              <dl className="library__facts">
                <div>
                  <dt>Edition</dt>
                  <dd>{entry.format}</dd>
                </div>
                <div>
                  <dt>Read</dt>
                  <dd>{entry.availability}</dd>
                </div>
              </dl>
              {entry.url && (
                <a className="library__pill library__link" href={entry.url} target="_blank" rel="noreferrer">
                  {entry.linkLabel ?? siteConfig.bookLinkLabel}
                  <FiArrowUpRight aria-hidden="true" />
                </a>
              )}
            </div>
          </details>
        </li>
      );
    }
    return (
      <li key={book.id} className="library__row" aria-current={current}>
        <button type="button" className="library__row-main" aria-label={`Open ${book.title}, ${book.author}`} onClick={() => onOpen(index)}>
          {rowText(book, index)}
          <FiArrowUpRight className="library__row-go" aria-hidden="true" />
        </button>
      </li>
    );
  };

  return (
    <div
      ref={dialogRef}
      className={`library__drawer ${open ? "is-open" : ""}`}
      role="dialog"
      aria-modal={!fallback}
      aria-label="All books"
      onKeyDown={onKeyDown}
    >
      <div className="library__drawer-top">
        <div>
          <h2>All books</h2>
          <p aria-live="polite">{rows.length} {rows.length === 1 ? "book" : "books"}</p>
        </div>
        <button ref={closeRef} type="button" className="library__drawer-close" onClick={onClose} aria-label="Close the list">
          <FiX aria-hidden="true" />
        </button>
      </div>
      {fallback && <p className="library__drawer-note">The 3D shelf needs WebGL, so here is the full list.</p>}

      <div className="library__filters" role="group" aria-label="Filter">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="library__drawer-empty">No books match this filter.</p>
      ) : (
        <div ref={listRef} className="library__list">
          {groups.map((g) => (
            <section key={g.age} className="library__group" aria-labelledby={`library-age-${g.age}`}>
              <h3 id={`library-age-${g.age}`} className="library__group-head">
                <span>age {g.age}</span>
                <span>{periodText(g.period)}</span>
              </h3>
              <ol className="library__group-list">{g.rows.map(renderRow)}</ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
