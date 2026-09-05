// React shell for the shelf engine. Structure adapted from ProgressLibrary.tsx in
// "The Complete Shelf" (github.com/kabarza/bookshelf); styling follows the site.
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiArrowUpRight } from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import { useThemeStore } from "../../store/themeStore";
import { books, catalog, stars } from "./shelf/catalog";
import { ShelfEngine, type ShelfMode } from "./shelf/ShelfEngine";
import { siteConfig } from "./shelf/site-config";
import "../../styles/components/library/library.scss";

const pad = (n: number) => String(n).padStart(2, "0");
const EASE = [0.22, 1, 0.36, 1] as const;

export default function ShelfLibrary() {
  const { bookId } = useParams<{ bookId?: string }>();
  const navigate = useNavigate();
  const { darkMode } = useThemeStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ShelfEngine | null>(null);
  const themeRef = useRef<"light" | "dark">(darkMode ? "dark" : "light");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<ShelfMode>("browse");
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Loading the shelf");

  const activeBook = catalog[activeIndex];
  const selectedBook = useMemo(() => (selectedIndex === null ? null : catalog[selectedIndex]), [selectedIndex]);
  const selectedMeta = selectedIndex === null ? null : books[selectedIndex];
  const isFocused = mode !== "browse";

  // Engine lifecycle
  useEffect(() => {
    let cancelled = false;
    let engine: ShelfEngine | null = null;
    const initialIndex = Math.max(0, catalog.findIndex((b) => b.id === bookId));

    async function start() {
      if (!canvasRef.current) return;
      await document.fonts.ready;
      if (cancelled || !canvasRef.current) return;

      engine = new ShelfEngine(canvasRef.current, catalog, {
        onActiveIndex: setActiveIndex,
        onMode: (nextMode, index) => {
          setMode(nextMode);
          setSelectedIndex(index);
        },
        onStatus: setStatus,
        onReady: () => {
          setReady(true);
          setStatus(`${catalog.length} books`);
        },
      });
      engine.setTheme(themeRef.current);
      engineRef.current = engine;
      if (initialIndex > 0 || bookId) {
        engine.browseTo(initialIndex);
        if (bookId) engine.focusBook(initialIndex);
      }
    }

    void start();
    return () => {
      cancelled = true;
      engine?.dispose();
      engineRef.current = null;
    };
    // The engine owns navigation after mount; the URL only seeds the first book.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scene palette follows the site theme
  useEffect(() => {
    themeRef.current = darkMode ? "dark" : "light";
    engineRef.current?.setTheme(themeRef.current);
  }, [darkMode]);

  // URL + title follow the engine
  useEffect(() => {
    if (isFocused && selectedBook) {
      document.title = `${selectedBook.title} — Library`;
      navigate(`/library/${selectedBook.id}`, { replace: true });
    } else {
      document.title = siteConfig.title;
      navigate("/library", { replace: true });
    }
  }, [isFocused, selectedBook, navigate]);

  // Keyboard works without focusing the canvas first
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t === canvasRef.current || t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
      const engine = engineRef.current;
      if (!engine) return;
      if (e.key === "Escape") engine.returnToShelf();
      else if (e.key === "ArrowRight") { e.preventDefault(); engine.browseBy(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); engine.browseBy(-1); }
      else if (e.key === "Enter") engine.focusBook();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className={`library ${ready ? "library--ready" : ""} ${isFocused ? "library--focused" : ""}`} id="main-content">
      <canvas
        ref={canvasRef}
        className="library__canvas"
        role="application"
        tabIndex={0}
        data-drag-me={true}
        aria-label={`A shelf of ${catalog.length} books. Drag or use the arrow keys to browse. Press Enter to open the selected book.`}
      />

      <div className="library__nav">
        <Navbar />
      </div>

      <div className="library__eyebrow">
        <p className="library__crumb">
          <Link to="/" className="page-back"><FiArrowLeft aria-hidden="true" /> Home</Link>
          <span>Library</span>
          <span>{catalog.length} books</span>
        </p>
        <p className="sr-only" role="status" aria-live="polite">{status}</p>
      </div>

      <section className="library__caption" aria-hidden={isFocused}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={activeBook.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <p className="library__index">
              <span>{pad(activeIndex + 1)}</span>
              <i />
              <span>{pad(catalog.length)}</span>
            </p>
            <h1 className="library__title">{activeBook.shortTitle}</h1>
            <p className="library__author">{activeBook.author}</p>
            <button
              type="button"
              className="library__pill library__inspect"
              disabled={isFocused}
              onClick={() => engineRef.current?.focusBook(activeIndex)}
              aria-label={`Open ${activeBook.title}`}
            >
              Open
              <FiArrowUpRight aria-hidden="true" />
            </button>
          </motion.div>
        </AnimatePresence>
      </section>

      <button type="button" className="library__arrow library__arrow--left" aria-label="Previous book" disabled={isFocused || activeIndex === 0} onClick={() => engineRef.current?.browseBy(-1)}>
        <FiArrowLeft />
      </button>
      <button type="button" className="library__arrow library__arrow--right" aria-label="Next book" disabled={isFocused || activeIndex === catalog.length - 1} onClick={() => engineRef.current?.browseBy(1)}>
        <FiArrowRight />
      </button>

      <nav className="library__index-bar" aria-label="Catalog position">
        <div className="library__ticks">
          {catalog.map((book, index) => (
            <button
              key={book.id}
              type="button"
              className={index === activeIndex ? "is-active" : ""}
              aria-label={`Browse to ${book.title}`}
              aria-current={index === activeIndex ? "true" : undefined}
              disabled={isFocused}
              onClick={() => engineRef.current?.browseTo(index)}
            >
              <span />
            </button>
          ))}
        </div>
        <p className="library__hint" aria-hidden="true">Drag, scroll, or use the arrow keys</p>
      </nav>

      <aside className="library__panel" aria-hidden={!isFocused} aria-label={selectedBook ? `Details for ${selectedBook.title}` : "Book details"}>
        {selectedBook && selectedMeta ? (
          <div className="library__panel-inner">
            <div className="library__panel-top">
              <button type="button" className="library__pill library__back" onClick={() => engineRef.current?.returnToShelf()}>
                <FiArrowLeft aria-hidden="true" />
                Back to the shelf
              </button>
              <p className="library__panel-pos">
                <span>{pad(selectedIndex! + 1)}</span>
                <i />
                <span>{pad(catalog.length)}</span>
              </p>
            </div>

            <motion.div
              key={selectedBook.id}
              className="library__panel-copy"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.12 }}
            >
              <h2 className="library__panel-title">{selectedBook.title}</h2>
              <p className="library__panel-author">{selectedBook.author}</p>
              <p className="library__panel-desc">{selectedBook.description}</p>

              {selectedBook.quote && (
                <blockquote className="library__quote">
                  <p>“{selectedBook.quote}”</p>
                  <cite>{selectedBook.quoteBy}</cite>
                </blockquote>
              )}

              <dl className="library__facts">
                <div>
                  <dt>Edition</dt>
                  <dd>{selectedBook.format}</dd>
                </div>
                <div>
                  <dt>Read</dt>
                  <dd>{selectedBook.availability}</dd>
                </div>
                <div>
                  <dt>Rating</dt>
                  <dd className="library__stars" aria-label={`${selectedMeta.rating ?? 0} out of 5`}>{stars(selectedMeta.rating)}</dd>
                </div>
                {selectedMeta.tags.length > 0 && (
                  <div>
                    <dt>Tags</dt>
                    <dd className="library__tags">
                      {selectedMeta.tags.map((t) => <span key={t}>{t}</span>)}
                    </dd>
                  </div>
                )}
              </dl>

              {selectedBook.url && (
                <a className="library__pill library__link" href={selectedBook.url} target="_blank" rel="noreferrer">
                  {selectedBook.linkLabel ?? siteConfig.bookLinkLabel}
                  <FiArrowUpRight aria-hidden="true" />
                </a>
              )}
            </motion.div>

            <div className="library__controls" aria-label="Inspection controls">
              <span>Drag to turn it</span>
              <span>Scroll to zoom</span>
              <button type="button" onClick={() => engineRef.current?.resetFocusView()}>Reset view</button>
            </div>
          </div>
        ) : null}
      </aside>

      <div className="library__loading" aria-hidden={ready}>
        <div className="library__loading-mark">
          <span />
          <span />
          <span />
        </div>
        <p>Loading the shelf</p>
      </div>

      <p className="library__credit">
        Shelf engine adapted from{" "}
        <a href="https://github.com/kabarza/bookshelf" target="_blank" rel="noreferrer">The Complete Shelf</a>
      </p>

      <ul className="sr-only" aria-label="Books">
        {books.map((book) => (
          <li key={book.id}>{book.title} by {book.author}</li>
        ))}
      </ul>
    </main>
  );
}
