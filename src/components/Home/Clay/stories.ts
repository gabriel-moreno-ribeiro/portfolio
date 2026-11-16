// The words of each 3D story. They stand on their own: the scene only illustrates them.
// Facts come from src/content/projects.ts and public/llms.txt, nothing else.
export interface ClayStep {
  title: string;
  text: string;
}

export const CLAY_STORIES: Record<string, ClayStep[]> = {
  hibeex: [
    {
      title: 'Raw data',
      text: 'It plugs into the systems accounting firms already use: Domínio, Conta Azul, Nibo and Omie.',
    },
    { title: 'Clean', text: 'The data is cleaned and put in order before anything acts on it.' },
    { title: 'Agents at work', text: 'Agents take over reconciliation, collections and contracts.' },
    {
      title: 'Back to the people',
      text: 'The work comes back through the people who already look after the business: the accountant, the finance BPO and the lawyer. Raw data in, decisions out.',
    },
    {
      title: 'Result',
      text: 'At one client, an accounting service went from 8h to 2h and days to get paid from 63.9 to 9. Automatic reconciliation is 94% accurate.',
    },
  ],
  candela: [
    { title: 'The kit', text: 'A wooden box built to be carried between classrooms and stored in a cupboard.' },
    {
      title: "What's inside",
      text: 'A caliper, a spring scale, a stopwatch, a measuring tape, weights and a graduated cylinder.',
    },
    {
      title: 'Five experiments',
      text: 'The parts turn into five experiments. Three of them: the car timed around the track, the inclined plane with the mass hanging and the spring scale over the graduated cylinder.',
    },
    { title: '28 public schools', text: 'The kits went to 28 public schools in Bahia and Ceará.' },
    {
      title: '3,392 students',
      text: 'In the classrooms that used them, physics failure rates went from 30% to 10%.',
    },
  ],
};
