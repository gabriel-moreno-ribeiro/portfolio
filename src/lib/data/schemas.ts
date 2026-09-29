// Schemas zod dos JSON de `src/data/`. As anotações `z.ZodType<T>` garantem, em tempo de
// compilação, que cada schema produz exatamente o tipo congelado de `./types.ts`.
//
// IMPORTANTE: este módulo só é carregado em dev, por `import()` atrás de `import.meta.env.DEV`
// em `local.ts`. Assim o `zod` fica fora do bundle de produção. Nunca importe daqui
// estaticamente em código de runtime.
import { z } from 'zod';
import booksJson from '../../data/books.json';
import changelogJson from '../../data/changelog.json';
import configJson from '../../data/config.json';
import experienceJson from '../../data/experience.json';
import galleryJson from '../../data/gallery.json';
import nowJson from '../../data/now.json';
import numbersJson from '../../data/numbers.json';
import pressJson from '../../data/press.json';
import skillsJson from '../../data/skills.json';
import type {
  ChangelogEntry,
  CityInfo,
  ExperienceEntry,
  GalleryItem,
  NowData,
  NumberStat,
  PressItem,
  SiteConfig,
  Skill,
} from './types';

const placeholder = z.literal(true).optional();

export const cityInfoSchema: z.ZodType<CityInfo> = z.object({
  id: z.enum(['missao-velha', 'salvador', 'fortaleza', 'sao-paulo']),
  name: z.string().min(1),
  tz: z.string().min(1),
  lat: z.number(),
  lon: z.number(),
});

export const siteConfigSchema: z.ZodType<SiteConfig> = z.object({
  buildYearStart: z.string().min(4),
  location: z.object({
    city: z.string().min(1),
    lat: z.number(),
    lon: z.number(),
    tz: z.string().min(1),
  }),
  github: z.object({ user: z.string().min(1), repo: z.string().min(1) }),
  refresh: z.object({
    githubMs: z.number().positive(),
    weatherMs: z.number().positive(),
    clockMs: z.number().positive(),
  }),
  cities: z.array(cityInfoSchema),
  _placeholders: z.array(z.string()).optional(),
});

export const experienceSchema: z.ZodType<ExperienceEntry> = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  org: z.string().min(1),
  role: z.string(),
  start: z.string().min(4),
  end: z.string().min(4),
  periodLabel: z.string().min(1),
  city: z.string(),
  cityTz: z.string().optional(),
  note: z.string().optional(),
  bullets: z.array(z.string()),
  url: z.string().optional(),
  _placeholder: placeholder,
});

export const numberStatSchema: z.ZodType<NumberStat> = z.object({
  id: z.string().min(1),
  value: z.number(),
  label: z.string().min(1),
  sub: z.string().optional(),
  icon: z.string(),
  size: z.enum(['hero', 'lg', 'md']),
  decimals: z.number().int().min(0).optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  grouping: z.boolean().optional(),
  _placeholder: placeholder,
});

export const skillSchema: z.ZodType<Skill> = z.object({
  id: z.string().min(1),
  name: z.string(),
  category: z.enum(['frontend', 'backend', 'tools', 'design', 'other']),
  icon: z.union([z.string(), z.object({ light: z.string(), dark: z.string() })]),
  projects: z.array(z.string()),
  _placeholder: placeholder,
});

export const galleryItemSchema: z.ZodType<GalleryItem> = z.object({
  src: z.string().min(1),
  row: z.union([z.literal(1), z.literal(2)]),
  what: z.string(),
  city: z.enum(['Missão Velha', 'Salvador', 'Fortaleza', 'São Paulo']),
  year: z.number().int().nullable(),
  alt: z.string(),
  w: z.number().positive(),
  h: z.number().positive(),
  focus: z.string().optional(),
  _placeholder: placeholder,
});

export const pressItemSchema: z.ZodType<PressItem> = z.object({
  title: z.string().min(1),
  outlet: z.string().min(1),
  date: z.string().min(4),
  url: z.string().min(1),
  excerpt: z.string().optional(),
});

export const changelogEntrySchema: z.ZodType<ChangelogEntry> = z.object({
  date: z.string().min(4),
  project: z.string().min(1),
  title: z.string().min(1),
  url: z.string().optional(),
  _placeholder: placeholder,
});

export const nowSchema: z.ZodType<NowData> = z.object({
  building: z.string().min(1),
  reading: z.object({ title: z.string(), author: z.string() }).nullable(),
  readingFromLibrary: z.boolean().optional(),
});

/** Só o que a Home precisa de `src/data/books.json` (a fonte completa é da /library). */
export const bookLiteSchema = z.object({
  title: z.string(),
  author: z.string(),
  status: z.string(),
});

export const localSchemas = {
  config: siteConfigSchema,
  experience: z.array(experienceSchema),
  numbers: z.array(numberStatSchema),
  skills: z.array(skillSchema),
  gallery: z.array(galleryItemSchema),
  press: z.array(pressItemSchema),
  changelog: z.array(changelogEntrySchema),
  now: nowSchema,
};

/**
 * Valida os 8 JSON de `src/data/` e reporta no console. Roda **só em dev**: em produção os JSON
 * entram por cast direto (já passaram por aqui e pelo `tsc`).
 */
export function validateAll(): boolean {
  const raws: Record<string, unknown> = {
    config: configJson,
    experience: experienceJson,
    numbers: numbersJson,
    skills: skillsJson,
    gallery: galleryJson,
    press: pressJson,
    changelog: changelogJson,
    now: nowJson,
  };
  let ok = true;
  for (const [name, schema] of Object.entries(localSchemas)) {
    const result = schema.safeParse(raws[name]);
    if (result.success) continue;
    ok = false;
    const issues = result.error.issues
      .slice(0, 8)
      .map((i) => `  - ${i.path.join('.') || '(raiz)'}: ${i.message}`)
      .join('\n');
    console.error(
      `[data] src/data/${name}.json não passou no schema (${result.error.issues.length} problema(s)).\n` +
        `${issues}\nO site segue com o JSON cru; corrija o arquivo.`,
    );
  }
  const books = Array.isArray(booksJson) ? booksJson : [];
  const reading = books.filter((b) => bookLiteSchema.safeParse(b).success && (b as { status: string }).status === 'reading');
  if (nowJson.readingFromLibrary && reading.length !== 1) {
    ok = false;
    console.error(`[data] books.json deveria ter exatamente 1 livro com status "reading"; tem ${reading.length}.`);
  }
  return ok;
}
