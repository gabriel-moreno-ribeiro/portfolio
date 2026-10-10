// The medals Gabriel photographed, one entry per photo in public/work/medals/wall/.
// Every name, year and level below was read off the medal (or its ribbon) by two
// independent passes and a third that settled every disagreement. Nothing comes
// from memory: a field is empty when the medal doesn't say it.

export type Subject = 'math' | 'physics' | 'chemistry' | 'astronomy' | 'science' | 'energy' | 'biology';

export interface Medal {
  /** File number in public/work/medals/wall/ (and wall/full/). */
  num: string;
  name: string;
  /** Only when it is written on the medal or the ribbon. */
  year?: string;
  /** Only when it is written on the medal (e.g. "Gold medal, national champion"). */
  tier?: string;
  subject: Subject;
}

export const SUBJECTS: { id: Subject; label: string }[] = [
  { id: 'math', label: 'Math' },
  { id: 'physics', label: 'Physics' },
  { id: 'chemistry', label: 'Chemistry' },
  { id: 'astronomy', label: 'Astronomy' },
  { id: 'biology', label: 'Biotechnology' },
  { id: 'science', label: 'Science' },
  { id: 'energy', label: 'Energy' },
];

export const medals: Medal[] = [];
