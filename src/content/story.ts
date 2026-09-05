// Content for /story: the personal statement, split into blocks so animated
// figures can sit between specific paragraphs. Text is verbatim; the only
// inline markup supported is *italic*.

export type FigureId =
  | 'town'
  | 'porca'
  | 'ledger'
  | 'truck'
  | 'missao-velha'
  | 'laptops'
  | 'salvador'
  | 'chat'
  | 'repos'
  | 'scale'
  | 'end';

export type Block =
  | { type: 'p'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'figure'; id: FigureId };

export const story = {
  eyebrow: 'Personal statement',
  title: 'My Story.',
  subtitle: 'A garage in Missão Velha, a red Chevrolet D20, a pig named Merlita, 121 laptops, and one burned fuse.',
  // Drop the file in public/story/ and set the path here to show a download button, e.g. "/story/personal-statement.pdf"
  pdf: '',
};

export const blocks: Block[] = [
  {
    type: 'p',
    text: "My grandfather Adalberto had a garage in Missão Velha, a town of 35,672 people in the countryside of Ceará. It's small enough that I am fairly confident half the town is my cousin and the other half married one.",
  },
  { type: 'figure', id: 'town' },
  {
    type: 'p',
    text: "He'd spent 76 years on a farm, so the garage was less a business than a way of enjoying retirement. It still made him the 1st mechanic Missão Velha ever had. I spent my childhood there handing him tools, a skill I was bad at in ways that entertained him for years. The first time he asked for a *porca*, I came back from the garden with Merlita, our pig. In Portuguese, the word for the nut that goes on a bolt is also the word for a female pig.",
  },
  { type: 'figure', id: 'porca' },
  {
    type: 'p',
    text: "Sometimes people paid him. Mostly they didn't, and he didn't seem to mind their tabs. Once, our house caught fire before dawn. There was no fire department, so the town came. As he saw it, they owed him a few repairs and he owed them a house. Numbers, though – those he taught me to keep.",
  },
  { type: 'figure', id: 'ledger' },
  {
    type: 'p',
    text: "The car I remember best (#9) is a red Chevrolet D20 he'd bought to move animals around, Merlita included. It wouldn't start. First we replaced the battery. Then the alternator. Then the fuel filter. Every part cost money we didn't have, on a truck that still refused to turn over. On the 3rd afternoon, we found it: a burned fuse, the cheapest piece in the entire vehicle, worth less than the coffee he'd been drinking while we guessed.",
  },
  { type: 'figure', id: 'truck' },
  {
    type: 'quote',
    text: 'That was the last car we fixed together. But that date is the only number I refuse to recall.',
  },
  { type: 'figure', id: 'missao-velha' },
  {
    type: 'p',
    text: 'In Salvador, I started replicating what I\'d learned. From disassembling bicycles to fixing our washing machine, next thing I knew, I was working with old thermal paste, dead fans, dying hard drives. Word moved through neighbors and then through their neighbors, and then somehow well past them. By the time I looked up, four years had gone by, and I\'d worked on 121 laptops and had shipped to 21 of Brazil\'s 26 states. Around the 82nd machine, every component tested fine, but the laptop still crashed on the BIOS screen – and that\'s how I got into software, and how I learned to say "hey guys" in Hindi, after watching 198:18:37 hours of Indian tutorials (yes, I have a playlist with all of them).',
  },
  { type: 'figure', id: 'laptops' },
  {
    type: 'quote',
    text: 'That was when I understood: the wall between "broken" and "working" is thinner than people assume, and almost nobody bothers to look. That wasn\'t only true for hardware.',
  },
  { type: 'figure', id: 'salvador' },
  {
    type: 'p',
    text: 'The first thing I built was for my mother, Silvana. Six years ago, my father nearly went bankrupt. My mother stepped in as his secretary, which meant she was also the scheduler, the receptionist, and the person expected to know which service to recommend to a patient who called at nine in the evening saying: "my tooth kind of hurts but only when I eat beans." I built her a chatbot with her own voice – I recorded my mom answering 62 questions and trained a model to sound like her.',
  },
  { type: 'figure', id: 'chat' },
  {
    type: 'p',
    text: 'The chatbot gave my mother a break, but it also gave me an idea. Then another. Then I lost count (sorry, grandpa).',
  },
  {
    type: 'p',
    text: "Six years and thirty-one repos on GitHub later: #17, merlita-escape-detector. #21, hindi-to-portuguese-youtube. The ones I'm proudest of: #19, candela-3d-models (physics kits for schools), and #28, hibeex-v2 (AI for small businesses). Most of those repos are public. They know me better than I do.",
  },
  { type: 'figure', id: 'repos' },
  {
    type: 'p',
    text: "My grandfather left school at 8, never had the right tools, and built a 29.52m² garage anyway – he remains the best engineer I've ever met. Fixing things in that garage is not the same as fixing them across an 8,515,767km² country or a 510,072,000km² world. But what I want is what he had: a place where people bring the thing that stopped working, and someone inside who will not leave it alone until they find the fuse.",
  },
  { type: 'figure', id: 'scale' },
  {
    type: 'p',
    text: "I've been narrating 2013 through 2026 the way I fix things (Adalberto would agree I don't know when to quit), because after all I'm still the same kid, opening things that won't start.",
  },
  { type: 'figure', id: 'end' },
];
