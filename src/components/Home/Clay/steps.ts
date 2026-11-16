// The clock of a clay story: every step holds, then the scene travels to the next one.
export const HOLD_MS = 2200;
export const TRAVEL_MS = 900;

export const stillSrc = (slug: string, index: number, dark: boolean): string =>
  `/work/${slug}/clay-${index + 1}-${dark ? 'dark' : 'light'}.webp`;
