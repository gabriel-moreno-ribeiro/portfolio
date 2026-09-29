// Tipos da camada de dados. Fonte da verdade do CONTRACTS.md §1–3.
// Só o orquestrador edita este arquivo.

export type Source = 'live' | 'mock' | 'local';
export type Status = 'idle' | 'loading' | 'ready' | 'error';

export interface DataResult<T> {
  data: T | null;
  source: Source;
  status: Status;
  updatedAt: number | null;
  stale: boolean;
  error: string | null;
  refresh(): void;
}

/** Linha de JSON cujo valor ainda precisa ser preenchido pelo dono do site. */
export interface Placeholder {
  _placeholder?: true;
}

// ── src/data/*.json ──────────────────────────────────────────────────────────

export interface CityInfo {
  id: 'missao-velha' | 'salvador' | 'fortaleza' | 'sao-paulo';
  name: string;
  tz: string;
  lat: number;
  lon: number;
}

export interface SiteConfig {
  /** Data de início do "build year" (dia X de 365). */
  buildYearStart: string;
  location: { city: string; lat: number; lon: number; tz: string };
  github: { user: string; repo: string };
  refresh: { githubMs: number; weatherMs: number; clockMs: number };
  cities: CityInfo[];
  /** Nomes de campos deste objeto que ainda são placeholder. */
  _placeholders?: string[];
}

export interface ExperienceEntry extends Placeholder {
  id: string;
  /** Ordem cronológica crescente (1 = mais antigo). */
  order: number;
  org: string;
  role: string;
  /** `YYYY` ou `YYYY-MM`. */
  start: string;
  /** `YYYY`, `YYYY-MM` ou `present`. */
  end: string | 'present';
  /** Texto do período exatamente como o site mostra hoje. */
  periodLabel: string;
  /** Vazio quando desconhecido (e então `_placeholder: true`). */
  city: string;
  cityTz?: string;
  /** Linha extra (ex.: orientador). */
  note?: string;
  /** Ênfase com `**assim**`. */
  bullets: string[];
  url?: string;
}

export type NumberSize = 'hero' | 'lg' | 'md';

export interface NumberStat extends Placeholder {
  id: string;
  value: number;
  label: string;
  sub?: string;
  /** Caminho público, ex. `/stats/obfep.webp`. */
  icon: string;
  size: NumberSize;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  grouping?: boolean;
}

export type SkillCategory = 'frontend' | 'backend' | 'tools' | 'design' | 'other';

export interface Skill extends Placeholder {
  id: string;
  name: string;
  category: SkillCategory;
  /** Relativo a `src/assets/skills/`. String única (SVG) ou par claro/escuro (webp). */
  icon: string | { light: string; dark: string };
  /** Slugs de `src/content/projects.ts` onde a skill é usada. */
  projects: string[];
}

export type GalleryCity = 'Missão Velha' | 'Salvador' | 'Fortaleza' | 'São Paulo';

export interface GalleryItem extends Placeholder {
  src: string;
  row: 1 | 2;
  /** O que a foto é (sem lugar nem ano). */
  what: string;
  city: GalleryCity;
  /** `null` quando desconhecido. */
  year: number | null;
  alt: string;
  w: number;
  h: number;
  /** Onde o corte assenta (CSS object-position); ausente = centro. */
  focus?: string;
}

export interface PressItem {
  title: string;
  outlet: string;
  /** ISO `YYYY-MM-DD` quando conhecida; senão `YYYY`. */
  date: string;
  url: string;
  excerpt?: string;
}

export interface ChangelogEntry extends Placeholder {
  /** ISO. */
  date: string;
  /** Slug de projeto. */
  project: string;
  title: string;
  url?: string;
}

export interface NowData {
  building: string;
  reading: { title: string; author: string } | null;
  /** Quando true, `reading` é derivado de `src/data/books.json` (status `reading`). */
  readingFromLibrary?: boolean;
}

// ── externas ─────────────────────────────────────────────────────────────────

export interface GitHubCommit {
  repo: string;
  message: string;
  sha: string;
  url: string;
  /** ISO. */
  at: string;
}

export interface GitHubSummary {
  login: string;
  url: string;
  publicRepos: number;
  followers: number;
  lastCommit: GitHubCommit | null;
  /** Último commit do repositório deste site (para o rodapé). */
  siteLastCommit: GitHubCommit | null;
  commitsThisYear: number | null;
  /** true quando `commitsThisYear` veio dos eventos públicos, não do GraphQL. */
  estimated: boolean;
  calendar: { date: string; count: number }[] | null;
  stars: number | null;
}

export interface Weather {
  tempC: number;
  /** Código WMO do Open-Meteo. */
  code: number;
  /** Rótulo curto em inglês, ex. "cloudy". */
  label: string;
  isDay: boolean;
  /** ISO. */
  at: string;
}

export interface ClockValue {
  now: Date;
  /** `HH:MM` no fuso pedido. */
  hhmm: string;
  iso: string;
}

export interface NowLine {
  text: string;
  kind: 'building' | 'reading' | 'time';
}

export interface BuildYear {
  day: number;
  total: number;
  start: Date;
}

export interface LocalData {
  experience: ExperienceEntry[];
  numbers: NumberStat[];
  skills: Skill[];
  gallery: GalleryItem[];
  press: PressItem[];
  changelog: ChangelogEntry[];
  now: NowData;
  config: SiteConfig;
}
