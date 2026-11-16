// Graph of work — the "profile file" and the knowledge graph read out of it.
//
// Nothing here is authored copy about the owner. Every line of the profile is a string
// from a data file, every node must be mentioned in one of those lines, and every edge
// carries the source string and the verbatim words (`evidence`) that state it. A node or
// edge whose words are no longer in the data is dropped (and logged in dev), so an edit
// to the data can remove a fact from the graph but never leave a stale one in it.
import { bio, education, experience as terminalExperience } from '../../../constants/terminal/portfolioData';
import { projects } from '../../../content/projects';
import type { LocalData } from '../../../lib/data';

export type NodeKind = 'person' | 'org' | 'project' | 'award' | 'metric' | 'period';
type XY = [x: number, y: number];
export type Place = 'below' | 'above' | 'left' | 'right';

export interface GraphNode {
  id: string;
  /** What the node is called. Always a substring of a profile line. */
  label: string;
  kind: NodeKind;
  /** Other spellings of the same thing in the profile. They resolve to this one node. */
  aliases?: string[];
  /** Part of what he is doing now (step 3). */
  now?: true;
  /** Hand-placed. `wide` is a 720×560 box, `tall` a 360×840 one (phones). */
  wide: XY;
  tall: XY;
  /** Which side of the dot the label sits on, per layout. Default below. */
  place?: [wide: Place, tall: Place];
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
  /** File and field the fact is read from. */
  source: string;
  /** That field's value at runtime. */
  text: string;
  /** The words in `text` that state the fact. */
  evidence: string;
  /** Where the label sits along the edge (0 = from, 1 = to), per layout. Default 0.5. */
  at?: [wide: number, tall: number];
}

export interface ProfileLine {
  text: string;
  kind: 'h1' | 'h2' | 'text' | 'blank';
  /** File and field the line is read from. */
  source?: string;
}

export const BOX = { wide: [720, 560], tall: [360, 840] } as const;
export type Layout = keyof typeof BOX;

const NODES: GraphNode[] = [
  { id: 'gabriel', label: bio.name, kind: 'person', now: true, place: ['below', 'left'], wide: [360, 280], tall: [180, 340] },
  { id: 'hibeex', label: 'HIBEEX', kind: 'org', now: true, place: ['right', 'right'], wide: [530, 170], tall: [270, 160] },
  {
    id: 'canastra', label: 'Canastra AI Residency', kind: 'org', now: true, place: ['above', 'above'],
    aliases: ["Canastra Ventures' 12-week AI Residency"],
    wide: [630, 80], tall: [245, 50],
  },
  { id: 'buildyear', label: 'Build year (2026)', kind: 'period', now: true, place: ['above', 'above'], wide: [400, 70], tall: [95, 150] },
  { id: 'insper', label: 'Insper', kind: 'org', place: ['below', 'above'], wide: [650, 290], tall: [312, 292] },
  { id: 'olympic', label: 'Olympic Club - Colégio Militar', kind: 'org', place: ['above', 'right'], wide: [135, 150], tall: [31, 493] },
  { id: 'principia', label: 'Instituto Principia', kind: 'org', place: ['above', 'above'], wide: [215, 60], tall: [62, 240] },
  { id: 'estudar', label: 'Fundação Estudar', kind: 'org', place: ['left', 'left'], wide: [165, 350], tall: [315, 605] },
  { id: 'rct', label: 'Fintech Savings RCT', kind: 'project', place: ['left', 'below'], wide: [200, 470], tall: [261, 698] },
  { id: 'gsat', label: 'GSAT Education', kind: 'project', place: ['below', 'below'], wide: [85, 245], tall: [296, 430] },
  { id: 'candela', label: 'Projeto Candela', kind: 'project', place: ['right', 'left'], wide: [550, 410], tall: [128, 675] },
  { id: 'medals', label: '28 olympiad medals', kind: 'award', place: ['below', 'below'], wide: [340, 455], tall: [185, 788] },
  { id: 'students', label: '3,392 students', kind: 'metric', place: ['below', 'right'], wide: [655, 500], tall: [40, 756] },
  { id: 'schools', label: '28 public schools', kind: 'metric', place: ['below', 'above'], wide: [480, 515], tall: [75, 558] },
];

