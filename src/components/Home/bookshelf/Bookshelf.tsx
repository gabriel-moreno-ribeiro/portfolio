import { useMemo, useState, useCallback } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import type { Book, BookFilter, BookshelfProps } from "../../../types/book";
import { FILTERS, STATUS_META, matchesFilter } from "../../../types/book";
import { Book3D } from "./Book3D";
import { BookDetail } from "./BookDetail";

export function Bookshelf({
  books,
  title = "Books I've Read.",
  description = "What I'm reading, what I've finished, and what shaped how I build things.",
  accent = "#d4a040",
  bookWidth = 150,
}: BookshelfProps) {
  const [filter, setFilter] = useState<BookFilter>("reading");
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Book | null>(null);
  const reduced = useReducedMotion();

  const allPeriods = useMemo(() => {
    const set = new Set(books.map((b) => b.readPeriod));
    return Array.from(set);
  }, [books]);

  const allTags = useMemo(() => {
    const map = new Map<string, number>();
    books.forEach((b) => b.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [books]);

  const visible = useMemo(() => {
    let result = books;

    if (filter !== "all") {
      result = result.filter((b) => matchesFilter(b, filter));
    }
    if (selectedPeriod) {
      result = result.filter((b) => b.readPeriod === selectedPeriod);
    }
    if (selectedTag) {
      result = result.filter((b) => b.tags.includes(selectedTag));
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.tags.some((t) => t.includes(q))
      );
    }

    return result;
  }, [books, filter, selectedPeriod, selectedTag, search]);

  const groupedByPeriod = useMemo(() => {
    const groups: { period: string; age: number; books: Book[] }[] = [];
    const map = new Map<string, Book[]>();
    visible.forEach((b) => {
      if (!map.has(b.readPeriod)) map.set(b.readPeriod, []);
      map.get(b.readPeriod)!.push(b);
    });
    map.forEach((bks, period) => {
      groups.push({ period, age: bks[0].readAge, books: bks });
    });
    return groups;
  }, [visible]);

  const counts = useMemo(
    () => FILTERS.reduce<Record<string, number>>((acc, f) => {
      acc[f.id] = books.filter((b) => matchesFilter(b, f.id)).length;
      return acc;
    }, {}),
    [books]
  );

  const clearFilters = useCallback(() => {
    setFilter("all");
    setSelectedPeriod(null);
    setSelectedTag(null);
    setSearch("");
  }, []);

  const hasActiveFilters = filter !== "reading" || selectedPeriod || selectedTag || search;

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

      {/* Search */}
      <div className="bookshelf__search-row">
        <div className="bookshelf__search">
          <svg className="bookshelf__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by title, author, or genre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bookshelf__search-input"
          />
          {search && (
            <button className="bookshelf__search-clear" onClick={() => setSearch("")} aria-label="Clear search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Status filters */}
      <div className="bookshelf__toolbar">
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

        {hasActiveFilters && (
          <button className="bookshelf__clear-btn" onClick={clearFilters}>
            Clear all filters
          </button>
        )}
      </div>

      {/* Period pills */}
      <div className="bookshelf__periods">
        <span className="bookshelf__periods-label">Period:</span>
        <div className="bookshelf__periods-list">
          {allPeriods.map((period) => {
            const active = selectedPeriod === period;
            return (
              <button
                key={period}
                className={`bookshelf__period-pill ${active ? "bookshelf__period-pill--active" : ""}`}
                style={active ? { borderColor: accent, background: `${accent}18`, color: accent } : undefined}
                onClick={() => setSelectedPeriod(active ? null : period)}
              >
                {period}
              </button>
            );
          })}
        </div>
      </div>

      {/* Genre pills */}
      <div className="bookshelf__genres">
        <span className="bookshelf__genres-label">Genre:</span>
        <div className="bookshelf__genres-list">
          {allTags.map(([tag, count]) => {
            const active = selectedTag === tag;
            return (
              <button
                key={tag}
                className={`bookshelf__genre-pill ${active ? "bookshelf__genre-pill--active" : ""}`}
                style={active ? { borderColor: accent, background: `${accent}18`, color: accent } : undefined}
                onClick={() => setSelectedTag(active ? null : tag)}
              >
                {tag} <span className="bookshelf__genre-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline grid */}
      <div className="bookshelf__timeline">
        <AnimatePresence mode="popLayout" initial={false}>
          {groupedByPeriod.map(({ period, age, books: periodBooks }) => (
            <motion.div
              key={period}
              className="bookshelf__timeline-group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
              transition={{ duration: 0.3 }}
            >
              <div className="bookshelf__timeline-header">
                <div className="bookshelf__timeline-dot" style={{ background: accent }} />
                <div className="bookshelf__timeline-line" style={{ background: `${accent}30` }} />
                <div className="bookshelf__timeline-label">
                  <span className="bookshelf__timeline-period">{period}</span>
                  <span className="bookshelf__timeline-age">{age} years old</span>
                </div>
                <span className="bookshelf__timeline-count">{periodBooks.length} {periodBooks.length === 1 ? "book" : "books"}</span>
              </div>

              <motion.ul layout={!reduced} className="bookshelf__grid">
                {periodBooks.map((book, i) => (
                  <motion.li
                    key={book.id}
                    layout={!reduced}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.14 } }}
                    transition={{ type: "spring", stiffness: 300, damping: 30, delay: reduced ? 0 : Math.min(i * 0.04, 0.2) }}
                    className="bookshelf__grid-item"
                  >
                    <BookCard book={book} width={bookWidth} accent={accent} onOpen={() => setSelected(book)} />
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {visible.length === 0 && (
        <div className="bookshelf__empty">
          <p>No books match your filters.</p>
          <button className="bookshelf__empty-btn" onClick={clearFilters} style={{ color: accent }}>
            Show all books
          </button>
        </div>
      )}

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
