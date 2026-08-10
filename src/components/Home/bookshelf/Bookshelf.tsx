import { useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import type { Book, BookFilter, BookshelfProps } from "../../../types/book";
import { FILTERS, STATUS_META, matchesFilter } from "../../../types/book";
import { Book3D } from "./Book3D";
import { BookDetail } from "./BookDetail";

export function Bookshelf({
  books,
  title = "Books I've Read.",
  description = "What I'm reading, what I've finished, and what shaped how I build things.",
  accent = "#00d9ff",
  bookWidth = 160,
}: BookshelfProps) {
  const [filter, setFilter] = useState<BookFilter>("all");
  const [selected, setSelected] = useState<Book | null>(null);
  const reduced = useReducedMotion();

  const visible = useMemo(() => books.filter((b) => matchesFilter(b, filter)), [books, filter]);
  const counts = useMemo(
    () => FILTERS.reduce<Record<string, number>>((acc, f) => {
      acc[f.id] = books.filter((b) => matchesFilter(b, f.id)).length;
      return acc;
    }, {}),
    [books]
  );

  return (
    <section className="bookshelf" id="books" aria-labelledby="bookshelf-heading">
      <div className="bookshelf__ambient" style={{ background: `radial-gradient(60% 100% at 50% 0%, ${accent}, transparent)` }} />

      <header className="bookshelf__header">
        <div>
          <p className="bookshelf__label" style={{ color: accent }}>Library</p>
          <h2 id="bookshelf-heading" className="bookshelf__title" data-color-inverted="true">{title}</h2>
          <p className="bookshelf__desc">{description}</p>
        </div>
        <p className="bookshelf__count">{books.length} books</p>
      </header>

      <LayoutGroup id="bookshelf-filters">
        <div role="tablist" aria-label="Filter books" className="bookshelf__filters">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={`bookshelf__filter-btn ${active ? "bookshelf__filter-btn--active" : ""}`}
              >
                {active && (
                  <motion.span
                    layoutId="filter-active"
                    className="bookshelf__filter-bg"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    style={{ boxShadow: `0 0 22px -6px ${accent}59` }}
                  />
                )}
                <span className="bookshelf__filter-text">
                  {f.label}
                  <span className="bookshelf__filter-count" style={{ color: active ? accent : undefined }}>{counts[f.id]}</span>
                </span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <motion.ul layout={!reduced} className="bookshelf__grid">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((book, i) => (
            <motion.li
              key={book.id}
              layout={!reduced}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.16 } }}
              transition={{ type: "spring", stiffness: 300, damping: 30, delay: reduced ? 0 : Math.min(i * 0.035, 0.28) }}
              className="bookshelf__grid-item"
            >
              <BookCard book={book} width={bookWidth} accent={accent} onOpen={() => setSelected(book)} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      {visible.length === 0 && <p className="bookshelf__empty">Nothing on this shelf yet.</p>}

      <BookDetail book={selected} onClose={() => setSelected(null)} accent={accent} />
    </section>
  );
}

function BookCard({ book, width, accent, onOpen }: { book: Book; width: number; accent: string; onOpen: () => void }) {
  const meta = STATUS_META[book.status];

  return (
    <button onClick={onOpen} aria-label={`Open details for ${book.title}, by ${book.author}`} className="bookshelf__card">
      <Book3D book={book} width={width} accent={accent} />

      <div className="bookshelf__card-info" style={{ maxWidth: width + 20 }}>
        <div className="bookshelf__card-status">
          <span className="bookshelf__card-dot" style={{ background: meta.dot, boxShadow: book.status === "reading" ? `0 0 7px ${meta.dot}` : undefined }} />
          <span className="bookshelf__card-status-text">{meta.short}</span>
          {book.favorite && (
            <svg width="9" height="9" viewBox="0 0 24 24" fill={accent} style={{ marginLeft: "auto" }} aria-hidden>
              <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5 7.3 14.03 2.6 9.45l6.5-.95L12 2.6z" />
            </svg>
          )}
        </div>

        <p className="bookshelf__card-title">{book.title}</p>
        <p className="bookshelf__card-author">{book.author}</p>

        {book.status === "reading" && (
          <div className="bookshelf__card-progress-bar">
            <motion.div
              className="bookshelf__card-progress-fill"
              style={{ background: accent }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: book.progress / 100 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            />
          </div>
        )}
      </div>
    </button>
  );
}

export default Bookshelf;
