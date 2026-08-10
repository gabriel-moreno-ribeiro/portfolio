import { Bookshelf } from "./bookshelf";
import type { Book } from "../../types/book";
import booksData from "../../data/books.json";

function Books() {
  return <Bookshelf books={booksData as Book[]} accent="#d4a040" />;
}

export default Books;
