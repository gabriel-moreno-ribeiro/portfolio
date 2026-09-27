// Content for /story: the personal statement, split into blocks so animated
// figures can sit between specific paragraphs. Text is verbatim; the only
// inline markup supported is *italic*.

export type FigureId =
  | 'town'
  | 'porca'
  | 'numbers'
  | 'truck'
  | 'missao-velha'
  | 'laptops'
  | 'salvador'
  | 'chat'
  | 'repos'
  | 'end';

export type Block =
  | { type: 'p'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'figure'; id: FigureId };

export const story = {
  eyebrow: 'Personal statement',
  title: 'My Story.',
  subtitle: 'A garage in Missão Velha, a red Chevrolet D20, a pig named Merlita, 121 laptops, J.A.R.V.A.N.A., and one burned fuse.',
  // Drop the file in public/story/ and set the path here to show a download button, e.g. "/story/personal-statement.pdf"
  pdf: '',
};

export const blocks: Block[] = [
  {
    type: 'p',
    text: "My grandfather Adalberto had a garage in Missão Velha, a town of 35,672 people in the countryside of Ceará state. It's small enough that I'm fairly confident half the town is my cousin and the other half married one.",
  },
  { type: 'figure', id: 'town' },
  {
    type: 'p',
    text: "He'd spent 76 years on a farm, so his garage was less a business than his idea of retirement. I spent my childhood there handing him tools, a skill I was bad at in ways that entertained him for years. The first time he asked for a *porca*, I came back from the garden with Merlita, our pig. In Portuguese, the word for a bolt's nut also means a female pig.",
  },
  { type: 'figure', id: 'porca' },
  {
    type: 'p',
    text: "Then, Alzheimer's came. He would hold a tool and not find the word for it, so he stopped reaching for words at all. Everything in the garage got a number instead. The pliers became #4. The angle grinder, #12. The wrench (the one that turns a *porca*) was #1. I'd spent years getting the names wrong; now I was the one who had to remember.",
  },
  { type: 'figure', id: 'numbers' },
  {
    type: 'p',
    text: "The car I remember best (#9) is a red Chevrolet D20 he'd bought to move animals around, Merlita included. It wouldn't start. First we replaced the battery. Then the alternator. Then the fuel filter. Every part cost money we didn't have, on a truck that still wouldn't turn over. On the 3rd afternoon, we found it: a burned fuse, the cheapest piece in the entire vehicle, worth less than the coffee he drank while we guessed.",
  },
  { type: 'figure', id: 'truck' },
  {
    type: 'quote',
    text: 'That was the last car we fixed together. Not long after, the garage was empty, still full of numbers I now refused to remember.',
  },
  { type: 'figure', id: 'missao-velha' },
  {
    type: 'p',
    text: 'Back in Salvador, my "2nd home" (as I used to tell him, so he wouldn\'t get jealous), our apartment had no room for a truck, so I kept opening smaller things. From disassembling bicycles to fixing our washing machine, next thing I knew, I was working with old thermal paste, dead fans, dying hard drives. Word moved through neighbors and then through their neighbors, and then somehow well past them. Before I knew it, four years had gone by, I\'d worked on 121 laptops and had shipped to 21 of Brazil\'s 26 states. Around the 82nd machine, every component tested fine, but the laptop still crashed on the BIOS screen, and that\'s how I got into software, and how I learned to say "hey guys" in Hindi, after watching 198:18:37 hours of tutorials.',
  },
  { type: 'figure', id: 'laptops' },
  {
    type: 'quote',
    text: 'That\'s when I understood: the wall between "broken" and "working" is thinner than people assume, and almost nobody bothers to look. That wasn\'t only true for hardware.',
  },
  { type: 'figure', id: 'salvador' },
  {
    type: 'p',
    text: 'The first thing I built was for my mother, Silvana. Six years ago, my father nearly went bankrupt. My mom stepped in as his secretary, which made her the scheduler, the receptionist, and the person expected to know which service to recommend to a patient who called at 9PM saying: "my tooth kind of hurts but only when I eat beans." I built her a chatbot with her own voice: I recorded my mom answering 62 questions, trained a model to sound like her, and named it J.A.R.V.A.N.A. (Jarvis + Silvana).',
  },
  { type: 'figure', id: 'chat' },
  {
    type: 'p',
    text: "J.A.R.V.A.N.A. (please, don't sue me Marvel) gave my mother a break, but it also gave me an idea. Then another. Then I lost count (sorry, grandpa).",
  },
  {
    type: 'p',
    text: "Thirty-one GitHub repos later: #17, merlita-escape-detector (she's escaped twice). #21, hindi-to-portuguese-youtube. The ones I'm proudest of: #19, candela-3d-models (physics kits for public schools), and #28, hibeex-v2 (AI for small businesses). Most are open. They know me better than I do.",
  },
  { type: 'figure', id: 'repos' },
  {
    type: 'p',
    text: "My grandfather left school at 8, never had the right tools, and built a 29.52m² garage anyway: he remains the best engineer I've ever met. I always thought he was teaching me to fix things, but he was teaching me to build. That's what I want to keep doing, with my hands and my computer, to help the people around me who haven't found the right fuse yet.",
  },
  { type: 'figure', id: 'end' },
];
