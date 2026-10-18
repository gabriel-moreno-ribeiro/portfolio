// The one-pager at /one-pager: Gabriel and Hibeex, for the Behring Founders
// phase 3 (3 to 6 December, São Paulo) and any intro. Every number here comes
// from Gabriel's brief; external ones carry their source. No em dashes.

export const head = {
  name: 'Gabriel Moreno Ribeiro',
  line: '18 anos. Cofundador e CEO da Hibeex. De Salvador, morando em São Paulo.',
  oneLiner:
    'A Hibeex resolve o back office da pequena e média empresa através de quem já cuida dela: o contador, o BPO financeiro e o jurídico. Agentes de IA que executam o serviço, em vez de só analisar.',
  contact: [
    { label: 'me@gabrielmr.com', href: 'mailto:me@gabrielmr.com' },
    { label: 'gabrielmr.com', href: 'https://gabrielmr.com' },
    { label: 'linkedin.com/in/gabriel-moreno-ribeiro', href: 'https://linkedin.com/in/gabriel-moreno-ribeiro' },
  ],
  program: ['Behring Founders, fase 3', 'Arenas: enterprise AI, fintech, services'],
};

export const origin = [
  'Aprendi a consertar na garagem do meu avô, no interior do Ceará. O último carro que a gente consertou junto ficou três tardes parado: trocamos bateria, alternador e filtro, e o defeito era um fusível, a peça mais barata da caminhonete. A parede entre quebrado e funcionando é mais fina do que parece, e quase ninguém olha.',
  'Em Salvador, consertei 121 notebooks e mandei pra 21 estados, só por indicação. Em 2020 o consultório do meu pai quase fechou, minha mãe virou a secretária, e eu construí pra ela um chatbot com a voz dela. Foi onde eu vi uma empresa pequena por dentro: uma pessoa fazendo o trabalho de cinco e nenhum sistema conversando com o outro.',
  'Aos 14 fundei o Projeto Candela: kits de física impressos em 3D, de graça, em 28 escolas públicas e 3.392 alunos. Passei em Computer Science em St Andrews, sem bolsa, e escolhi construir.',
];

export const problem =
  'O dono de PME no Brasil gasta mais de 1.300 horas por ano em back office. Contador, BPO e advogado cuidam dele, e cada um vê só a sua parte: o dado do ERP e o do Domínio deveriam ser iguais e nunca são, a conciliação quebra, e o escritório não cresce sem contratar gente.';

export const product =
  'Conecta nos sistemas que o escritório já usa (Domínio, Conta Azul, Nibo, Omie), limpa o dado e põe agentes pra executar o serviço: conciliação, cobrança, contratos. Vende pelo escritório, que já cuida de umas 65 PMEs, e cobra por serviço entregue e por resultado, não por licença.';

export const SOURCES = {
  gc: {
    label: 'General Catalyst, The Future of Services, ago/2025',
    href: 'https://www.generalcatalyst.com/stories/the-future-of-services',
  },
  census: {
    label: 'General Catalyst, com dados do US Census',
    href: 'https://www.generalcatalyst.com/stories/the-future-of-services',
  },
  forbes: {
    label: 'Forbes, jun/2026',
    href: 'https://www.forbes.com/sites/annatong/2026/06/02/thrive-holdings-to-bet-1-billion-on-ai-powered-accounting-roll-up/',
  },
  contrary: {
    label: 'Contrary Research, The Vertical AI Playbook, set/2025',
    href: 'https://research.contrary.com/report/the-vertical-ai-playbook',
  },
  contaAzul: {
    label: 'Conta Azul, jul/2026',
    href: 'https://contaazul.com/blog/conta-azul-adquire-mister-contador-automacao-contabil/',
  },
};

export const now = {
  validated:
    'A dor está validada: 96 conversas com donos de PME, contadores e BPOs antes do primeiro commit, três escritórios contábeis como design partners e mais de 40 bases de PME rodando os agentes.',
  learned:
    'O que a gente aprendeu nesse caminho é que a venda do produto, do jeito que está, é top-down: só fecha com o dono ou o CEO do escritório, e isso limita em quantas empresas a gente consegue entrar. Então agora eu estou trabalhando de dentro de escritórios e empresas, como serviço, pra ver a operação pelos dois lados e desenhar a solução que bate com o product-market fit antes de escalar o software.',
  contrary: 'Operar o serviço por dentro dispensa ciclo de venda, gestão de mudança e educação do cliente.',
  outside: 'É a mesma lógica que está puxando serviços com IA lá fora.',
  quote: '"Customers care about outcomes, not products."',
  market:
    'Só nos EUA, serviços movimentam mais de US$ 6 trilhões por ano, contra US$ 370 bilhões do mercado de software inteiro.',
  thrive: 'E a Thrive Holdings separou US$ 1 bilhão pra comprar escritórios de contabilidade e operar com IA.',
};

