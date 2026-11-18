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
  /** Photos promised but not here yet: that many marked, reserved boxes while `gallery` is empty. */
  photosToCome?: number;
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
      'Low-cost physics lab kits, built and taken to 28 public schools in Bahia and Ceará. 3,392 students so far.',
    cardDesc:
      'Low-cost physics lab kits I built and delivered to 28 public schools. 3,392 students so far. Physics failure rates in those classes went from 30% to 10%.',
    tags: ['3,392 students', '28 schools', '30% → 10%'],
    period: '2022 to present',
    role: 'Founder',
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
          'A wooden box built to be carried between classrooms and stored in a cupboard. Inside: a caliper, a spring scale, a stopwatch, a measuring tape, weights, a graduated cylinder and the parts for five experiments.',
          'Nothing in it needs a technician, a power outlet or a part that has to be ordered from out of state.',
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
    slug: 'laptops',
    title: 'Laptop repair',
    eyebrow: 'Repairs',
    summary: '121 laptops repaired in Salvador to pay for school, sent to 21 states, all by referral.',
    cardDesc:
      'I repaired laptops in Salvador to pay for school: 121 of them, sent to 21 states, all by referral. At 11 I wrote a Python script that dubs Hindi repair tutorials into Portuguese. And WiFixit: take a photo of the problem, get the tutorial that fixes it.',
    tags: ['121 laptops', '21 states', 'All by referral'],
    stats: [
      { value: '121', label: 'laptops repaired' },
      { value: '21', label: 'states they went to' },
      { value: '11', label: 'my age when I wrote the dubbing script' },
    ],
    sections: [
      {
        heading: 'Why',
        body: ['I repaired laptops in Salvador to pay for school. 121 of them, sent to 21 states, all by referral.'],
      },
      {
        heading: 'Hindi to Portuguese',
        body: [
          'Some of the problems were software, and the only tutorials that covered them were in Hindi. At 11 I wrote a Python script that translates and dubs those videos into Portuguese.',
        ],
      },
      {
        heading: 'WiFixit',
        body: ['Take a photo of the problem, get the tutorial that fixes it.'],
      },
      {
        heading: 'Where they went',
        body: ['21 states. The five they did not reach: Acre, Amazonas, Roraima, Amapá and Mato Grosso do Sul.'],
      },
    ],
    // PLACEHOLDER (owner): photos to come. Drop them in public/work/laptops/ (01.webp, 02.webp, …,
    // plus sm/ and thumbs/ copies like the other projects), list them here and remove photosToCome.
    gallery: [],
    photosToCome: 3,
  },
];

export const projectBySlug = (slug: string | undefined) =>
  projects.find((p) => p.slug === slug);
