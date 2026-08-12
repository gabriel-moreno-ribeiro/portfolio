import { useMemo, useState, useCallback, useEffect } from "react";
import type { Book } from "../../../types/book";
import { sortBooksForShelf } from "./shelfConfig";
import { useShelfState } from "./useShelfState";
import { ShelfCanvas } from "./ShelfCanvas";
import { ShelfOverlay } from "./ShelfOverlay";
import { ShelfSearch, type SortMode } from "./ShelfSearch";
import { ShelfAccessibility } from "./ShelfAccessibility";

export interface BookshelfProps {
  books: Book[];
  initialBookId?: string;
  onNavigate?: (bookId: string | null) => void;
}

function sortBooks(books: Book[], mode: SortMode): Book[] {
  switch (mode) {
    case "chronological":
      return [...books].sort((a, b) => a.readAge - b.readAge);
    case "rating":
      return [...books].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case "pages":
      return [...books].sort((a, b) => b.pages - a.pages);
    default:
      return sortBooksForShelf(books);
  }
}

export function Bookshelf({ books, initialBookId, onNavigate }: BookshelfProps) {
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const sorted = useMemo(() => sortBooks(books, sortMode), [books, sortMode]);

  const initialIndex = useMemo(() => {
    if (!initialBookId) return 0;
    const idx = sorted.findIndex((b) => b.id === initialBookId);
    return idx >= 0 ? idx : 0;
  }, [initialBookId, sorted]);

  const state = useShelfState(sorted, initialIndex);
  const [panelWidthPx, setPanelWidthPx] = useState(0);

  useEffect(() => {
    if (!onNavigate) return;
    const book = sorted[state.currentIndex];
    if (book) onNavigate(state.mode === "focus" ? book.id : null);
  }, [state.currentIndex, state.mode, sorted, onNavigate]);

  const handleBookClick = (index: number) => {
    if (index === state.currentIndex) {
      state.focus();
    } else {
      state.goTo(index);
    }
  };

  const handlePanelResize = useCallback((w: number) => {
    setPanelWidthPx(w);
  }, []);

  const handleSort = useCallback((mode: SortMode) => {
    setSortMode(mode);
  }, []);

  return (
    <section
      className="shelf-section"
      aria-label="Library"
      ref={state.containerRef as React.RefObject<HTMLElement>}
    >
      <ShelfCanvas
        books={sorted}
        currentIndex={state.currentIndex}
        mode={state.mode}
        panelWidthPx={panelWidthPx}
        dragOffset={state.dragOffset}
        onBookClick={handleBookClick}
      />
      <ShelfOverlay
        book={state.currentBook}
        bookCount={sorted.length}
        currentIndex={state.currentIndex}
        mode={state.mode}
        onNext={state.next}
        onPrev={state.prev}
        onGoTo={state.goTo}
        onFocus={state.focus}
        onUnfocus={state.unfocus}
        onPanelResize={handlePanelResize}
      />
      <ShelfSearch
        books={sorted}
        onGoTo={state.goTo}
        onSort={handleSort}
        sortMode={sortMode}
      />
      <ShelfAccessibility
        books={sorted}
        currentIndex={state.currentIndex}
        onGoTo={state.goTo}
        onFocus={state.focus}
      />
    </section>
  );
}

export default Bookshelf;
