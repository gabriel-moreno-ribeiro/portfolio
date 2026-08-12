import type { Book } from "../../../types/book";

// ── Scene constants (named for tuning) ──
export const SHELF_COLOR = "#5a4132";
export const SHELF_EDGE_COLOR = "#4b3429";
export const PAGE_COLOR = "#e9dfca";
export const WALL_COLOR = "#eee8db";
export const BG_COLOR = "#eee8db";

export const BOOK_GAP = 0.06;
export const SHELF_Y = 0;
export const SHELF_THICKNESS = 0.08;
export const SHELF_DEPTH = 1.4;

// Camera: fov 32 + z 8.0 gives ~8.16 world units of visible width
// with moderate perspective (less keystone on shelf edges)
export const CAMERA_FOV = 32;
export const CAMERA_POS: [number, number, number] = [0, 1.5, 8.0];
export const CAMERA_TARGET: [number, number, number] = [0, 1.20, 0.15];

// Presented book: scale and vertical offset
export const PRESENTED_SCALE = 1.2;
export const PRESENTED_Y_OFFSET = 0.25;
// Target: presented book fills 78% of viewport height
export const TARGET_FILL = 0.78;

// ── Seeded PRNG ──
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h += id.charCodeAt(i);
  }
  return h % 2147483647;
}

