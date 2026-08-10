import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Book } from "../../../types/book";
import { STATUS_META } from "../../../types/book";
import { Book3D } from "./Book3D";

export interface BookDetailProps {
  book: Book | null;
  onClose: () => void;
  accent?: string;
}

export function BookDetail({ book, onClose, accent = "#00d9ff" }: BookDetailProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!book) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const prevOverflow = document.body.style.overflow;
    const prevPad = document.body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPad;
    };
  }, [book, onClose]);

  return (
    <AnimatePresence>
      {book && (
        <div className="bookshelf-modal__backdrop">
          <motion.div
            className="bookshelf-modal__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Details for ${book.title}`}
            tabIndex={-1}
            className="bookshelf-modal__panel"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            drag={reduced ? false : "y"}
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 130 || info.velocity.y > 700) onClose();
            }}
          >
            <div className="bookshelf-modal__accent-line" style={{ background: `linear-gradient(to right, transparent, ${accent}66 30%, ${accent}66 70%, transparent)` }} />

            <div className="bookshelf-modal__grabber" />

            <button onClick={onClose} aria-label="Close" className="bookshelf-modal__close">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M1 1l13 13M14 1L1 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <div className="bookshelf-modal__content">
              <div className="bookshelf-modal__cover-area">
                <Book3D book={book} width={155} accent={accent} showcase />
              </div>

              <div className="bookshelf-modal__info">
                <StatusRow book={book} accent={accent} />

                <h3 className="bookshelf-modal__title">{book.title}</h3>
                {book.subtitle && <p className="bookshelf-modal__subtitle">{book.subtitle}</p>}
                <p className="bookshelf-modal__meta">
                  {book.author} &middot; {book.year} &middot; {book.pages} pages
                </p>

                {(book.status === "reading" || typeof book.rating === "number") && (
                  <div className="bookshelf-modal__stats">
                    {book.status === "reading" && <ProgressRing value={book.progress} accent={accent} />}
                    {typeof book.rating === "number" && (
                      <div>
                        <p className="bookshelf-modal__stat-label">Rating</p>
                        <Stars value={book.rating} accent={accent} />
                      </div>
                    )}
                  </div>
                )}

                {book.review && <p className="bookshelf-modal__review">{book.review}</p>}

                {book.quote && (
                  <blockquote className="bookshelf-modal__quote" style={{ borderColor: `${accent}59` }}>
                    "{book.quote}"
                  </blockquote>
                )}

                <div className="bookshelf-modal__tags">
                  {book.tags.map((tag) => (
                    <span key={tag} className="bookshelf-modal__tag">{tag}</span>
                  ))}
                </div>

                {book.link && (
                  <a href={book.link} target="_blank" rel="noreferrer noopener" className="bookshelf-modal__link" style={{ color: accent }}>
                    Learn more
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 11L11 2M11 2H4M11 2v7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function StatusRow({ book, accent }: { book: Book; accent: string }) {
  const meta = STATUS_META[book.status];
  return (
    <div className="bookshelf-modal__status-row">
      <span className="bookshelf-modal__status-pill">
        <span className="bookshelf-modal__status-dot" style={{ background: meta.dot, boxShadow: book.status === "reading" ? `0 0 8px ${meta.dot}` : undefined }} />
        {meta.label}
      </span>
      {book.favorite && (
        <span className="bookshelf-modal__fav-pill" style={{ borderColor: `${accent}40`, background: `${accent}14`, color: accent }}>
          <StarIcon filled size={9} /> Favorite
        </span>
      )}
      {book.finishedAt && <span className="bookshelf-modal__date">{formatDate(book.finishedAt)}</span>}
    </div>
  );
}

function ProgressRing({ value, accent }: { value: number; accent: string }) {
  const r = 21;
  const c = 2 * Math.PI * r;
  const reduced = useReducedMotion();
  return (
    <div className="bookshelf-modal__progress">
      <div style={{ position: "relative", width: 52, height: 52 }}>
        <svg viewBox="0 0 52 52" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
          <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="3" />
          <motion.circle
            cx="26" cy="26" r={r} fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: reduced ? c * (1 - value / 100) : c }}
            animate={{ strokeDashoffset: c * (1 - value / 100) }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
          />
        </svg>
        <span className="bookshelf-modal__progress-text">{value}%</span>
      </div>
      <p className="bookshelf-modal__stat-label">Progress</p>
    </div>
  );
}

function Stars({ value, accent }: { value: number; accent: string }) {
  return (
    <div className="bookshelf-modal__stars" aria-label={`Rating ${value} of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(1, Math.max(0, value - i));
        return (
          <span key={i} style={{ position: "relative", display: "block", width: 14, height: 14 }}>
            <span style={{ position: "absolute", inset: 0, color: "rgba(255,255,255,0.15)" }}><StarIcon filled size={14} /></span>
            <span style={{ position: "absolute", inset: 0, overflow: "hidden", width: `${fill * 100}%`, color: accent }}><StarIcon filled size={14} /></span>
          </span>
        );
      })}
      <span className="bookshelf-modal__rating-num">{value.toFixed(1)}</span>
    </div>
  );
}

function StarIcon({ filled, size = 14 }: { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden>
      <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5 7.3 14.03 2.6 9.45l6.5-.95L12 2.6z" stroke="currentColor" strokeWidth={filled ? 0 : 1.5} strokeLinejoin="round" />
    </svg>
  );
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(d);
}

export default BookDetail;
