// React shell for the shelf engine. Adapted from ProgressLibrary.tsx in
// "The Complete Shelf" (github.com/kabarza/bookshelf).
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { books, catalog, stars } from "./shelf/catalog";
import { ShelfEngine, type ShelfMode } from "./shelf/ShelfEngine";
import { siteConfig } from "./shelf/site-config";
import "./shelf/shelf.css";

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <span aria-hidden="true" className={`arrow-icon arrow-icon--${direction}`}>
      <span />
    </span>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function ShelfLibrary() {
  const { bookId } = useParams<{ bookId?: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ShelfEngine | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<ShelfMode>("browse");
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Preparing the shelf");

  const activeBook = catalog[activeIndex];
  const selectedBook = useMemo(() => (selectedIndex === null ? null : catalog[selectedIndex]), [selectedIndex]);
  const selectedMeta = selectedIndex === null ? null : books[selectedIndex];
  const isFocused = mode !== "browse";

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
        onReady: () => setReady(true),
      });
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
    <main className={`press-experience ${ready ? "is-ready" : ""} ${isFocused ? "is-focused" : "is-browsing"}`} id="main-content">
      <canvas
        ref={canvasRef}
        className="shelf-canvas"
        role="application"
        tabIndex={0}
        aria-label={`Interactive three-dimensional shelf of ${catalog.length} books. Drag or use the arrow keys to browse. Press Enter to inspect the selected book.`}
      />

      <header className="site-header">
        <div className="wordmark" style={{ pointerEvents: "auto" }}>
          <Link to="/" aria-label="Back to home">&larr; HOME</Link>
          <span className="wordmark__divider" />
          <span>{siteConfig.wordmark}</span>
          <span className="wordmark__divider" />
          <span>{siteConfig.collectionName} · {catalog.length} VOLUMES</span>
        </div>
      </header>

      <section className="browse-caption" aria-hidden={isFocused}>
        <p className="eyebrow">
          <span>{pad(activeIndex + 1)}</span>
          <span className="eyebrow__line" />
          <span>{pad(catalog.length)}</span>
        </p>
        <h1>{activeBook.shortTitle}</h1>
        <p className="browse-caption__author">{activeBook.author}</p>
        <button
          type="button"
          className="inspect-button"
          disabled={isFocused}
          onClick={() => engineRef.current?.focusBook(activeIndex)}
          aria-label={`Inspect ${activeBook.title}`}
        >
          <span>Inspect volume</span>
          <span aria-hidden="true">↗</span>
        </button>
      </section>

      <button type="button" className="shelf-arrow shelf-arrow--left" aria-label="Previous book" disabled={isFocused || activeIndex === 0} onClick={() => engineRef.current?.browseBy(-1)}>
        <ArrowIcon direction="left" />
      </button>
      <button type="button" className="shelf-arrow shelf-arrow--right" aria-label="Next book" disabled={isFocused || activeIndex === catalog.length - 1} onClick={() => engineRef.current?.browseBy(1)}>
        <ArrowIcon direction="right" />
      </button>

      <nav className="shelf-index" aria-label="Catalog position">
        <div className="shelf-index__ticks">
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
        <div className="input-hint" aria-hidden="true">
          <span>DRAG</span>
          <i />
          <span>SCROLL</span>
          <i />
          <span>ARROW KEYS</span>
        </div>
      </nav>

      <aside className="book-details" aria-hidden={!isFocused} aria-label={selectedBook ? `Details for ${selectedBook.title}` : "Book details"}>
        {selectedBook && selectedMeta ? (
          <div className="book-details__inner">
            <button type="button" className="back-button" onClick={() => engineRef.current?.returnToShelf()}>
              <ArrowIcon direction="left" />
              <span>Return to shelf</span>
            </button>

            <div className="book-details__position">
              <span>{pad(selectedIndex! + 1)}</span>
              <span>{pad(catalog.length)}</span>
            </div>

            <div className="book-details__copy">
              <p className="eyebrow">{siteConfig.editionEyebrow}</p>
              <h2>{selectedBook.title}</h2>
              <p className="book-details__author">{selectedBook.author}</p>
              <p className="book-details__description">{selectedBook.description}</p>

              {selectedBook.quote && (
                <blockquote>
                  <p>“{selectedBook.quote}”</p>
                  <cite>{selectedBook.quoteBy}</cite>
                </blockquote>
              )}

              <dl>
                <div>
                  <dt>Format</dt>
                  <dd>{selectedBook.format}</dd>
                </div>
                <div>
                  <dt>Read</dt>
                  <dd>{selectedBook.availability}</dd>
                </div>
                <div>
                  <dt>Rating</dt>
                  <dd aria-label={`${selectedMeta.rating ?? 0} out of 5`}>{stars(selectedMeta.rating)}</dd>
                </div>
                {selectedMeta.tags.length > 0 && (
                  <div>
                    <dt>Tags</dt>
                    <dd>{selectedMeta.tags.join(" · ")}</dd>
                  </div>
                )}
              </dl>

              {selectedBook.url && (
                <a className="official-link" href={selectedBook.url} target="_blank" rel="noreferrer">
                  <span>{selectedBook.linkLabel ?? siteConfig.bookLinkLabel}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>

            <div className="focus-controls" aria-label="Inspection controls">
              <span>Drag to orbit</span>
              <span>Pinch or scroll to zoom</span>
              <button type="button" onClick={() => engineRef.current?.resetFocusView()}>Reset view</button>
            </div>
          </div>
        ) : null}
      </aside>

      <div className="experience-status" role="status" aria-live="polite">
        <span className="experience-status__dot" />
        <span>{status}</span>
      </div>

      <div className="loading-screen" aria-hidden={ready}>
        <div className="loading-screen__mark">
          <span />
          <span />
          <span />
        </div>
        <p>Assembling {catalog.length} volumes</p>
      </div>

      <p className="independent-note">{siteConfig.independentNote}</p>
    </main>
  );
}
