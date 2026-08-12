import { useRef, useEffect, useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Book } from "../../types/book";
import { STATUS_META } from "../../types/book";

interface BrowseOverlayProps {
  book: Book;
  bookIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onInspect: () => void;
}

export function BrowseOverlay({ book, bookIndex, total, onPrev, onNext, onInspect }: BrowseOverlayProps) {
  return (
    <div className="lib-browse">
      <div className="lib-browse__scrim" />
      <AnimatePresence mode="popLayout">
        <motion.div
          key={book.id}
          className="lib-browse__caption"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="lib-browse__eyebrow">{book.author}</p>
          <h2 className="lib-browse__title">{book.title}</h2>
          {book.subtitle && <p className="lib-browse__subtitle">{book.subtitle}</p>}
          <button className="lib-browse__inspect" onClick={onInspect}>
            Inspect
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </motion.div>
      </AnimatePresence>

      <div className="lib-browse__nav">
        <button onClick={onPrev} aria-label="Previous book">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <span>{bookIndex + 1} / {total}</span>
        <button onClick={onNext} aria-label="Next book">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>

      <p className="lib-browse__hint">DRAG · SCROLL · ARROW KEYS</p>
    </div>
  );
}

interface PanelProps {
  book: Book;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  bookIndex: number;
  total: number;
  onResize: (w: number) => void;
}

export function DetailPanel({ book, onClose, onPrev, onNext, bookIndex, total, onResize }: PanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measure = () => {
      if (panelRef.current) onResize(panelRef.current.getBoundingClientRect().width);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => { window.removeEventListener("resize", measure); onResize(0); };
  }, [onResize]);

  const meta = STATUS_META[book.status];

  return (
    <motion.div
      ref={panelRef}
      className="lib-panel"
      initial={{ opacity: 0, x: 48 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 36 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <button className="lib-panel__back" onClick={onClose}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        Back to shelf
      </button>

      {book.cover && (
        <div className="lib-panel__cover-wrap">
          <img className="lib-panel__cover" src={book.cover} alt={book.title} />
        </div>
      )}

      <div className="lib-panel__badges">
        <span className="lib-panel__status">
          <span className="lib-panel__status-dot" style={{ background: meta.dot }} />
          {meta.label}
        </span>
        {book.favorite && (
          <span className="lib-panel__fav">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5 7.3 14.03 2.6 9.45l6.5-.95L12 2.6z" /></svg>
            Favorite
          </span>
        )}
        {book.language === "pt" && <span className="lib-panel__lang">Read in Portuguese</span>}
      </div>

      <h2 className="lib-panel__title">{book.title}</h2>
      {book.subtitle && <p className="lib-panel__subtitle">{book.subtitle}</p>}
      <p className="lib-panel__meta">{book.author} · {book.year} · {book.pages} pages</p>
      <p className="lib-panel__period">{book.readPeriod} · Age {book.readAge}</p>

      {book.status === "reading" && (
        <div className="lib-panel__progress">
          <div className="lib-panel__progress-track">
            <div className="lib-panel__progress-fill" style={{ width: `${book.progress}%` }} />
          </div>
          <span>{book.progress}%</span>
        </div>
      )}

      {typeof book.rating === "number" && (
        <div className="lib-panel__stars">
          {[1, 2, 3, 4, 5].map(i => (
            <svg key={i} width="15" height="15" viewBox="0 0 24 24"
              fill={i <= book.rating! ? "var(--accent)" : "none"}
              stroke="var(--accent)" strokeWidth="1.5">
              <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5 7.3 14.03 2.6 9.45l6.5-.95L12 2.6z" />
            </svg>
          ))}
        </div>
      )}

      {book.review && <p className="lib-panel__review">{book.review}</p>}

      {book.quote && (
        <blockquote className="lib-panel__quote">"{book.quote}"</blockquote>
      )}

      {book.tags.length > 0 && (
        <div className="lib-panel__tags">
          {book.tags.map(tag => (
            <span key={tag} className="lib-panel__tag">{tag}</span>
          ))}
        </div>
      )}

      {book.link && (
        <a className="lib-panel__link" href={book.link} target="_blank" rel="noopener noreferrer">
          External link
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
        </a>
      )}

      <div className="lib-panel__nav">
        <button onClick={onPrev} aria-label="Previous">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <span>{bookIndex + 1} / {total}</span>
        <button onClick={onNext} aria-label="Next">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
    </motion.div>
  );
}

// Fallback 2D grid when WebGL is not available
interface FallbackGridProps {
  books: Book[];
  onSelect: (i: number) => void;
}

export function FallbackGrid({ books, onSelect }: FallbackGridProps) {
  return (
    <div className="lib-fallback">
      {books.map((book, i) => (
        <button key={book.id} className="lib-fallback__book" onClick={() => onSelect(i)}>
          {book.cover
            ? <img src={book.cover} alt={book.title} loading="lazy" />
            : <div className="lib-fallback__color" style={{ background: book.coverColor }} />}
          <span>{book.title}</span>
        </button>
      ))}
    </div>
  );
}
