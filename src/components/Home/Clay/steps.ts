// The clock of a clay story: the scene travels to a step (TRAVEL_MS) and the step plays out.
// Each step lasts as long as its performance needs; a whole story loops in under 16 s.
export const TRAVEL_MS = 700;
const STEP_MS: Record<string, number[]> = {
  hibeex: [3000, 3000, 3300, 3200, 3400],
  candela: [2600, 3100, 3600, 3300, 3300],
  laptops: [3000, 3600, 2900, 3100, 3300],
};
export const stepMs = (slug: string, index: number): number => STEP_MS[slug]?.[index] ?? 3100;

export const stillSrc = (slug: string, index: number, dark: boolean): string =>
  `/work/${slug}/clay-${index + 1}-${dark ? 'dark' : 'light'}.webp`;