// Traction. prefix + count (formatted pt-BR) + suffix, printed as is.
export interface Metric {
  before?: string;
  prefix?: string;
  count?: number;
  suffix?: string;
  label: string;
}
export const traction: Metric[] = [
  { count: 3, label: 'escritórios contábeis como design partners' },
  { count: 40, suffix: '+', label: 'bases de PME rodando os agentes' },
  { prefix: 'R$ ', count: 3, suffix: ' mil', label: 'de MRR hoje, cobrindo os custos' },
  { prefix: 'R$ ', count: 40, suffix: ' mil', label: 'de MRR em jan/27 com o contrato assinado da RP Métodos (35% das bases endereçáveis da carteira dele)' },
  { count: 94, suffix: '%', label: 'de acerto na conciliação automática' },
  { before: '8h', count: 2, suffix: 'h', label: 'por serviço contábil' },
  { before: '63,9', count: 9, suffix: ' dias', label: 'de prazo de recebimento num cliente (55 dias de caixa de volta)' },
  { prefix: 'R$ ', count: 12480, label: 'recuperados pra um único cliente' },
];
export const pipeline = 'Uns 730 escritórios no pipeline. Alvo: 750 escritórios parceiros em 36 meses, umas 49 mil PMEs.';

export const whyNow = [
  { lead: 'Split payment em 2027.', text: 'Até 28% da venda retido na origem. A PME perde capital de giro, e quem explica isso pra ela é o contador.' },
  { lead: 'A conta fechou.', text: 'Inferência 80% mais barata desde 2023 e APIs dos ERPs estáveis. Servir PME passou a dar margem.' },
  { lead: 'Janela de 12 a 18 meses.', text: 'Os incumbentes são monolitos, e mudar a arquitetura pra agentes leva mais de um ano.' },
];

export const market = {
  consolidation: 'A consolidação já começou: a BHub compra escritórios de contabilidade e a Conta Azul comprou a Mister Contador em julho de 2026.',
  thesis:
    'É o mercado dizendo que a tese é certa. A nossa aposta é armar o escritório em vez de comprar ou substituir: o dono continua dono e ganha com a nossa operação. Ninguém junta as três coisas: serviço de IA, distribuição pelo escritório e um dado que melhora o agente a cada base conectada.',
};

export const team = [
  { name: 'Teodoro Trevisan', role: 'cofundador', text: 'Porto Alegre, engenharia na UT Austin, analista de dados desde os 14 na Poatek. Nos conhecemos no Prep da Fundação Behring.' },
  { name: 'Devansh Chopra', role: 'entrando pelo Entrepreneur First', text: 'Computer Science em St Andrews, vencedor do BlackRock Hackathon 2026.' },
];

export const validators = [
  { name: 'Rudimar Pascoal', role: 'RP Métodos', text: 'Sexto maior usuário do Domínio no Brasil, mais de 800 bases. Contrato assinado.' },
  { name: 'Carla Koenig', role: 'BPO financeiro', text: 'Pioneira do BPO financeiro no Brasil, exit na Ampulheta.' },
  { name: 'Luciano Oliveira', role: 'Grupo Voalle', text: 'CTO do Grupo Voalle, advisor de produto.' },
];

export const year = [
  { name: 'Canastra AI Residency', text: '1 de 6 startups do Brasil, os founders mais novos da história do programa.' },
  { name: 'European Innovation Academy, Londres', text: '1 de 10 do mundo.' },
  { name: 'Latitud Fellowship (top 20%)', text: 'LALA Start, Claude for Startups, AWS for Startups.' },
];

export const build = {
  phases: [
    { n: 'Fase 1', text: 'cobra por workflow.' },
    { n: 'Fase 2', text: 'cobra por resultado.' },
    { n: 'Fase 3', text: 'em quatro anos: o back office da PME brasileira numa operação só, com crédito embarcado.' },
  ],
  text:
    'Serviço operado com IA, vendido por quem a PME já confia. O que eu quero é o que meu avô tinha na garagem, com alcance maior: um lugar onde a pequena empresa traz o que parou de funcionar e alguém lá dentro não larga até achar o fusível.',
};

export const ask = [
  { lead: 'Quem construiu canal com contador.', text: 'Nibo e Omie fizeram do escritório a rede de distribuição; a Conta Azul está comprando automação contábil. Quero entender como montaram o relacionamento e o que o contador paga de verdade.' },
  { lead: 'Quem opera escritório ou BPO em escala.', text: 'Pra testar a precificação por resultado e o motor multi-ERP com quem sente a dor todo dia.' },
  { lead: 'Quem investe em serviços com IA e fintech pra PME.', text: 'Pra ouvir as perguntas mais duras sobre distribuição e dependência das APIs.' },
];
export const askClose = 'Em dezembro eu levo o produto rodando, não slide.';

export const footer = 'Hibeex: contabilidade, financeiro e jurídico da PME numa operação só. Outubro de 2026.';

// The build time busts the 30-day cache on /files when the PDF is regenerated.
export const PDF = `/files/gabriel-moreno-ribeiro-hibeex.pdf?v=${encodeURIComponent(__BUILD_TIME__)}`;
