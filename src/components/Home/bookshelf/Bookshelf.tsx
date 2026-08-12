import { useState, useMemo, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Book } from "../../../types/book";

export interface BookshelfProps {
  books: Book[];
  initialBookId?: string;
  onNavigate?: (bookId: string | null) => void;
}

const BOOKS_PER_SHELF = 9;

export function Bookshelf({ books, initialBookId, onNavigate }: BookshelfProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(() => {
    if (!initialBookId) return null;
    const idx = books.findIndex((b) => b.id === initialBookId);
    return idx >= 0 ? idx : null;
  });

  const shelves = useMemo(() => {
    const result: Book[][] = [];
    for (let i = 0; i < books.length; i += BOOKS_PER_SHELF) {
      result.push(books.slice(i, i + BOOKS_PER_SHELF));
    }
    return result;
  }, [books]);

  const selectedBook = selectedIndex !== null ? books[selectedIndex] : null;
  const mode = selectedIndex !== null ? "focus" : "browse";

  useEffect(() => {
    if (!onNavigate) return;
    onNavigate(selectedBook?.id || null);
  }, [selectedBook, onNavigate]);

  const handleSelect = useCallback((bookIndex: number) => {
    setSelectedIndex(bookIndex);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev === null) return 0;
      return (prev + 1) % books.length;
    });
  }, [books.length]);

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev === null) return books.length - 1;
      return (prev - 1 + books.length) % books.length;
    });
  }, [books.length]);

  // Keyboard nav in focus mode
  useEffect(() => {
    if (selectedIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      else if (e.key === "ArrowRight") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIndex, handleClose, handleNext, handlePrev]);

  return (
    <section className="bookcase" aria-label="Library">
      <div className="bookcase__shelves">
        {shelves.map((shelf, shelfIdx) => (
          <div key={shelfIdx} className="bookcase__row">
            <div className="bookcase__books">
              {shelf.map((book) => {
                const globalIdx = shelfIdx * BOOKS_PER_SHELF + shelf.indexOf(book);
                return (
                  <BookCard
                    key={book.id}
                    book={book}
                    isSelected={globalIdx === selectedIndex}
                    onClick={() => handleSelect(globalIdx)}
                  />
                );
              })}
            </div>
            <div className="bookcase__plank" />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedBook && (
          <motion.div
            className="bookcase__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
          >
            <motion.div
              className="bookcase__panel"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="bookcase__panel-close" onClick={handleClose}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {selectedBook.cover && (
                <img
                  className="bookcase__panel-cover"
                  src={selectedBook.cover}
                  alt={selectedBook.title}
                />
              )}

              <h2 className="bookcase__panel-title">{selectedBook.title}</h2>
              {selectedBook.subtitle && (
                <p className="bookcase__panel-subtitle">{selectedBook.subtitle}</p>
              )}
              <p className="bookcase__panel-meta">
                {selectedBook.author} · {selectedBook.year} · {selectedBook.pages} pages
              </p>
              <p className="bookcase__panel-period">
                {selectedBook.readPeriod} · Age {selectedBook.readAge}
                {selectedBook.language === "pt" && " · Read in Portuguese"}
              </p>

              {selectedBook.status === "reading" && (
                <div className="bookcase__panel-progress">
                  <div className="bookcase__panel-progress-bar">
                    <div
                      className="bookcase__panel-progress-fill"
                      style={{ width: `${selectedBook.progress}%` }}
                    />
                  </div>
                  <span>{selectedBook.progress}%</span>
                </div>
              )}

              {typeof selectedBook.rating === "number" && (
                <div className="bookcase__panel-rating">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <svg
                      key={i}
                      width="16" height="16" viewBox="0 0 24 24"
                      fill={i < selectedBook.rating! ? "#a74735" : "none"}
                      stroke="#a74735" strokeWidth="1.5"
                    >
                      <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5 7.3 14.03 2.6 9.45l6.5-.95L12 2.6z" />
                    </svg>
                  ))}
                </div>
              )}

              {selectedBook.review && (
                <p className="bookcase__panel-review">{selectedBook.review}</p>
              )}

              {selectedBook.quote && (
                <blockquote className="bookcase__panel-quote">
                  "{selectedBook.quote}"
                </blockquote>
              )}

              {selectedBook.tags.length > 0 && (
                <div className="bookcase__panel-tags">
                  {selectedBook.tags.map((tag) => (
                    <span key={tag} className="bookcase__panel-tag">{tag}</span>
                  ))}
                </div>
              )}

              <div className="bookcase__panel-nav">
                <button onClick={handlePrev} aria-label="Previous book">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <span>{(selectedIndex ?? 0) + 1} / {books.length}</span>
                <button onClick={handleNext} aria-label="Next book">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function BookCard({ book, isSelected, onClick }: { book: Book; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      className={`bookcase__book ${isSelected ? "bookcase__book--selected" : ""}`}
      onClick={onClick}
      aria-label={`${book.title} by ${book.author}`}
    >
      <div className="bookcase__book-spine" style={{ background: book.coverColor }}>
        <span className="bookcase__book-spine-text">{book.title}</span>
      </div>
      <div className="bookcase__book-front">
        {book.cover ? (
          <img
            src={book.cover}
            alt={book.title}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="bookcase__book-placeholder" style={{ background: book.coverColor }}>
            <span>{book.title}</span>
          </div>
        )}
      </div>
      {book.favorite && <span className="bookcase__book-fav">★</span>}
      {book.status === "reading" && <span className="bookcase__book-reading" />}
    </button>
  );
}

export default Bookshelf;
