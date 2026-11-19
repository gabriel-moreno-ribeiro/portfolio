// The clock of a clay story: the scene travels to a step (TRAVEL_MS) and the step plays out.
// Each step lasts as long as its performance needs; a whole story loops in 16 s (the laptop repair, with its teardown, in under 20 s).
export const TRAVEL_MS = 700;
const STEP_MS: Record<string, number[]> = {
  hibeex: [3000, 3000, 3300, 3200, 3400],
  candela: [2500, 2900, 4300, 5000, 3100],
  laptops: [2700, 4000, 2900, 3700, 2900, 2800],
};
export const stepMs = (slug: string, index: number): number => STEP_MS[slug]?.[index] ?? 3100;

export const stillSrc = (slug: string, index: number, dark: boolean): string =>
  `/work/${slug}/clay-${index + 1}-${dark ? 'dark' : 'light'}.webp`;
