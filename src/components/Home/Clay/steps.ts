// Scroll progress (0..1 over the pinned track) -> a float step: each step holds for
// HOLD of its share of the scroll, then travels linearly to the next one.
export const HOLD = 0.42;

export function stepOf(progress: number, count: number): number {
  const t = Math.min(Math.max(progress, 0) * count, count - 1);
  const i = Math.floor(t);
  if (i >= count - 1) return count - 1;
  return i + Math.min(1, Math.max(0, (t - i - HOLD) / (1 - HOLD)));
}

// Where to scroll to land in the middle of a step's hold.
export const progressOfStep = (index: number, count: number): number => (index + HOLD / 2) / count;

export const stillSrc = (slug: string, index: number, dark: boolean): string =>
  `/work/${slug}/clay-${index + 1}-${dark ? 'dark' : 'light'}.webp`;
