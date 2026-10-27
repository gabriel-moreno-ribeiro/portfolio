// Every document on the site, listed at /files. Most live in /public/files; the
// research papers keep their own folders under /public/research and say so in
// `path`. To add one: drop the PDF in public/files/ and add an entry here. The
// file name is the permanent part of the link, so rename before adding, never after.
export interface FileEntry {
  /** File name inside /public/files — this is what the public link ends with. */
  file: string;
  title: string;
  /** One line on what the document is. */
  note: string;
  /** Date or period the document refers to. */
  meta: string;
  /** Site path when the file lives outside /files, e.g. a research paper. */
  path?: string;
}

export interface FileGroup {
  heading: string;
  items: FileEntry[];
}

export const SITE = 'https://gabrielmr.com';

export const filePath = (item: FileEntry) => item.path ?? `/files/${item.file}`;
export const fileUrl = (item: FileEntry) => `${SITE}${filePath(item)}`;

export const fileGroups: FileGroup[] = [
  {
    heading: 'Resume',
    items: [
      {
        file: 'gabriel-moreno-ribeiro-resume.pdf',
        title: 'Resume',
        note: 'One page: education, HIBEEX, Projeto Candela, research, awards, skills.',
        meta: 'September 2026',
      },
      {
        file: 'gabriel-moreno-ribeiro-hibeex.pdf',
        title: 'One-pager',
        note: 'Gabriel and HIBEEX on one A4 sheet: where he comes from, traction, team, the ask.',
        meta: 'October 2026',
      },
    ],
  },
  {
    heading: 'Tests',
    items: [
      {
        file: 'sat-score-report.pdf',
        title: 'SAT score report',
        note: '1570 total: 770 reading and writing, 800 math',
        meta: 'October 2026',
      },
      {
        file: 'duolingo-english-test.pdf',
        title: 'Duolingo English Test',
        note: '130 overall, CEFR C1',
        meta: 'August 2026',
      },
    ],
  },
  {
    heading: 'School profiles',
    items: [
      {
        file: 'ari-de-sa-school-profile.pdf',
        title: 'Colégio Ari de Sá school profile',
        note: 'Fortaleza, Ceará. Grading, curriculum and class rank context.',
        meta: '2024-2025',
      },
      {
        file: 'colegio-militar-salvador-school-profile.pdf',
        title: 'Colégio Militar de Salvador school profile',
        note: 'Salvador, Bahia. Curriculum and grading context.',
        meta: '2026',
      },
    ],
  },
  {
    heading: 'Research',
    items: [
      {
        file: 'steady-state-hypothesis.pdf',
        path: '/research/chemical-kinetics/paper.pdf',
        title: 'The Steady-State Hypothesis',
        note: '150-page monograph on chemical kinetics, Instituto Principia, advisor Prof. Juliano Alves Bonacin.',
        meta: 'Revised October 2026',
      },
      {
        file: 'projeto-candela.pdf',
        path: '/research/projeto-candela/paper.pdf',
        title: 'Projeto Candela paper',
        note: 'Low-cost physics lab kits in public schools: 28 schools, 3,392 students.',
        meta: '2023-2024',
      },
    ],
  },
];
