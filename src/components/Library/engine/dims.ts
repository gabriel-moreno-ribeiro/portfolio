import type { Book, BookFormat } from "../../../types/book";

// Format dimension ranges (world units)
const FORMAT_RANGES: Record<BookFormat, { hMin: number; hMax: number; dMin: number; dMax: number }> = {
  pocket:   { hMin: 1.75, hMax: 1.90, dMin: 1.10, dMax: 1.20 },
  standard: { hMin: 1.90, hMax: 2.15, dMin: 1.20, dMax: 1.35 },
  large:    { hMin: 2.10, hMax: 2.35, dMin: 1.30, dMax: 1.40 },
  textbook: { hMin: 2.20, hMax: 2.45, dMin: 1.35, dMax: 1.45 },
};

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function lcg(seed: number): () => number {
  let s = seed || 1;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296; };
}

export interface BookDims {
  thickness: number; // X (spine width)
  height: number;    // Y
  depth: number;     // Z (cover width)
  tiltDeg: number;   // small lean angle
}

export function getBookDims(book: Book): BookDims {
  const rng = lcg(hashId(book.id));
  const ratio = Math.min(book.pages / 1200, 1);
  const baseT = 0.10 + 0.36 * Math.pow(ratio, 0.55);
  const jitter = 1 + (rng() - 0.5) * 0.2;
  const thickness = Math.min(0.46, Math.max(0.10, baseT * jitter));

  const range = FORMAT_RANGES[book.format ?? "standard"];
  const height = range.hMin + (range.hMax - range.hMin) * rng();
  const depth = range.dMin + (range.dMax - range.dMin) * rng();

  // Subtle lean: ~30% of books tilt 2-6 degrees
  const r4 = rng();
  const tiltDeg = r4 < 0.3 ? (rng() * 4 + 2) * (rng() < 0.5 ? 1 : -1) : 0;

  return { thickness, height, depth, tiltDeg };
}

export interface FinishProps {
  roughness: number;
  metalness: number;
  clearcoat: number;
  pageColor: string;
}

export function getBookFinish(book: Book): FinishProps {
  const rng = lcg(hashId(book.id) ^ 0xdeadbeef);
  rng(); rng(); rng(); // skip dim values
  const v = rng();
  const roughness = v < 0.2 ? 0.35 : v > 0.8 ? 0.85 : 0.62;
  const clearcoat = v < 0.2 ? 0.15 : 0;
  const metalness = 0;

  // Page color: slight variation around warm cream
  const base = { r: 0xe9, g: 0xdf, b: 0xca };
  const r5 = rng();
  const pr = Math.round(base.r + (r5 - 0.5) * 12);
  const pg = Math.round(base.g + (rng() - 0.5) * 12);
  const pb = Math.round(base.b + (rng() - 0.5) * 12);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const h = (n: number) => clamp(n).toString(16).padStart(2, "0");
  const pageColor = `#${h(pr)}${h(pg)}${h(pb)}`;

  return { roughness, metalness, clearcoat, pageColor };
}

// Row layout: split books into N rows by accumulated thickness, minimizing widest row
export const BOOK_GAP = 0.055;
export const TARGET_ROW_RUN = 5.0;
export const MAX_ROWS = 5;

export function computeRowCount(books: Book[]): number {
  const total = books.reduce((s, b) => s + getBookDims(b).thickness + BOOK_GAP, -BOOK_GAP);
  return Math.max(1, Math.min(MAX_ROWS, Math.ceil(total / TARGET_ROW_RUN)));
}

export function splitIntoRows(books: Book[], rowCount: number): number[][] {
  if (rowCount === 1) return [books.map((_, i) => i)];

  const widths = books.map(b => getBookDims(b).thickness + BOOK_GAP);
  const total = widths.reduce((a, b) => a + b, 0);

  // Binary search for optimal row width
  let lo = total / rowCount, hi = total;
  for (let iter = 0; iter < 60; iter++) {
    const mid = (lo + hi) / 2;
    let rows = 1, cur = 0;
    for (const w of widths) {
      if (cur + w > mid + 1e-9) { rows++; cur = 0; }
      cur += w;
    }
    if (rows <= rowCount) hi = mid; else lo = mid;
  }

  const rows: number[][] = [];
  let cur: number[] = [], curW = 0;
  for (let i = 0; i < books.length; i++) {
    const w = widths[i];
    if (cur.length && curW + w > hi + 1e-6 && rows.length < rowCount - 1) {
      rows.push(cur); cur = []; curW = 0;
    }
    cur.push(i); curW += w;
  }
  rows.push(cur);
  return rows;
}

// Compute X position of each book (centered in row)
export function computePositions(books: Book[], indices: number[]): number[] {
  const positions: number[] = new Array(books.length).fill(0);
  let x = 0;
  for (const i of indices) {
    const t = getBookDims(books[i]).thickness;
    x += t / 2;
    positions[i] = x;
    x += t / 2 + BOOK_GAP;
  }
  const rowWidth = x - BOOK_GAP;
  for (const i of indices) positions[i] -= rowWidth / 2;
  return positions;
}