const plain = (s: string) => s.replace(/\*\*/g, ''); // JSON emphasis marks

export interface WorkGraph {
  lines: ProfileLine[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Splits a profile line into plain text and entity mentions. */
  mentions(text: string): { text: string; node?: string }[];
  /** Step 3 caption. */
  now: { building: string; summary: string };
}

export function buildGraph({ experience, numbers, now }: LocalData): WorkGraph {
  const exp = (id: string) => experience.find((e) => e.id === id);
  const proj = (slug: string) => projects.find((p) => p.slug === slug);
  const hibeex = proj('hibeex');
  const candela = proj('candela');
  const gsat = proj('gsat');
  const residency = plain(exp('hibeex')?.bullets.find((b) => b.includes('Residency')) ?? '');

  // ── The profile file ───────────────────────────────────────────────────────
  const lines: ProfileLine[] = [
    { kind: 'h1', text: bio.name, source: 'portfolioData.ts bio.name' },
    { kind: 'text', text: bio.title, source: 'portfolioData.ts bio.title' },
    { kind: 'blank', text: '' },
    { kind: 'h2', text: 'education' },
    { kind: 'text', text: education.degree, source: 'portfolioData.ts education.degree' },
    { kind: 'text', text: education.university, source: 'portfolioData.ts education.university' },
    { kind: 'blank', text: '' },
    { kind: 'h2', text: 'experience' },
    // Newest first. Rows marked `_placeholder` (city unknown) keep org and role only.
    ...[...experience].sort((a, b) => b.order - a.order).flatMap((e): ProfileLine[] => [
      {
        kind: 'text',
        text: `- ${[e.role, e.org].filter(Boolean).join(', ')}${e._placeholder ? '' : ` · ${e.periodLabel}`}`,
        source: `experience.json ${e.id}`,
      },
      ...(e.id === 'hibeex' && residency
        ? [{ kind: 'text' as const, text: `  ${residency.split('. ')[0]}`, source: 'experience.json hibeex.bullets' }]
        : []),
    ]),
    { kind: 'blank', text: '' },
    { kind: 'h2', text: 'numbers' },
    ...numbers
      .filter((n) => !n._placeholder && ['medals', 'students', 'schools', 'startups'].includes(n.id))
      .map((n): ProfileLine => ({
        kind: 'text',
        text: `- ${n.value.toLocaleString('en-US')} ${n.label}${n.sub ? ` · ${n.sub}` : ''}`,
        source: `numbers.json ${n.id}`,
      })),
    { kind: 'blank', text: '' },
    { kind: 'h2', text: 'projects' },
    ...projects.map((p): ProfileLine => ({
      kind: 'text',
      text: `- ${p.title}${p.role ? `: ${p.role}` : ''}`,
      source: `projects.ts ${p.slug}`,
    })),
  ];
  const profile = lines.map((l) => l.text).join('\n');

  // ── Relations, each with the words that state it ───────────────────────────
  const stated: GraphEdge[] = [
    { from: 'gabriel', to: 'hibeex', label: 'co-founded', source: 'experience.json hibeex.role', text: exp('hibeex')?.role ?? '', evidence: 'Co-founder' },
    { from: 'hibeex', to: 'canastra', label: 'one_of_6_in', source: 'experience.json hibeex.bullets', text: residency, evidence: 'One of 6 startups in Canastra' },
    { from: 'gabriel', to: 'buildyear', label: 'on_a', source: 'portfolioData.ts bio.summary', text: bio.summary, evidence: 'on a build year', at: [0.5, 0.8] },
    { from: 'buildyear', to: 'hibeex', label: 'going_deep_on', source: 'portfolioData.ts education.degree', text: education.degree, evidence: 'going deep on HIBEEX', at: [0.42, 0.5] },
    { from: 'gabriel', to: 'insper', label: '1st_place_at', source: 'portfolioData.ts education.university', text: education.university, evidence: '1st place' },
    { from: 'gabriel', to: 'olympic', label: 'president_of', source: 'experience.json olympic-club.role', text: exp('olympic-club')?.role ?? '', evidence: 'President', at: [0.5, 0.69] },
    { from: 'gabriel', to: 'principia', label: 'researched_at', source: 'experience.json principia.role', text: exp('principia')?.role ?? '', evidence: 'Research scholar', at: [0.45, 0.75] },
    { from: 'gabriel', to: 'estudar', label: 'fellow_at', source: 'experience.json estudar.role', text: exp('estudar')?.role ?? '', evidence: 'PREP Fellow', at: [0.62, 0.76] },
    { from: 'gabriel', to: 'rct', label: 'ran', source: 'portfolioData.ts experience (Fintech Savings RCT).description', text: terminalExperience.find((e) => e.company === 'Fintech Savings RCT')?.description ?? '', evidence: 'Designed and ran a randomized controlled trial', at: [0.5, 0.32] },
    { from: 'rct', to: 'estudar', label: 'fellowship_at', source: 'experience.json fintech-rct.role', text: exp('fintech-rct')?.role ?? '', evidence: 'Research Fellow in Economics, Fundação Estudar', at: [0.5, 0.78] },
    { from: 'gabriel', to: 'gsat', label: 'built', source: 'projects.ts gsat.role', text: gsat?.role ?? '', evidence: 'Built a test-prep platform from scratch', at: [0.5, 0.71] },
    { from: 'gabriel', to: 'candela', label: 'founded', source: 'projects.ts candela.role', text: candela?.role ?? '', evidence: 'Founder', at: [0.5, 0.66] },
    { from: 'candela', to: 'students', label: 'reached', source: 'projects.ts candela.stats', text: (candela?.stats ?? []).map((s) => `${s.value} ${s.label}`).join(' · '), evidence: '3,392 students reached', at: [0.6, 0.66] },
    { from: 'candela', to: 'schools', label: 'delivered_to', source: 'projects.ts candela.cardDesc', text: candela?.cardDesc ?? '', evidence: 'delivered to 28 public schools', at: [0.5, 0.75] },
    { from: 'gabriel', to: 'medals', label: 'won', source: 'projects.ts candela.sections', text: candela?.sections[0]?.body[0] ?? '', evidence: 'I won a gold medal', at: [0.5, 0.44] },
    { from: 'candela', to: 'medals', label: 'funded_by', source: 'projects.ts candela.sections', text: candela?.sections[0]?.body[0] ?? '', evidence: 'I put the prize money into building physics kits', at: [0.55, 0.29] },
  ];

  // ── Keep only what the data still says ─────────────────────────────────────
  const names = (n: GraphNode) => [n.label, ...(n.aliases ?? [])];
  const nodes = NODES.filter((n) => names(n).some((s) => profile.includes(s)));
  const has = (id: string) => nodes.some((n) => n.id === id);
  const edges = stated.filter((e) => has(e.from) && has(e.to) && plain(e.text).includes(e.evidence));
  if (import.meta.env.DEV && (nodes.length < NODES.length || edges.length < stated.length)) {
    const gone = [
      ...NODES.filter((n) => !nodes.includes(n)).map((n) => `node ${n.id}`),
      ...stated.filter((e) => !edges.includes(e)).map((e) => `edge ${e.from} ${e.label} ${e.to}`),
    ];
    console.warn('[GraphOfWork] dropped, no longer stated in the data:', gone.join('; '));
  }

  // Longest spelling first, so "Canastra Ventures' 12-week AI Residency" wins over a shorter name.
  const spellings = nodes
    .flatMap((n) => names(n).map((s) => ({ s, id: n.id })))
    .sort((a, b) => b.s.length - a.s.length);
  const splitter = new RegExp(`(${spellings.map(({ s }) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`);
  const mentions = (text: string) =>
    text
      .split(splitter)
      .filter(Boolean)
      .map((part) => ({ text: part, node: spellings.find(({ s }) => s === part)?.id }));

  return { lines, nodes, edges, mentions, now: { building: now.building, summary: hibeex?.summary ?? '' } };
}
