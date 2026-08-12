import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { useNavigate, useParams } from "react-router-dom";
import type { Book } from "../../types/book";
import { LibraryScene } from "./LibraryScene";
import { BrowseOverlay, DetailPanel, FallbackGrid } from "./LibraryOverlay";
import { useThemeStore } from "../../store/themeStore";
import booksData from "../../data/books.json";

const books = booksData as Book[];

export function Library() {
  const { bookId } = useParams<{ bookId?: string }>();
  const navigate = useNavigate();
  const { darkMode } = useThemeStore();
  const theme = darkMode ? "dark" : "light";

  const initIndex = useMemo(() => {
    if (!bookId) return 0;
    const idx = books.findIndex(b => b.id === bookId);
    return idx >= 0 ? idx : 0;
  }, [bookId]);

  const [selectedIndex, setSelectedIndex] = useState(initIndex);
  const [focusMode, setFocusMode] = useState(false);
  const [panelWidthPx, setPanelWidthPx] = useState(0);
  const [webglFailed, setWebglFailed] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const currentBook = books[selectedIndex];

  // SEO meta
  useEffect(() => {
    if (focusMode && currentBook) {
      document.title = `${currentBook.title} — Library`;
      navigate(`/library/${currentBook.id}`, { replace: true });
    } else {
      document.title = "Library — Gabriel Moreno Ribeiro";
      navigate("/library", { replace: true });
    }
  }, [focusMode, currentBook, navigate]);

  const handleIndexChange = useCallback((i: number) => {
    setSelectedIndex(i);
    setFocusMode(false);
  }, []);

  const handleFocus = useCallback((i: number) => {
    setSelectedIndex(i);
    setFocusMode(true);
  }, []);

  const handleClose = useCallback(() => {
    setFocusMode(false);
  }, []);

  const handleNext = useCallback(() => {
    setSelectedIndex(i => (i + 1) % books.length);
  }, []);

  const handlePrev = useCallback(() => {
    setSelectedIndex(i => (i - 1 + books.length) % books.length);
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape" && focusMode) handleClose();
      else if (e.key === "ArrowRight") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "Enter" && !focusMode) handleFocus(selectedIndex);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusMode, selectedIndex, handleClose, handleNext, handlePrev, handleFocus]);

  // Pointer drag (for canvas area)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let startX = 0, startTime = 0;
    let dragging = false;

    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("button, a, .lib-panel, .lib-browse__caption")) return;
      startX = e.clientX; startTime = Date.now(); dragging = true;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return; dragging = false;
      const dx = e.clientX - startX;
      const dt = Date.now() - startTime;
      if (Math.abs(dx) < 8) return; // click, not drag
      if (Math.abs(dx) > 30 && dt < 500) {
        if (dx < 0) handleNext(); else handlePrev();
      }
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    return () => { el.removeEventListener("pointerdown", onDown); el.removeEventListener("pointerup", onUp); };
  }, [handleNext, handlePrev]);

  // Wheel nav
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      if (focusMode) return;
      e.preventDefault();
      acc += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (acc > 60) { handleNext(); acc = 0; }
      else if (acc < -60) { handlePrev(); acc = 0; }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [focusMode, handleNext, handlePrev]);

  return (
    <section ref={sectionRef} className="lib-section" id="main-content" aria-label="Library">
      <h1 className="sr-only">Gabriel's Library</h1>

      {webglFailed ? (
        <FallbackGrid books={books} onSelect={i => { setSelectedIndex(i); setFocusMode(true); }} />
      ) : (
        <LibraryScene
          books={books}
          selectedIndex={selectedIndex}
          onIndexChange={handleIndexChange}
          onFocus={handleFocus}
          panelWidthPx={panelWidthPx}
          theme={theme}
          webglFailed={webglFailed}
          onWebglFailed={() => setWebglFailed(true)}
        />
      )}

      {!focusMode && !webglFailed && (
        <BrowseOverlay
          book={currentBook}
          bookIndex={selectedIndex}
          total={books.length}
          onPrev={handlePrev}
          onNext={handleNext}
          onInspect={() => handleFocus(selectedIndex)}
        />
      )}

      <AnimatePresence>
        {focusMode && currentBook && (
          <DetailPanel
            book={currentBook}
            bookIndex={selectedIndex}
            total={books.length}
            onClose={handleClose}
            onPrev={() => { handlePrev(); }}
            onNext={() => { handleNext(); }}
            onResize={setPanelWidthPx}
          />
        )}
      </AnimatePresence>

      {/* Screen reader accessible list */}
      <ul className="sr-only" role="listbox" aria-label="Books">
        {books.map((book, i) => (
          <li
            key={book.id}
            role="option"
            aria-selected={i === selectedIndex}
            tabIndex={i === selectedIndex ? 0 : -1}
            onClick={() => handleIndexChange(i)}
          >
            {book.title} by {book.author}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Library;
