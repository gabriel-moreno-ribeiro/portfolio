import { Bookshelf } from "./bookshelf";
import type { Book } from "../../types/book";
import booksData from "../../data/books.json";

interface BooksProps {
  initialBookId?: string;
  onNavigate?: (bookId: string | null) => void;
}

function Books({ initialBookId, onNavigate }: BooksProps) {
  return (
    <Bookshelf
      books={booksData as Book[]}
      initialBookId={initialBookId}
      onNavigate={onNavigate}
    />
  );
}

export default Books;
