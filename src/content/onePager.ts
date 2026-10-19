// The one-pager at /one-pager: Gabriel first, Hibeex second. For the Behring
// Founders phase 3 (3 to 6 December, São Paulo) and any intro. Facts come from
// Gabriel's brief, his résumé, his phase-1 application and the team's LinkedIn
// profiles. Written in his voice: short sentences, plain words, no dashes.

export const head = {
  name: 'Gabriel Moreno Ribeiro',
  facts: ['18 years old', 'Founder of Hibeex', 'From Salvador, Brazil'],
  city: 'São Paulo',
  intro:
    'I started out fixing cars with my grandfather in a small town in Ceará. Then came laptops, in Salvador, and the back office of my father’s clinic when it nearly closed. Today I fix the back office of small and medium businesses, with Hibeex.',
  contact: [
    { label: 'me@gabrielmr.com', href: 'mailto:me@gabrielmr.com' },
    { label: 'gabrielmr.com', href: 'https://gabrielmr.com' },
    { label: 'linkedin.com/in/gabriel-moreno-ribeiro', href: 'https://linkedin.com/in/gabriel-moreno-ribeiro' },
  ],
  program: ['Behring Founders, phase 3', 'Arenas: enterprise AI, fintech, services'],
};

export const origin = [
  'My grandfather’s garage is in Missão Velha, in the interior of Ceará. The last car we fixed together sat there for three afternoons. We changed the battery, the alternator and the filter, and the fault was a fuse, the cheapest part in the truck.',
  'In Salvador I repaired laptops to pay for school: 121 of them, shipped to 21 states, all by referral. Some passed every hardware test and still froze at the BIOS. That was software, and the only tutorials that got me unstuck were in Hindi. At 11 I knew enough Python to write a script that translates and dubs those videos into Portuguese.',
  'In 2020, at 12, I watched my father’s clinic nearly close. My mother became the receptionist and I did what I could: a chatbot with her voice to answer the phone, an automation to collect what the health plans owed him, and a dashboard with the data and the contracts in one place. It was the first small business I saw from the inside.',
  'At 14 I founded Projeto Candela. It started with a crowdfunding campaign and 60 schools visited before there was any budget, and became 3D-printed physics kits, free, in 28 public schools and 3,392 students, with the Federal University of Bahia. In the same years came 39 medals in science olympiads.',
  'At 18 I moved to São Paulo to live with Teodoro, my co-founder, and build Hibeex.',
];

export const now = [
  'Hibeex runs the back office of small and medium businesses through the people who already look after them: the accountant, the finance BPO and the lawyer. An SMB owner spends more than 1,300 hours a year on it (about 54 days, without sleeping). We plug into the systems the firm already uses (Domínio, Conta Azul, Nibo, Omie), clean up the data and put agents to work: reconciliation, collections, contracts.',
  'Before the first commit, Teodoro and I talked to 96 people, from SMB owners to COOs at big tech. The first sales made it clear that the cycle is top-down, and that slows the pace. So today we work from inside the operations of companies in Porto Alegre and São Paulo, doing the back office as a service, to learn the process from the inside before going back to the product.',
];

// Traction, split by what it measures.
export const base = [
  { figure: '3', label: 'accounting firms as design partners' },
  { figure: '40+', label: 'SMB accounts running the agents' },
];

// MRR today and with the contract already signed. Values in R$ thousand.
export const mrr = {
  today: { value: 3, label: 'today', note: 'covers our costs' },
  signed: { value: 40, label: 'Jan 2027', note: 'contract signed with RP Métodos, 35% of the addressable accounts in his portfolio' },
};

// Measured at a single client. Bars are drawn to scale against `before`.
export const results = [
  { label: 'Accounting service', before: 8, after: 2, unit: 'h', format: (n: number) => `${n}h` },
  { label: 'Days to get paid', before: 63.9, after: 9, unit: 'days', format: (n: number) => `${n} days`, note: '55 days of cash back' },
];
export const singles = [
  { figure: '94%', label: 'accuracy in automatic reconciliation' },
  { figure: 'R$ 12,480', label: 'recovered for a single client' },
];
export const pipeline = 'About 730 accounting firms in the pipeline. The target is 750 partner firms in 36 months, about 49,000 SMBs.';

export const team = [
  {
    name: 'Teodoro Trevisan',
    role: 'co-founder',
    href: 'https://www.linkedin.com/in/teodoro-trevisan',
    text: 'From Porto Alegre, analyzing data since he was 14, when he joined Poatek. He was admitted to engineering at UT Austin and chose a year of building instead. He founded Voluntaria+, which brought more than R$ 100,000 to NGOs. We met at Fundação Estudar’s Prep program.',
  },
  {
    name: 'Devansh Chopra',
    role: 'CTO, joining through Entrepreneur First',
    href: 'https://www.linkedin.com/in/devansh-chopra0526',
    text: 'Master’s in Computer Science from St Andrews and winner of the BlackRock Hackathon 2026. At Vyntelligence he put agent workflows into production for more than 15 enterprise clients. He is coming straight from San Francisco.',
  },
];

export const validators = [
  { name: 'Rudimar Pascoal', role: 'RP Métodos', href: 'https://www.linkedin.com/in/rudimarpascoal/', text: 'Sixth-largest Domínio user in Brazil, more than 800 accounts. Contract signed.' },
  { name: 'Carla Koenig', role: 'finance BPO', href: 'https://www.linkedin.com/in/carla-koenig-de-azevedo-33a55255/', text: 'A pioneer of finance BPO in Brazil, with an exit at Ampulheta.' },
  { name: 'Luciano Oliveira', role: 'Grupo Voalle', href: 'https://www.linkedin.com/in/luciano-oliveira-11718749/', text: 'CTO of Grupo Voalle, product advisor.' },
];

export const year = [
  { name: 'Canastra AI Residency', text: '1 of 6 startups in Brazil. Teodoro and I are the youngest founders in the program’s history.' },
  { name: 'European Innovation Academy, London', text: '1 of 10 in the world, from 5,000+ applicants.' },
  { name: 'Latitud Fellowship', text: 'top 20%. Also LALA Start, Claude for Startups and AWS for Startups.' },
];

export const build = [
  'First we charge per workflow delivered, then per result. In four years I want the whole back office of the Brazilian SMB in one operation, with embedded credit, sold by the people the SMB already trusts.',
  'In my grandfather’s garage, the town brought in whatever had stopped working and he would not let go until he found the fuse. I want to build that place for small businesses.',
];

export const ask = {
  intro: 'In December I want to talk to three kinds of people.',
  people: [
    { who: 'People who already do finance, tax or legal for SMBs at scale,', examples: 'like Contabilizei, Conta Simples, Qive, Cora, and Enter on the legal side.' },
    { who: 'People who have the accountant as a channel,', examples: 'like Nibo, Omie and Conta Azul, which just bought Mister Contador. I want to understand how they built that relationship and what the accountant really pays for.' },
    { who: 'People who invest in AI-powered services,', examples: 'like Atlantico, a16z and Valor. I want to hear the hardest questions about distribution and dependence on the APIs.' },
  ],
  close: 'I bring the product running. If that’s you, write to me.',
};

export const footer = 'Hibeex: accounting, finance and legal for SMBs in one operation. October 2026.';

// The build time busts the 30-day cache on /files when the PDF is regenerated.
export const PDF = `/files/gabriel-moreno-ribeiro-hibeex.pdf?v=${encodeURIComponent(__BUILD_TIME__)}`;
