// The one-pager at /one-pager: Gabriel first, Hibeex second. For the Behring
// Founders phase 3 (3 to 6 December, São Paulo) and any intro. Facts come from
// Gabriel's brief, his résumé, his phase-1 application and the team's LinkedIn
// profiles. Written in his voice: short sentences, plain words, no dashes.

export const head = {
  name: 'Gabriel Moreno Ribeiro',
  facts: ['18 years old', 'Founder of Hibeex', 'From Salvador, Brazil'],
  city: 'São Paulo',
  intro:
    'I started fixing cars with my grandfather in a small town in Ceará when I was 6. Later I repaired laptops in Salvador and, at 12, helped run the back office of my father’s clinic. Today I build Hibeex, which runs the back office of small and medium businesses.',
  contact: [
    { label: 'me@gabrielmr.com', href: 'mailto:me@gabrielmr.com' },
    { label: 'gabrielmr.com', href: 'https://gabrielmr.com' },
    { label: 'linkedin.com/in/gabriel-moreno-ribeiro', href: 'https://linkedin.com/in/gabriel-moreno-ribeiro' },
  ],
  program: ['Behring Founders, phase 3', 'Arenas: enterprise AI, fintech, services'],
};

export const origin = [
  'I grew up between Salvador and Missão Velha, a small town in Ceará where my grandfather has a garage. I started helping him fix cars when I was 6.',
  'In Salvador I repaired laptops to pay for school: 121 of them, sent to 21 states, all by referral. Some of the problems were software, and the only tutorials that covered them were in Hindi, so at 11 I wrote a Python script that translates and dubs those videos into Portuguese.',
  'In 2020 my father’s clinic nearly closed. My mother took over the front desk and I built what I could: a chatbot with her voice to answer the phone, an automation to collect what the health plans owed, and a dashboard with the data and the contracts. It was my first look at how a small business runs.',
  'At 14 I founded Projeto Candela, which makes free 3D-printed physics kits for public schools with the Federal University of Bahia. We visited 60 schools before we had a budget, paid for the first kits with crowdfunding and reached 28 schools and 3,392 students. In the same years I won 39 medals in science olympiads.',
  'At 18 I moved to São Paulo to build Hibeex with Teodoro, my co-founder.',
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
  'Hibeex is what I am building now. We charge per workflow delivered, and later per result. The goal is the whole back office of a Brazilian SMB (accounting, finance and legal) in one operation, with embedded credit, sold through the accountant the business already trusts.',
  'Running the back office as a service, from inside our clients, is also the model I want to keep working on after Hibeex: services that run on AI for small businesses, in finance and in company operations. That is why I picked enterprise AI, fintech and services as my arenas at Behring Founders.',
];

export const ask = {
  intro: 'I want to talk to:',
  people: [
    { who: 'People who already do finance, tax or legal for SMBs at scale,', examples: 'like Contabilizei, Conta Simples, Qive, Cora, and Enter on the legal side.' },
    { who: 'People who have the accountant as a channel,', examples: 'like Nibo, Omie and Conta Azul, which just bought Mister Contador. I want to understand how they built that relationship and what the accountant really pays for.' },
    { who: 'People who invest in AI-powered services,', examples: 'like Atlantico, a16z and Valor. I want to hear the hardest questions about distribution and dependence on the APIs.' },
    { who: 'And anyone who read this far.', examples: 'That was a whole page about back offices. I owe you a coffee.' },
  ],
};

export const footer = 'Hibeex: accounting, finance and legal for SMBs in one operation. October 2026.';

// The build time busts the 30-day cache on /files when the PDF is regenerated.
export const PDF = `/files/gabriel-moreno-ribeiro-hibeex.pdf?v=${encodeURIComponent(__BUILD_TIME__)}`;
