// Catalog schema from "The Complete Shelf" (github.com/kabarza/bookshelf),
// filled from src/data/books.json.
import booksData from "../../../data/books.json";
import type { Book } from "../../../types/book";

export type BookMotif =
  | "lattice"
  | "corrosion"
  | "efficiency"
  | "network"
  | "boom"
  | "organization"
  | "schematic"
  | "flight"
  | "circuit"
  | "orbit"
  | "branches"
  | "wave"
  | "runner"
  | "gather"
  | "maze"
  | "fracture"
  | "continuum"
  | "windows"
  | "steps";

export type CatalogBook = {
  id: string;
  title: string;
  shortTitle: string;
  author: string;
  description: string;
  quote: string;
  quoteBy: string;
  format: string;
  availability: string;
  url: string;
  cover: string;
  accent: string;
  ink: string;
  motif: BookMotif;
  height: number;
  thickness: number;
  coverImage?: string;
  linkLabel?: string;
  living?: boolean;
};

const MOTIFS: BookMotif[] = [
  "lattice", "corrosion", "efficiency", "network", "boom", "organization", "schematic",
  "flight", "circuit", "orbit", "branches", "wave", "runner", "gather", "maze",
  "fracture", "continuum", "windows", "steps",
];

const HEIGHT: Record<Book["format"], number> = { pocket: 1.92, standard: 2.05, large: 2.16, textbook: 2.26 };
const FORMAT_LABEL: Record<Book["format"], string> = { pocket: "Pocket", standard: "Paperback", large: "Large format", textbook: "Textbook" };

function hash(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
  return h;
}

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((c) => c / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Push a color toward white (t > 0) or black (t < 0)
function shift(hex: string, t: number) {
  const target = t > 0 ? 255 : 0;
  const k = Math.abs(t);
  return "#" + rgb(hex).map((c) => Math.round(c + (target - c) * k).toString(16).padStart(2, "0")).join("");
}

export const stars = (rating = 0) => "★★★★★".slice(0, rating) + "☆☆☆☆☆".slice(rating);

export const books = booksData as Book[];

export const catalog: CatalogBook[] = books.map((b) => {
  const dark = luminance(b.coverColor) < 0.45;
  return {
    id: b.id,
    title: b.title,
    shortTitle: b.title,
    author: b.author,
    description: b.review ?? b.subtitle ?? `${b.title}, by ${b.author}.`,
    quote: b.quote ?? "",
    quoteBy: b.quote ? b.author : "",
    format: `${FORMAT_LABEL[b.format] ?? "Paperback"} · ${b.pages} pages · ${b.year}`,
    availability: `${b.status === "reading" ? "Reading now" : "Finished"} · ${b.readPeriod} · age ${b.readAge}`,
    url: b.link ?? "",
    cover: b.coverColor,
    accent: shift(b.coverColor, dark ? 0.45 : -0.35),
    ink: dark ? "#f4ead7" : "#25231f",
    motif: MOTIFS[hash(b.id) % MOTIFS.length],
    height: HEIGHT[b.format] ?? 2.05,
    thickness: Math.min(0.34, Math.max(0.15, 0.15 + (b.pages / 1000) * 0.18)),
    coverImage: b.cover,
    living: b.favorite,
  };
});
