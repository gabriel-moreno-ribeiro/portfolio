// What Gabriel is listening to, top one first. Fixed for now; the plan is to
// feed it from the YouTube Music account, so keep this the only place the card
// reads from. Covers are optional (empty shows the grey square).
const ytSearch = (q: string) => `https://music.youtube.com/search?q=${encodeURIComponent(q)}`;

export type Track = { title: string; artist: string; url: string; cover?: string };

export const nowPlaying: Track[] = [
  { title: "Alone Again (Naturally)", artist: "Gilbert O'Sullivan", url: ytSearch("Alone Again (Naturally) Gilbert O'Sullivan") },
  { title: "Ain't No Sunshine", artist: "Michael Jackson", url: ytSearch("Ain't No Sunshine Michael Jackson") },
  { title: "Love Me Like There's No Tomorrow", artist: "Freddie Mercury", url: ytSearch("Love Me Like There's No Tomorrow Freddie Mercury") },
];
