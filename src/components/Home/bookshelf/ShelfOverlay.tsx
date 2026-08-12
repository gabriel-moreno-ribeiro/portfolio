import { useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Book } from "../../../types/book";
import { STATUS_META } from "../../../types/book";
import type { ShelfMode } from "./useShelfState";

interface ShelfOverlayProps {
  book: Book;
  bookCount: number;
  currentIndex: number;
  mode: ShelfMode;
  onNext: () => void;
  onPrev: () => void;
  onGoTo: (i: number) => void;
  onFocus: () => void;
  onUnfocus: () => void;
  onPanelResize: (width: number) => void;
}

export function ShelfOverlay({
  book,
  bookCount,
  currentIndex,
  mode,
  onNext,
  onPrev,
  onGoTo,
  onFocus,
  onUnfocus,
  onPanelResize,
}: ShelfOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== "focus") {
      onPanelResize(0);
      return;
    }
    const measure = () => {
      if (panelRef.current) {
        onPanelResize(panelRef.current.getBoundingClientRect().width);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [mode, onPanelResize]);

  return (
    <div className="shelf-overlay">
      {/* Dim overlay when in focus */}
      <AnimatePresence>
        {mode === "focus" && (
          <motion.div
            className="shelf-overlay__dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Browse caption (left side) */}
      <AnimatePresence mode="popLayout">
        {mode === "browse" && (
          <motion.div
            key={`caption-${book.id}`}
            className="shelf-overlay__caption"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="shelf-overlay__eyebrow">
              {book.author}
            </p>
            <h2 className="shelf-overlay__title">{book.title}</h2>
            {book.subtitle && (
              <p className="shelf-overlay__subtitle">{book.subtitle}</p>
            )}
            <button className="shelf-overlay__inspect-btn" onClick={onFocus}>
              Inspect volume
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation arrows */}
      {mode === "browse" && (
        <>
          <button
            className="shelf-overlay__arrow shelf-overlay__arrow--left"
            onClick={onPrev}
            aria-label="Previous book"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            className="shelf-overlay__arrow shelf-overlay__arrow--right"
            onClick={onNext}
            aria-label="Next book"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Bottom tick marks */}
      {mode === "browse" && (
        <div className="shelf-overlay__ticks">
          {Array.from({ length: bookCount }, (_, i) => (
            <button
              key={i}
              className={`shelf-overlay__tick ${i === currentIndex ? "shelf-overlay__tick--active" : ""}`}
              onClick={() => onGoTo(i)}
              aria-label={`Go to book ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Input hint */}
      {mode === "browse" && (
        <p className="shelf-overlay__hint">
          DRAG / SCROLL / ARROW KEYS
        </p>
      )}

      {/* Focus detail panel */}
      <AnimatePresence>
        {mode === "focus" && (
          <motion.div
            ref={panelRef}
            className="shelf-overlay__detail"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <button className="shelf-overlay__back-btn" onClick={onUnfocus}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Return to shelf
            </button>

            {/* Cover image at top (visible on mobile where 3D book is hidden) */}
            {book.cover && (
              <div className="shelf-overlay__detail-cover">
                <img src={book.cover} alt={book.title} />
              </div>
            )}

            <div className="shelf-overlay__detail-header">
              <StatusPill book={book} />
              {book.favorite && <FavBadge />}
            </div>

            <h2 className="shelf-overlay__detail-title">{book.title}</h2>
            {book.subtitle && (
              <p className="shelf-overlay__detail-subtitle">{book.subtitle}</p>
            )}
            <p className="shelf-overlay__detail-meta">
              {book.author} · {book.year} · {book.pages} pages
            </p>

            <p className="shelf-overlay__detail-period">
              {book.readPeriod} · Age {book.readAge}
              {book.language === "pt" && " · Read in Portuguese"}
            </p>

            {book.status === "reading" && (
              <div className="shelf-overlay__progress">
                <div className="shelf-overlay__progress-bar">
                  <motion.div
                    className="shelf-overlay__progress-fill"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: book.progress / 100 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  />
                </div>
                <span className="shelf-overlay__progress-label">{book.progress}%</span>
              </div>
            )}

            {typeof book.rating === "number" && (
              <div className="shelf-overlay__rating">
                <Stars value={book.rating} />
              </div>
            )}

            {book.review && (
              <p className="shelf-overlay__review">{book.review}</p>
            )}

            {book.quote && (
              <blockquote className="shelf-overlay__quote">
                "{book.quote}"
              </blockquote>
            )}

            {book.tags.length > 0 && (
              <div className="shelf-overlay__tags">
                {book.tags.map((tag) => (
                  <span key={tag} className="shelf-overlay__tag">{tag}</span>
                ))}
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusPill({ book }: { book: Book }) {
  const meta = STATUS_META[book.status];
  return (
    <span className="shelf-overlay__status-pill">
      <span className="shelf-overlay__status-dot" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}

function FavBadge() {
  return (
    <span className="shelf-overlay__fav-badge">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5 7.3 14.03 2.6 9.45l6.5-.95L12 2.6z" />
      </svg>
      Favorite
    </span>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="shelf-overlay__stars">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(1, Math.max(0, value - i));
        return (
          <span key={i} className="shelf-overlay__star">
            <svg width="14" height="14" viewBox="0 0 24 24" fill={fill >= 1 ? "#a74735" : "none"} stroke="#a74735" strokeWidth="1.5">
              <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5 7.3 14.03 2.6 9.45l6.5-.95L12 2.6z" />
            </svg>
          </span>
        );
      })}
      <span className="shelf-overlay__rating-num">{value.toFixed(1)}</span>
    </div>
  );
}
