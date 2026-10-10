// The medals Gabriel photographed, one entry per photo in public/work/medals/wall/.
// Names, years and levels were read off each medal (or its ribbon) by two
// independent passes and a third that settled every disagreement. A field is
// empty when the medal doesn't say it; the one exception is marked below.

export type Subject = 'math' | 'physics' | 'chemistry' | 'astronomy' | 'science' | 'energy' | 'biology';

export interface Medal {
  /** File number in public/work/medals/wall/ (and wall/full/). */
  num: string;
  /** Short name for the wall. */
  name: string;
  /** Full name, standard spelling, only when the medal prints it. */
  fullName?: string;
  /** Only when it is written on the medal. */
  year?: string;
  /** Only when it is written on the medal. */
  tier?: string;
  subject: Subject;
}

const MSF = 'Mathématiques sans Frontières';
const MSF_FULL = 'Olimpíada Internacional Mathématiques sans Frontières';
const OBFEP_FULL = 'Olimpíada Brasileira de Física das Escolas Públicas';

const ALL: Medal[] = [
  { num: '01', name: 'OBQ Júnior', fullName: 'Olimpíada Brasileira de Química Júnior', year: '2022', subject: 'chemistry' },
  { num: '02', name: MSF, fullName: MSF_FULL, year: '2022', tier: 'Gold medal, regional champion', subject: 'math' },
  { num: '03', name: MSF, fullName: MSF_FULL, year: '2023', tier: 'Gold medal, regional champion', subject: 'math' },
  { num: '04', name: 'Canguru de Matemática', fullName: 'Canguru de Matemática Brasil', year: '2024', subject: 'math' },
  { num: '05', name: 'OBQ Júnior', fullName: 'Olimpíada Brasileira de Química Júnior', year: '2022', subject: 'chemistry' },
  { num: '06', name: 'Mandacaru', subject: 'math' },
  { num: '07', name: 'OBMEP', year: '2024', subject: 'math' },
  // The medal prints no year; 2024 is from Gabriel's own file name.
  { num: '08', name: 'OBQ', fullName: 'Olimpíada Brasileira de Química', year: '2024', subject: 'chemistry' },
  { num: '09', name: 'OBFEP', fullName: OBFEP_FULL, subject: 'physics' },
  { num: '10', name: 'OBA', fullName: 'Olimpíada Brasileira de Astronomia e Astronáutica', year: '2021', tier: 'Gold medal', subject: 'astronomy' },
  { num: '11', name: MSF, fullName: MSF_FULL, year: '2021', tier: 'Gold medal, national champion', subject: 'math' },
  { num: '12', name: 'OBMEP', year: '2024', subject: 'math' },
  { num: '13', name: 'ONNEQ', fullName: 'Olimpíada Norte-Nordeste de Química', subject: 'chemistry' },
  { num: '14', name: 'OBFEP', fullName: OBFEP_FULL, subject: 'physics' },
  { num: '15', name: 'Olimpíada Nacional de Ciências', year: '2023', subject: 'science' },
  { num: '16', name: 'Mandacaru', subject: 'math' },
  { num: '17', name: 'ONEE', fullName: 'Olimpíada Nacional de Eficiência Energética', subject: 'energy' },
  { num: '18', name: 'Mandacaru', fullName: 'Olimpíada Mandacaru de Matemática', subject: 'math' },
  { num: '19', name: 'Olimpíada de Matemática do CMS', subject: 'math' },
  { num: '20', name: 'ONEE', fullName: 'Olimpíada Nacional de Eficiência Energética', year: '2022', subject: 'energy' },
  { num: '21', name: 'Olimpíada Nacional de Ciências', year: '2022', subject: 'science' },
  { num: '22', name: 'Canguru de Matemática', subject: 'math' },
  { num: '23', name: 'OBFEP', fullName: OBFEP_FULL, subject: 'physics' },
  { num: '24', name: MSF, fullName: MSF_FULL, year: '2022', tier: 'Gold medal, national champion', subject: 'math' },
  { num: '25', name: 'OMPBA', subject: 'math' },
  { num: '26', name: 'Canguru de Matemática', year: '2023', subject: 'math' },
  { num: '27', name: 'OBBiotec', fullName: 'Olimpíada Brasileira de Biotecnologia', year: '2023', subject: 'biology' },
  { num: '28', name: MSF, fullName: MSF_FULL, year: '2023', tier: 'Gold medal, national champion', subject: 'math' },
];

// Order on the wall (row by row around the photo), set by hand so the look-alike
// medals (five Mathématiques, three Canguru, three Mandacaru) never touch.
const WALL = [
  '10', '04', '02', '15', '20', '09', '27', '05',
  '11', '13',
  '06', '26',
  '08', '03',
  '14', '16',
  '24', '07',
  '21', '19',
  '17', '25', '28', '01', '22', '23', '12', '18',
];

export const medals: Medal[] = WALL.map((n) => ALL.find((m) => m.num === n)!);
