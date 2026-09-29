// Content for /news. Edit this file to add items; no code changes needed.
//
// One list, newest first. Each entry is one mention of HIBEEX, Projeto Candela
// or Gabriel. Fields:
//   kind       'press' (an article), 'program' (a selection or cohort), 'post' (an Instagram post)
//   date       shown as written, e.g. "2026" or "Dec 2023"
//   year       used to group the timeline
//   outlet     publication, organisation or Instagram handle, e.g. "@wowaceleradora"
//   title      one line, in English
//   summary    optional, one sentence, in English
//   url        optional, where "Read" points
//   instagram  public post URL, only for kind 'post'; renders the embed
//   featured   optional; the first entry with featured: true is pulled out of
//              the timeline and shown as the wide card at the top

export type Mention = {
  kind: 'press' | 'program' | 'post';
  date: string;
  year: number;
  outlet: string;
  title: string;
  summary?: string;
  url?: string;
  instagram?: string;
  featured?: boolean;
};

export const mentions: Mention[] = [
  {
    kind: 'program',
    date: '2026',
    year: 2026,
    outlet: 'Canastra Ventures',
    title: 'HIBEEX selected for the Canastra Ventures AI Residency',
    summary: "One of 6 startups in the R1'26 cohort. Backoffice AI for small and medium businesses: raw data in, decisions out.",
    url: 'https://www.hibeex.com.br/',
    featured: true,
  },
  {
    kind: 'program',
    date: '2026',
    year: 2026,
    outlet: 'European Innovation Academy',
    title: "HIBEEX accepted into the European Innovation Academy's Undergraduate Entrepreneurship Program",
    summary: 'One of 10 teams selected from more than 5,000 applicants, and the only one from Brazil.',
  },
  {
    kind: 'post',
    date: '2026', // TODO(Gabriel): confirm date
    year: 2026,
    outlet: '@wowaceleradora',
    title: 'HIBEEX among the finalists at WOW Day, Batch #34',
    summary: 'WOW asked the finalists what they would tell the next batch. Part one of the series features HIBEEX.',
    instagram: 'https://www.instagram.com/p/DcBlbZOh5hx/',
  },
  {
    kind: 'post',
    date: '2025', // TODO(Gabriel): confirm date
    year: 2025,
    outlet: '@institutoprincipia',
    title: "Three years at Instituto Principia's Escola de Talentos, in one video",
    summary: "The institute's alumni series. Gabriel talks about what changed over three years in the program.",
    instagram: 'https://www.instagram.com/p/DRhNb1vgH3p/',
  },
  {
    kind: 'post',
    date: '2025', // TODO(Gabriel): confirm date
    year: 2025,
    outlet: '@institutoprincipia',
    title: '4th Escola de Talentos meeting, São Paulo',
    summary: "Three days with students from across Brazil: final projects, the Museu do Ipiranga and USP's medical school.",
    instagram: 'https://www.instagram.com/p/DMyVaLxPwab/',
  },
  {
    kind: 'post',
    date: 'Dec 2023',
    year: 2023,
    outlet: '@institutoprincipia',
    title: 'Presenting at the International Institute of Physics, Natal',
    summary: 'Escola de Talentos students presented their projects at the IIF‑UFRN science week.',
    instagram: 'https://www.instagram.com/p/C0mIBI9MMmB/',
  },
  {
    kind: 'post',
    date: 'Dec 2023',
    year: 2023,
    outlet: '@institutoprincipia',
    title: 'Science week at IIF‑UFRN, December 4 to 8',
    summary: 'Lectures, seminars and a visit to the Barreira do Inferno launch center with 21 physics students.',
    instagram: 'https://www.instagram.com/p/C0jwc81sCGO/',
  },
];