function createLCG(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ── Book format type ──
export type BookFormat = "pocket" | "standard" | "large" | "textbook";

// ── Format dimension ranges ──
const FORMAT_RANGES: Record<BookFormat, { hMin: number; hMax: number; wMin: number; wMax: number }> = {
  pocket:   { hMin: 1.75, hMax: 1.90, wMin: 1.10, wMax: 1.20 },
  standard: { hMin: 1.90, hMax: 2.15, wMin: 1.20, wMax: 1.35 },
  large:    { hMin: 2.10, hMax: 2.35, wMin: 1.30, wMax: 1.40 },
  textbook: { hMin: 2.20, hMax: 2.45, wMin: 1.35, wMax: 1.45 },
};

// Full range when no format specified
const FULL_RANGE = { hMin: 1.75, hMax: 2.45, wMin: 1.10, wMax: 1.45 };

// ── Compute book dimensions in scene units ──
export function bookDimensions(pages: number, id: string, format?: string) {
  const rng = createLCG(hashId(id));

  // Thickness: power-curve from pages with jitter
  const ratio = Math.min(Math.max(pages / 1200, 0), 1);
  const baseThickness = 0.10 + 0.36 * Math.pow(ratio, 0.55);
  const jitter = 1.0 + (rng() - 0.5) * 0.2; // ±10%
  const thickness = Math.min(0.46, Math.max(0.10, baseThickness * jitter));

  // Height and width from format
  const range = (format && FORMAT_RANGES[format as BookFormat]) || FULL_RANGE;
  const height = range.hMin + (range.hMax - range.hMin) * rng();
  const width = range.wMin + (range.wMax - range.wMin) * rng();

  return { width, height, thickness };
}

// ── Material finish variation ──
export function bookFinish(id: string): { roughness: number; clearcoat: number } {
  const rng = createLCG(hashId(id));
  // Burn first few values (used by dimensions)
  rng(); rng(); rng();
  const v = rng();
  if (v < 0.2) {
    return { roughness: 0.5, clearcoat: 0.12 };
  } else if (v > 0.8) {
    return { roughness: 0.85, clearcoat: 0 };
  }
  return { roughness: 0.65, clearcoat: 0.05 };
}

// ── Page color variation ──
export function pageColor(id: string): string {
  const rng = createLCG(hashId(id));
  // Burn values used by other functions
  rng(); rng(); rng(); rng(); rng();

  const base = { r: 0xe9, g: 0xdf, b: 0xca };
  const r = Math.max(0, Math.min(255, Math.round(base.r + (rng() - 0.5) * 10)));
  const g = Math.max(0, Math.min(255, Math.round(base.g + (rng() - 0.5) * 10)));
  const b = Math.max(0, Math.min(255, Math.round(base.b + (rng() - 0.5) * 10)));

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Visible height at distance d from camera
export function visibleHeightAtDistance(d: number): number {
  return 2 * d * Math.tan((CAMERA_FOV * Math.PI / 180) / 2);
}

// Distance needed for a book of given height to fill TARGET_FILL of the frame
export function distanceForBook(bookHeight: number): number {
  return (bookHeight * PRESENTED_SCALE) / (2 * TARGET_FILL * Math.tan((CAMERA_FOV * Math.PI / 180) / 2));
}

// Compute presented Z for a specific book (derived, not constant)
export function presentedZForBook(bookHeight: number): number {
  return CAMERA_POS[2] - distanceForBook(bookHeight);
}

// Neighbor spread: exponential decay over ±5 books
export function neighborOffsetX(index: number, presentedIndex: number): number {
  const delta = index - presentedIndex;
  if (delta === 0) return 0;
  return Math.sign(delta) * 0.42 * Math.exp(-Math.abs(delta) / 2.5);
}

// ── Sort books: favorites first within status groups ──
export function sortBooksForShelf(books: Book[]): Book[] {
  return [...books].sort((a, b) => {
    const statusOrder: Record<string, number> = { reading: 0, finished: 1 };
    const sa = statusOrder[a.status] ?? 1;
    const sb = statusOrder[b.status] ?? 1;
    if (sa !== sb) return sa - sb;
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    const ha = bookDimensions(a.pages, a.id).height;
    const hb = bookDimensions(b.pages, b.id).height;
    return hb - ha;
  });
}

// ── Compute x positions for all books on the shelf ──
export function computeBookPositions(books: Book[]): number[] {
  const positions: number[] = [];
  let x = 0;
  for (let i = 0; i < books.length; i++) {
    const { thickness } = bookDimensions(books[i].pages, books[i].id);
    x += thickness / 2;
    positions.push(x);
    x += thickness / 2 + BOOK_GAP;
  }
  const center = x / 2;
  return positions.map((p) => p - center);
}

// ── Module-level assert: tallest book at PRESENTED_SCALE must have presentedZ > 1.2 ──
const tallestPresentedZ = presentedZForBook(2.45);
if (tallestPresentedZ <= 1.2) {
  console.warn(
    `[shelfConfig] Tallest book (2.45h) at PRESENTED_SCALE has presentedZ = ${tallestPresentedZ.toFixed(3)}, which is <= 1.2. Camera or scale config may need adjustment.`
  );
}

// ── Create spine canvas texture data ──
// Awaits font load externally — call after document.fonts.ready
export function createSpineCanvas(
  title: string,
  author: string,
  color: string,
  height: number,
  thickness: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const h = 1600;
  const w = Math.min(512, Math.round(h * (thickness / height)));
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Accent stripe at top
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(0, 0, canvas.width, 5);

  const isThick = thickness >= 0.28;

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "rgba(255,255,255,0.92)";

  const maxWidth = canvas.height - 80;

  if (isThick) {
    // Measure with single-line font to decide line count
    const testFontSize = Math.max(20, canvas.width * 0.60);
    ctx.font = `600 ${testFontSize}px "Inter Variable", Inter, system-ui, sans-serif`;
    const lines = wrapSpineText(ctx, title, maxWidth * 0.75);
    const needsMultiLine = lines.length > 1;

    // Reduce font for multi-line so 2 lines fit (~78% of width)
    const fontSize = needsMultiLine
      ? Math.max(16, canvas.width * 0.34)
      : Math.max(20, canvas.width * 0.60);

    ctx.font = `600 ${fontSize}px "Inter Variable", Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Re-wrap with final font size
    const finalLines = needsMultiLine
      ? wrapSpineText(ctx, title, maxWidth * 0.75)
      : lines;

    const lineHeight = fontSize * 1.2;
    const displayLines = finalLines.slice(0, 2);
    const totalTextHeight = displayLines.length * lineHeight;
    const startY = -totalTextHeight / 2;

    for (let i = 0; i < displayLines.length; i++) {
      ctx.fillText(displayLines[i], 0, startY + i * lineHeight + lineHeight / 2);
    }

    // Author surname at the "bottom" of spine (negative X in rotated space)
    const surname = author.split(" ").pop() || author;
    const authorFontSize = fontSize * 0.55;
    ctx.font = `400 ${authorFontSize}px "Inter Variable", Inter, system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(surname.toUpperCase(), -(maxWidth / 2 - authorFontSize * 2), 0);
  } else {
    // Single line, truncate if needed
    const fontSize = Math.max(20, canvas.width * 0.60);
    ctx.font = `600 ${fontSize}px "Inter Variable", Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let displayTitle = title;
    if (ctx.measureText(displayTitle).width > maxWidth) {
      while (ctx.measureText(displayTitle + "…").width > maxWidth && displayTitle.length > 3) {
        displayTitle = displayTitle.slice(0, -1);
      }
      displayTitle += "…";
    }
    ctx.fillText(displayTitle, 0, 0);
  }

  ctx.restore();

  // Accent stripe at bottom
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(0, canvas.height - 5, canvas.width, 5);

  return canvas;
}

function wrapSpineText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ── Create procedural cover canvas (for books without cover images) ──
export function createProceduralCover(
  title: string,
  author: string,
  color: string,
  _width: number,
  _height: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 768);

  const grad = ctx.createLinearGradient(0, 0, 512, 768);
  grad.addColorStop(0, "rgba(255,255,255,0.12)");
  grad.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 768);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillRect(40, 50, 80, 3);

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = '600 36px "Inter Variable", Inter, system-ui, sans-serif';
  ctx.textAlign = "left";
  wrapText(ctx, title, 40, 580, 432, 42);

  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(40, 700, 432, 1);

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = '400 18px "Inter Variable", Inter, system-ui, sans-serif';
  ctx.fillText(author.toUpperCase(), 40, 730);

  return canvas;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, currentY);
      line = word + " ";
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}
