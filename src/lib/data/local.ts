// Dados locais: síncronos e sem custo em produção — os JSON entram por cast direto (o `tsc` e a
// validação de dev já garantiram a forma). Em dev, `./schemas` (e o zod) é carregado por
// `import()` atrás de `import.meta.env.DEV`, então o zod fica FORA do bundle de produção.
import booksJson from '../../data/books.json';
import changelogJson from '../../data/changelog.json';
import configJson from '../../data/config.json';
import experienceJson from '../../data/experience.json';
import galleryJson from '../../data/gallery.json';
import nowJson from '../../data/now.json';
import numbersJson from '../../data/numbers.json';
import pressJson from '../../data/press.json';
import skillsJson from '../../data/skills.json';
import type { LocalData, NowData, SiteConfig } from './types';

/** Título/autor do livro com `status: "reading"` em `src/data/books.json`. */
export function readingFromLibrary(): NowData['reading'] {
  const books: unknown[] = Array.isArray(booksJson) ? booksJson : [];
  for (const raw of books) {
    const book = raw as { title?: unknown; author?: unknown; status?: unknown };
    if (book.status === 'reading' && typeof book.title === 'string' && typeof book.author === 'string') {
      return { title: book.title, author: book.author };
    }
  }
  return null;
}

const rawNow = nowJson as NowData;
const now: NowData = rawNow.readingFromLibrary ? { ...rawNow, reading: readingFromLibrary() } : rawNow;

export const config: SiteConfig = configJson as SiteConfig;

export const localData: LocalData = {
  experience: (experienceJson as LocalData['experience']).slice().sort((a, b) => a.order - b.order),
  numbers: numbersJson as LocalData['numbers'],
  skills: skillsJson as LocalData['skills'],
  gallery: galleryJson as LocalData['gallery'],
  press: pressJson as LocalData['press'],
  changelog: changelogJson as LocalData['changelog'],
  now,
  config,
};

try {
  // `import.meta.env.DEV` vira `false` literal no build: rollup apaga o bloco e o chunk do zod.
  if (import.meta.env.DEV) {
    void import('./schemas').then((m) => m.validateAll());
  }
} catch {
  /* fora do Vite (node/tsx): sem validação */
}

/** Síncrono: os JSON já vieram no bundle. */
export function useLocalData(): LocalData {
  return localData;
}
