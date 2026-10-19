// What Gabriel is listening to, top one first. Fixed for now, so keep this the
// only place the card reads from. Covers are optional (empty shows the grey square).
const spotifySearch = (q: string) => `https://open.spotify.com/search/${encodeURIComponent(q)}`;

export type Track = { title: string; artist: string; url: string; cover?: string };

export const nowPlaying: Track[] = [
  { title: "Alone Again (Naturally)", artist: "Gilbert O'Sullivan", url: spotifySearch("Alone Again (Naturally) Gilbert O'Sullivan"), cover: "/covers/alone-again.webp" },
  { title: "Don't Look Back in Anger", artist: "Oasis", url: spotifySearch("Don't Look Back in Anger Oasis"), cover: "/covers/dont-look-back-in-anger.webp" },
  { title: "Wicked Game", artist: "Chris Isaak", url: spotifySearch("Wicked Game Chris Isaak"), cover: "/covers/wicked-game.webp" },
];
