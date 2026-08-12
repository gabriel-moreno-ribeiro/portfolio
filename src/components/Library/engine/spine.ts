// Spine canvas texture generator — pure function, no Three.js dependency

export interface SpineOptions {
  title: string;
  author: string;
  color: string;
  height: number;
  thickness: number;
  textColor?: string; // defaults to rgba(255,255,255,0.92)
}

export async function createSpineCanvas(opts: SpineOptions): Promise<HTMLCanvasElement> {
  await document.fonts.ready;

  const { title, author, color, height, thickness } = opts;
  const textColor = opts.textColor ?? "rgba(255,255,255,0.92)";

  const CANVAS_H = 1600;
  const rawW = Math.round(CANVAS_H * (thickness / height));
  const canvasW = Math.min(512, rawW); // cap width, never clamp min
  const canvasH = CANVAS_H;

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d")!;

  // Background fill
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Highlight stripe top
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fillRect(0, 0, canvasW, 4);

  // Dark edge right
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(canvasW - 3, 0, 3, canvasH);

  ctx.save();
  ctx.translate(canvasW / 2, canvasH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = textColor;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  const maxW = canvasH - 80;

  // Measure single-line
  const singleSize = canvasW * 0.60;
  ctx.font = `600 ${singleSize}px "DM Sans", sans-serif`;
  const singleFits = ctx.measureText(title).width <= maxW * 0.92;

  if (singleFits) {
    ctx.font = `600 ${singleSize}px "DM Sans", sans-serif`;
    let t = title;
    if (ctx.measureText(t).width > maxW) {
      const reduced = singleSize * 0.85;
      ctx.font = `600 ${reduced}px "DM Sans", sans-serif`;
      while (ctx.measureText(t + "…").width > maxW && t.length > 3) t = t.slice(0, -1);
      if (t !== title) t += "…";
    }
    ctx.fillText(t, 0, 0);
  } else {
    // Two-line layout
    const twoSize = canvasW * 0.34;
    ctx.font = `600 ${twoSize}px "DM Sans", sans-serif`;
    const lines = wrapText(ctx, title, maxW * 0.78);
    const display = lines.slice(0, 2);
    const lh = twoSize * 1.25;
    const startY = -((display.length - 1) * lh) / 2;
    display.forEach((line, i) => ctx.fillText(line, 0, startY + i * lh));

    // Author surname at "bottom" of spine
    const surname = author.split(" ").at(-1) ?? author;
    const authorSize = Math.max(twoSize * 0.52, 10);
    ctx.font = `400 ${authorSize}px "DM Sans", sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.50)";
    ctx.fillText(surname.toUpperCase(), -(maxW / 2 - authorSize * 1.5), 0);
  }

  ctx.restore();

  // Accent stripe bottom
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(0, canvasH - 4, canvasW, 4);

  return canvas;
}

export async function createCoverCanvas(
  title: string,
  author: string,
  color: string
): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 768);

  const grad = ctx.createLinearGradient(0, 0, 512, 768);
  grad.addColorStop(0, "rgba(255,255,255,0.15)");
  grad.addColorStop(1, "rgba(0,0,0,0.30)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 768);

  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillRect(40, 52, 70, 2);

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = '600 34px "DM Sans", sans-serif';
  ctx.textAlign = "left";
  wrapBlock(ctx, title, 40, 580, 432, 42);

  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillRect(40, 704, 432, 1);

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = '400 17px "DM Sans", sans-serif';
  ctx.fillText(author.toUpperCase(), 40, 732);

  return canvas;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function wrapBlock(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(" ");
  let line = "", curY = y;
  for (const w of words) {
    const t = line + w + " ";
    if (ctx.measureText(t).width > maxW && line) {
      ctx.fillText(line.trim(), x, curY); line = w + " "; curY += lh;
    } else line = t;
  }
  ctx.fillText(line.trim(), x, curY);
}
