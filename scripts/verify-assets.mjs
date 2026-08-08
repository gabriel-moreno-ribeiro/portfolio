#!/usr/bin/env node
/**
 * Verifies that all asset paths referenced in the source code actually exist.
 * Fails with a non-zero exit code if any are missing.
 * Run: node scripts/verify-assets.mjs
 */

import { readFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const SRC = join(ROOT, 'src');

// Patterns that match public asset references
const PUBLIC_REF_RE = /['"`](\/(?:books|background|research|work|stats|honors)[^'"`\s]+)['"`]/g;

async function collectSourceFiles() {
  const files = [];
  const dirs = [SRC, join(ROOT, 'index.html')];

  async function walk(dir) {
    const entries = await (await import('fs')).promises.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
        await walk(full);
      } else if (e.isFile() && /\.(tsx?|jsx?|html)$/.test(e.name)) {
        files.push(full);
      }
    }
  }

  await walk(SRC);
  files.push(join(ROOT, 'index.html'));
  return files;
}

async function main() {
  const sourceFiles = await collectSourceFiles();
  const missing = [];

  for (const file of sourceFiles) {
    let src;
    try { src = await readFile(file, 'utf8'); } catch { continue; }

    let match;
    while ((match = PUBLIC_REF_RE.exec(src)) !== null) {
      const ref = match[1];
      // Skip dynamic refs (contains variables)
      if (ref.includes('${') || ref.includes('+')) continue;
      // Skip manifest keys that are just paths
      const absPath = join(PUBLIC, ref);
      try {
        await access(absPath);
      } catch {
        missing.push({ file: file.replace(ROOT, ''), ref });
      }
    }
  }

  if (missing.length === 0) {
    console.log('✓ All referenced assets exist.');
    process.exit(0);
  } else {
    console.error(`\n✗ ${missing.length} missing asset(s):\n`);
    for (const { file, ref } of missing) {
      console.error(`  ${ref}  (referenced in ${file})`);
    }
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
