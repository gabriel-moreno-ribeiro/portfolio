// Dados locais: síncronos, validados com zod uma única vez no import do módulo.
// Em erro de validação: console.error claro + fallback para o JSON cru (o site nunca fica sem
// conteúdo por causa de um campo torto).
import type { z } from 'zod';
import booksJson from '../../data/books.json';
import changelogJson from '../../data/changelog.json';
import configJson from '../../data/config.json';
import experienceJson from '../../data/experience.json';
import galleryJson from '../../data/gallery.json';
import nowJson from '../../data/now.json';
import numbersJson from '../../data/numbers.json';
import pressJson from '../../data/press.json';
import skillsJson from '../../data/skills.json';
import { bookLiteSchema, localSchemas } from './schemas';
import type { LocalData, NowData, SiteConfig } from './types';

function parse<T>(name: string, schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (result.success) return result.data;
  const issues = result.error.issues
    .slice(0, 8)
    .map((i) => `  - ${i.path.join('.') || '(raiz)'}: ${i.message}`)
    .join('\n');
  console.error(
    `[data] src/data/${name}.json não passou no schema (${result.error.issues.length} problema(s)).\n` +
      `${issues}\nUsando o JSON cru como fallback; corrija o arquivo.`,
  );
  return raw as T;
}

/** Título/autor do livro com `status: "reading"` em `src/data/books.json`. */
export function readingFromLibrary(): NowData['reading'] {
  const books = Array.isArray(booksJson) ? booksJson : [];
  for (const raw of books) {
    const book = bookLiteSchema.safeParse(raw);
    if (book.success && book.data.status === 'reading') {
      return { title: book.data.title, author: book.data.author };
    }
  }
  console.error('[data] now.readingFromLibrary é true mas nenhum livro tem status "reading".');
  return null;
}

const parsedNow = parse('now', localSchemas.now, nowJson);

const now: NowData = parsedNow.readingFromLibrary
  ? { ...parsedNow, reading: readingFromLibrary() }
  : parsedNow;

export const config: SiteConfig = parse('config', localSchemas.config, configJson);

export const localData: LocalData = {
  experience: parse('experience', localSchemas.experience, experienceJson).slice().sort((a, b) => a.order - b.order),
  numbers: parse('numbers', localSchemas.numbers, numbersJson),
  skills: parse('skills', localSchemas.skills, skillsJson),
  gallery: parse('gallery', localSchemas.gallery, galleryJson),
  press: parse('press', localSchemas.press, pressJson),
  changelog: parse('changelog', localSchemas.changelog, changelogJson),
  now,
  config,
};

/** Síncrono: os JSON já vieram no bundle e já foram validados. */
export function useLocalData(): LocalData {
  return localData;
}
