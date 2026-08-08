#!/usr/bin/env node
/**
 * Image optimization script for gabrielmr.com
 *
 * Generates AVIF + WebP + fallback JPG/PNG for:
 * - public/books/ → rendered at ~52px wide (spine), max useful width 200px
 * - public/background/ → rendered in gallery, useful widths 640/1280/1920
 * - public/stats/ → rendered at ~80px, max useful 240px
 *
 * Run: node scripts/optimize-images.mjs
 * Output: public/optimized/<original-relative-path>
 *         (leaves originals untouched)
 */

import sharp from 'sharp';
import { readdir, mkdir, stat } from 'fs/promises';
import { join, relative, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');

const TASKS = [
  {
    dir: join(PUBLIC, 'books'),
    widths: [120, 240],
    quality: { avif: 65, webp: 75, jpg: 80 },
    label: 'books',
  },
  {
    dir: join(PUBLIC, 'background'),
    widths: [640, 1280, 1920],
    quality: { avif: 60, webp: 70, jpg: 75 },
    label: 'background',
    recursive: true,
  },
  {
    dir: join(PUBLIC, 'stats'),
    widths: [80, 240],
    quality: { avif: 65, webp: 75, jpg: 80 },
    label: 'stats',
  },
];

async function collectFiles(dir, recursive = false) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && recursive) {
      files.push(...(await collectFiles(full, true)));
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
        files.push(full);
      }
    }
  }
  return files;
}

async function processFile(src, widths, quality, outBase) {
  const rel = relative(PUBLIC, src);
  const ext = extname(src).toLowerCase();
  const stem = basename(src, ext);
  const outDir = join(outBase, dirname(rel));

  await mkdir(outDir, { recursive: true });

  const img = sharp(src);
  const meta = await img.metadata();
  const origW = meta.width || 9999;

  let saved = 0;
  let orig = 0;
  try { orig = (await stat(src)).size; } catch {}

  for (const w of widths) {
    if (w > origW) continue; // never upscale
    const base = `${stem}-${w}w`;

    // AVIF
    const avifPath = join(outDir, `${base}.avif`);
    await sharp(src).resize(w).avif({ quality: quality.avif }).toFile(avifPath);
    const avifSize = (await stat(avifPath)).size;

    // WebP
    const webpPath = join(outDir, `${base}.webp`);
    await sharp(src).resize(w).webp({ quality: quality.webp }).toFile(webpPath);
    const webpSize = (await stat(webpPath)).size;

    saved += avifSize + webpSize;
    console.log(`  [${w}w] avif:${(avifSize/1024).toFixed(0)}KB  webp:${(webpSize/1024).toFixed(0)}KB  ← ${rel}`);
  }

  // Best single fallback at max width (for browsers without AVIF/WebP)
  const maxW = Math.min(widths[widths.length - 1], origW);
  const isPhoto = ['.jpg', '.jpeg', '.png'].includes(ext) && stem !== 'rb2' && stem !== 'percy-jackson';
  if (isPhoto) {
    const fbPath = join(outDir, `${stem}-${maxW}w.jpg`);
    await sharp(src).resize(maxW).jpeg({ quality: quality.jpg, progressive: true }).toFile(fbPath);
  }

  console.log(`  orig: ${(orig/1024).toFixed(0)}KB`);
  return { src: rel, saved: orig - saved / widths.length };
}

async function main() {
  console.log('Optimizing images...\n');
  const outBase = join(PUBLIC, 'optimized');
  await mkdir(outBase, { recursive: true });

  let total = 0;
  let totalSaved = 0;

  for (const task of TASKS) {
    console.log(`\n=== ${task.label} ===`);
    let files;
    try {
      files = await collectFiles(task.dir, task.recursive);
    } catch {
      console.log('  (directory not found, skipping)');
      continue;
    }
    console.log(`  Found ${files.length} files`);

    for (const f of files) {
      try {
        const r = await processFile(f, task.widths, task.quality, outBase);
        total++;
        totalSaved += r.saved;
      } catch (err) {
        console.warn(`  WARN: ${f}: ${err.message}`);
      }
    }
  }

  console.log(`\nDone. Processed ${total} files.`);
  console.log('Optimized files are in public/optimized/');
  console.log('Review output and copy to replace originals when satisfied.');
}

main().catch(console.error);
