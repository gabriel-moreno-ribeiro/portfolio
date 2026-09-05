export type BookStatus = "reading" | "finished";
export type BookFormat = "pocket" | "standard" | "large" | "textbook";

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  year: number;
  pages: number;
  cover?: string;
  coverColor: string;
  accentColor?: string;
  format: BookFormat;
  language?: string;
  status: BookStatus;
  favorite: boolean;
  progress: number;
  rating?: number;
  review?: string;
  quote?: string;
  tags: string[];
  finishedAt?: string;
  readPeriod: string;
  readAge: number;
  link?: string;
}

export const STATUS_META: Record<BookStatus, { label: string; dot: string }> = {
  reading: { label: "Reading now", dot: "#00d9ff" },
  finished: { label: "Finished", dot: "#10b981" },
};
