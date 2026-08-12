import { useState, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Book } from "../../../types/book";

interface ShelfSearchProps {
  books: Book[];
  onGoTo: (index: number) => void;
  onSort: (mode: SortMode) => void;
  sortMode: SortMode;
}

export type SortMode = "default" | "chronological" | "rating" | "pages";
export type FilterTag = string;

export function ShelfSearch({ books, onGoTo, onSort, sortMode }: ShelfSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    books.forEach(b => b.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [books]);

  const stats = useMemo(() => {
    const totalPages = books.reduce((s, b) => s + b.pages, 0);
    const ages = books.map(b => b.readAge);
    const years = Math.max(...ages) - Math.min(...ages) + 1;
    return { count: books.length, pages: totalPages, years };
  }, [books]);

  const results = useMemo(() => {
    if (!query && selectedTags.size === 0) return null;
    const q = query.toLowerCase();
    return books
      .map((b, i) => ({ book: b, index: i }))
      .filter(({ book }) => {
        const matchesQuery = !q ||
          book.title.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q);
        const matchesTags = selectedTags.size === 0 ||
          book.tags.some(t => selectedTags.has(t));
        return matchesQuery && matchesTags;
      });
  }, [books, query, selectedTags]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  return (
    <>
      <button
        className="shelf-search__toggle"
        onClick={() => setOpen(!open)}
        aria-label="Search and filter books"
        aria-expanded={open}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="shelf-search"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="shelf-search__stats">
              <span>{stats.count} books</span>
              <span>{stats.pages.toLocaleString()} pages</span>
              <span>{stats.years} years</span>
            </div>

            <input
              className="shelf-search__input"
              type="text"
              placeholder="Search title or author..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />

            <div className="shelf-search__tags">
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`shelf-search__tag ${selectedTags.has(tag) ? "shelf-search__tag--active" : ""}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="shelf-search__sort">
              <span className="shelf-search__sort-label">Sort:</span>
              {(["default", "chronological", "rating", "pages"] as SortMode[]).map(m => (
                <button
                  key={m}
                  className={`shelf-search__sort-btn ${sortMode === m ? "shelf-search__sort-btn--active" : ""}`}
                  onClick={() => onSort(m)}
                >
                  {m === "default" ? "Shelf" : m === "chronological" ? "Date" : m === "rating" ? "Rating" : "Length"}
                </button>
              ))}
            </div>

            {results && (
              <div className="shelf-search__results">
                {results.length === 0 ? (
                  <p className="shelf-search__empty">No matches</p>
                ) : (
                  results.map(({ book, index }) => (
                    <button
                      key={book.id}
                      className="shelf-search__result"
                      onClick={() => { onGoTo(index); setOpen(false); }}
                    >
                      <span className="shelf-search__result-title">{book.title}</span>
                      <span className="shelf-search__result-author">{book.author}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
