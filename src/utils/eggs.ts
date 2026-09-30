// Easter eggs talk through one channel: anything on the site can `sayEgg(...)`
// and the EasterEggs component shows it in the corner, in the voice of /story.
export const EGG_EVENT = 'gmr:egg';

export interface EggDetail {
  text: string;
  /** Something to run alongside the line: a pig across the floor, the truck. */
  show?: 'pig' | 'pigs' | 'truck';
}

export function sayEgg(text: string, show?: EggDetail['show']) {
  window.dispatchEvent(new CustomEvent<EggDetail>(EGG_EVENT, { detail: { text, show } }));
}
