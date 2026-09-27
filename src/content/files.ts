// Documents served straight from /public/files, listed at /files.
// To add one: drop the PDF in public/files/ and add an entry here. The file name
// is the permanent part of the link, so rename before adding, never after.
export interface FileEntry {
  /** File name inside /public/files — this is what the public link ends with. */
  file: string;
  title: string;
  /** One line on what the document is. */
  note: string;
  /** Date or period the document refers to. */
  meta: string;
}

export interface FileGroup {
  heading: string;
  items: FileEntry[];
}

export const SITE = 'https://gabrielmr.com';

export const fileUrl = (file: string) => `${SITE}/files/${file}`;

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
    ],
  },
  {
    heading: 'Tests',
    items: [
      {
        file: 'sat-score-report.pdf',
        title: 'SAT score report',
        note: '1510 total: 730 reading and writing, 780 math',
        meta: 'September 2025',
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
];
