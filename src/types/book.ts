export type BookStatus = "reading" | "finished" | "want-to-read";
export type BookFilter = "all" | "reading" | "finished" | "favorites";

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  year: number;
  pages: number;
  cover?: string;
  coverColor: string;
  textColor?: string;
  status: BookStatus;
  favorite: boolean;
  progress: number;
  rating?: number;
  review?: string;
  quote?: string;
  tags: string[];
  finishedAt?: string;
  link?: string;
}

export interface BookshelfProps {
  books: Book[];
  title?: string;
  description?: string;
  accent?: string;
  bookWidth?: number;
}

export const STATUS_META: Record<BookStatus, { label: string; short: string; dot: string }> = {
  reading: { label: "Reading now", short: "Reading", dot: "#00d9ff" },
  finished: { label: "Finished", short: "Read", dot: "#10b981" },
  "want-to-read": { label: "Want to read", short: "Queue", dot: "#606060" },
};

export const FILTERS: { id: BookFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "reading", label: "Reading" },
  { id: "finished", label: "Finished" },
  { id: "favorites", label: "Favorites" },
];

export function matchesFilter(book: Book, filter: BookFilter): boolean {
  switch (filter) {
    case "all": return true;
    case "favorites": return book.favorite;
    case "reading": return book.status === "reading";
    case "finished": return book.status === "finished";
    default: return true;
  }
}
