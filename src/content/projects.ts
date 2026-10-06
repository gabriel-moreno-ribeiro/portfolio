// Detail pages behind the "Cool Things" cards (/work/:slug).
// The card grid on the home page reads title/cardDesc/tags from here too, so a
// project is described in exactly one place.

export interface ProjectStat {
  value: string;
  label: string;
}

export interface ProjectSection {
  heading: string;
  body: string[];
}

export interface ProjectLink {
  href: string;
  label: string;
  external?: boolean;
}

export interface Project {
  slug: string;
  /** Short name for the card and the browser tab. */
  title: string;
  eyebrow: string;
  /** One line under the headline, and the meta description. */
  summary: string;
  /** The paragraph shown on the home card. */
  cardDesc: string;
  /** Pills on the home card. */
  tags: string[];
  period?: string;
  role?: string;
  stats: ProjectStat[];
  sections: ProjectSection[];
  links?: ProjectLink[];
  /** Files in public/work/<slug>/, in order. The first one is the page hero. */
  gallery?: string[];
  /** Captions keyed by gallery filename. */
  captions?: Record<string, string>;
  /** Where the crop sits (CSS object-position) keyed by gallery filename; default centre. */
  focus?: Record<string, string>;
}

export const projects: Project[] = [
  {
    slug: 'hibeex',
    title: 'HIBEEX',
    eyebrow: 'Company',
    summary: 'Backoffice AI for small and medium businesses: raw data in, decisions out.',
    cardDesc:
      'Backoffice AI for small and medium businesses: raw data in, decisions out. One of 6 startups in the Canastra Ventures AI Residency.',
    tags: ['TypeScript', 'Next.js', 'Supabase', 'AWS', 'AI/ML'],
    period: 'January 2026 to present',
    role: 'Building HIBEEX',
    stats: [
      { value: '6', label: 'startups in the Canastra AI Residency' },
      { value: '2026', label: 'started' },
    ],
    sections: [
      {
        heading: 'What it does',
        body: [
          'Backoffice AI for small and medium businesses. Raw data goes in, decisions come out.',
        ],
      },
      {
        heading: 'Where it is',
        body: [
          'One of 6 startups in the Canastra Ventures AI Residency. I am building it.',
        ],
      },
      {
        heading: 'Stack',
        body: [
          'TypeScript, Next.js and Node.js. Supabase and PostgreSQL for data. AWS for infrastructure.',
        ],
      },
    ],
    links: [{ href: 'https://www.hibeex.com.br/', label: 'hibeex.com.br', external: true }],
    gallery: ['01.webp', '02.webp', '03.webp', '04.webp'],
    focus: {
      '01.webp': '50% 10%', // the five faces sit in the top half
      '02.webp': '50% 15%', // portrait: heads and the WOW banner
      '03.webp': '20% 50%', // Gabriel presenting, on the left edge
    },
  },
  {
    slug: 'candela',
    title: 'Projeto Candela',
    eyebrow: 'Project',
    summary:
      'Low-cost physics lab kits, built and taken to 28 public schools in Salvador. 3,392 students so far.',
    cardDesc:
      'Low-cost physics lab kits I built and delivered to 28 public schools. 3,392 students so far. Physics failure rates in those classes went from 30% to 10%.',
    tags: ['3,392 students', '28 schools', '30% → 10%'],
    period: '2023 - 2024',
    role: 'Started Projeto Candela',
    stats: [
      { value: '3,392', label: 'students reached' },
      { value: '28', label: 'public schools' },
      { value: '30% → 10%', label: 'physics failure rate' },
      { value: '5', label: 'experiments per kit' },
    ],
    sections: [
      {
        heading: 'Why',
        body: [
          'I won a gold medal at OBFEP, the physics olympiad for public schools. I put the prize money into building physics kits and took them to public schools in Salvador.',
          'Most of those schools teach physics without a lab. The kit is an attempt to fix that for the price of a box of parts.',
        ],
      },
      {
        heading: 'The kit',
        body: [
          'A wooden box built to be carried between classrooms and stored in a cupboard. Inside: a caliper, a spring scale, a stopwatch, a measuring tape, weights, a graduated cylinder, and the parts for five experiments.',
          'Nothing in it needs a technician, a power outlet, or a part that has to be ordered from out of state.',
        ],
      },
      {
        heading: 'What happened',
        body: [
          '3,392 students in 28 public schools have used the kits. In the classrooms that ran them, physics failure rates went from 30% to 10%.',
          'The work was advised by Coronel Iran Domingues Machado. The write-up is below.',
        ],
      },
    ],
    links: [
      { href: '/research/projeto-candela/paper.pdf', label: 'Read the paper (PDF)', external: true },
    ],
    gallery: ['01.webp', '02.webp', '03.webp', '04.webp', '05.webp', '06.webp', '07.webp', '08.webp'],
    captions: {
      '01.webp': 'The kit as it goes out to a school',
      '02.webp': 'The track and car, set up for a run',
      '03.webp': 'Everything inside the box',
      '04.webp': 'Measuring the car with the caliper',
      '05.webp': 'The protractor stand',
      '06.webp': 'The inclined plane, with the mass hanging',
      '07.webp': 'Spring scale and graduated cylinder',
      '08.webp': 'The pulley stand and the ramp',
    },
    focus: {
      '01.webp': '50% 90%', // the box and its label sit low in the frame
      '03.webp': '50% 60%',
      '05.webp': '50% 20%', // protractor at the top of the stand
      '07.webp': '50% 20%',
      '08.webp': '50% 60%',
    },
  },
  {
    slug: 'medals',
    title: '39 Olympiad Medals',
    eyebrow: 'Competitions',
    summary:
      '39 medals in 49 academic olympiads across math, physics, chemistry, biology and astronomy. 19 of them gold.',
    cardDesc:
      '49 competitions in math, physics, chemistry and astronomy. 1st of 10,000+ at IFT-UNESP. Gold at ONNEQ. 1st at OBAQ.',
    tags: ['19 gold', '2 international', '1st IFT-UNESP'],
    stats: [
      { value: '39', label: 'medals in 49 competitions' },
      { value: '19', label: 'gold' },
      { value: '2', label: 'international' },
      { value: '1st', label: 'of 10,000+ at IFT-UNESP' },
    ],
    sections: [
      {
        heading: 'The record',
        body: [
          '39 medals in 49 competitions, across math, physics, chemistry, biology and astronomy. 19 gold, 2 of them international.',
          'The gold at OBFEP, the physics olympiad for public schools, is the one that turned into Projeto Candela.',
        ],
      },
      {
        heading: 'Selections',
        body: [
          '1st of more than 10,000 applicants at IFT-UNESP, the Institute for Theoretical Physics, and the only student from the Northeast picked that year.',
          '1st at OBAQ, top 0.014%. Gold at ONNEQ, top 0.675%. Silver at OBMEP and bronze at OBQ.',
        ],
      },
      {
        heading: 'Alongside',
        body: [
          'SAT 1510/1600, top 1% in Brazil.',
        ],
      },
    ],
  },
  {
    slug: 'gsat',
    title: 'GSAT Education',
    eyebrow: 'Company',
    summary: 'A test-prep platform I built from scratch.',
    cardDesc: 'A test-prep platform I built from scratch, November 2025 to May 2026.',
    tags: ['React', 'TypeScript', 'Node.js', 'EdTech'],
    period: 'November 2025 - May 2026',
    role: 'Built a test-prep platform from scratch',
    stats: [{ value: '0 → 1', label: 'built from scratch' }],
    sections: [
      {
        heading: 'What it was',
        body: [
          'An EdTech platform for standardized test prep. I built it from scratch: product, engineering and go-to-market.',
        ],
      },
    ],
  },
  {
    slug: 'desmos',
    title: 'Desmos Drawings',
    eyebrow: 'Hobby',
    summary: 'Characters drawn in Desmos with nothing but equations.',
    cardDesc:
      'A hobby: characters drawn in Desmos with nothing but equations. A laptop with the flu, a processor in a propeller cap, and a bug that finally got fixed.',
    tags: ['Desmos', 'Math', 'Hobby'],
    stats: [],
    sections: [
      {
        heading: 'What it is',
        body: [
          'I draw characters in Desmos, the graphing calculator, and every line on the screen is a formula. Rounded shapes come from high powers, the colors are inequalities filling a region, and the propeller blades are rotated ellipses.',
        ],
      },
      {
        heading: 'The three in the videos',
        body: [
          'A laptop with the flu, with a thermometer, an ice pack and a mug on the side. A processor wearing a propeller cap and holding a screwdriver. And a bug, the insect kind, with a bandage and a magnifying glass: a fixed bug. Each video shows the drawing going up one equation at a time.',
        ],
      },
    ],
    gallery: ['laptop-flu.mp4', 'processor.mp4', 'fixed-bug.mp4'],
    captions: {
      'laptop-flu.mp4': 'A laptop with the flu',
      'processor.mp4': 'A processor in a propeller cap',
      'fixed-bug.mp4': 'A fixed bug',
    },
  },
];

/** Gallery files can be videos: a video's poster is "<name>-poster.webp" next to it. */
export const isVideo = (file: string) => file.endsWith('.mp4');
export const posterFor = (slug: string, file: string) => `/work/${slug}/${file.replace(/\.mp4$/, '-poster.webp')}`;

export const projectBySlug = (slug: string | undefined) =>
  projects.find((p) => p.slug === slug);
