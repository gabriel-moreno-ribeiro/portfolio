import type { Book } from "../../../types/book";
import { STATUS_META } from "../../../types/book";

interface ShelfAccessibilityProps {
  books: Book[];
  currentIndex: number;
  onGoTo: (index: number) => void;
  onFocus: () => void;
}

export function ShelfAccessibility({ books, currentIndex, onGoTo, onFocus }: ShelfAccessibilityProps) {
  return (
    <ul className="sr-only" role="listbox" aria-label="Book list" aria-activedescendant={`book-${books[currentIndex]?.id}`}>
      {books.map((book, i) => (
        <li
          key={book.id}
          id={`book-${book.id}`}
          role="option"
          aria-selected={i === currentIndex}
          tabIndex={i === currentIndex ? 0 : -1}
          onFocus={() => onGoTo(i)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (i === currentIndex) onFocus();
              else onGoTo(i);
            }
          }}
        >
          {book.title} by {book.author} - {STATUS_META[book.status]?.label}
          {book.rating ? `, rated ${book.rating}/5` : ""}
        </li>
      ))}
    </ul>
  );
}
