// The one-pager at /one-pager: Gabriel first, Hibeex second. For the Behring
// Founders phase 3 (3 to 6 December, São Paulo) and any intro. Facts come from
// Gabriel's brief, his phase-1 application and the team's LinkedIn profiles.
// Written in his voice: short sentences, "a gente", "pra", no em dashes.

export const head = {
  name: 'Gabriel Moreno Ribeiro',
  facts: ['18 anos', 'Founder da Hibeex', 'De Salvador'],
  city: 'São Paulo',
  intro:
    'Comecei consertando carro com meu avô no interior do Ceará. Depois vieram os notebooks, em Salvador, e o back office do consultório do meu pai, quando ele quase fechou. Hoje eu conserto o back office de pequenas e médias empresas, com a Hibeex.',
  contact: [
    { label: 'me@gabrielmr.com', href: 'mailto:me@gabrielmr.com' },
    { label: 'gabrielmr.com', href: 'https://gabrielmr.com' },
    { label: 'linkedin.com/in/gabriel-moreno-ribeiro', href: 'https://linkedin.com/in/gabriel-moreno-ribeiro' },
  ],
  program: ['Behring Founders, fase 3', 'Arenas: enterprise AI, fintech, services'],
};

export const origin = [
  'A garagem do meu avô fica em Missão Velha, no interior do Ceará. O último carro que a gente consertou junto ficou três tardes parado. Trocamos bateria, alternador e filtro, e o defeito era um fusível, a peça mais barata da caminhonete.',
  'Em Salvador eu consertava notebook pra pagar os estudos: foram 121, mandados pra 21 estados, só por indicação. Alguns passavam em todos os testes de hardware e travavam na BIOS mesmo assim. Era software, e os únicos tutoriais que me destravaram eram em hindi. Aos 11 eu já tinha Python suficiente pra escrever um script que traduz e dubla esses vídeos pro português.',
  'Em 2020, com 12 anos, vi o consultório do meu pai quase fechar. Minha mãe virou a secretária e eu fiz o que dava: um chatbot com a voz dela pra atender o telefone, uma automação pra cobrar dos planos de saúde o que eles deviam e um painel com os dados e os contratos num lugar só. Foi a primeira empresa pequena que eu vi por dentro.',
  'Aos 14 fundei o Projeto Candela. Começou com uma vaquinha e 60 escolas visitadas antes de ter orçamento, e virou kits de física impressos em 3D, de graça, em 28 escolas públicas e 3.392 alunos, com a UFBA. No mesmo período vieram 39 medalhas em olimpíadas científicas.',
  'Aos 18 me mudei pra São Paulo pra morar com o Teodoro, meu cofundador, e construir a Hibeex.',
];

export const now = [
  'A Hibeex faz o back office da pequena e média empresa por meio de quem já cuida dela: o contador, o BPO financeiro e o jurídico. O dono de PME gasta mais de 1.300 horas por ano nisso (uns 54 dias, se ele não dormir). A gente conecta nos sistemas que o escritório já usa (Domínio, Conta Azul, Nibo, Omie), arruma o dado e coloca agentes pra fazer o serviço: conciliação, cobrança, contratos.',
  'Antes do primeiro commit, eu e o Teodoro conversamos com 96 pessoas, de dono de PME a COO de big tech. Nas primeiras vendas ficou claro que o ciclo é top-down, e isso segura o ritmo. Então hoje a gente trabalha de dentro da operação de empresas em Porto Alegre e em São Paulo, fazendo o back office como serviço, pra aprender o processo por dentro antes de voltar pro produto.',
];

// Traction, split by what it measures.
export const base = [
  { figure: '3', label: 'escritórios contábeis como design partners' },
  { figure: '40+', label: 'bases de PME rodando os agentes' },
];

// MRR today and with the contract already signed. Values in R$ mil.
export const mrr = {
  today: { value: 3, label: 'hoje', note: 'cobre os custos' },
  signed: { value: 40, label: 'jan/27', note: 'contrato assinado com a RP Métodos, 35% das bases endereçáveis da carteira dele' },
};

// Measured in a single client. Bars are drawn to scale against `before`.
export const results = [
  { label: 'Serviço contábil', before: 8, after: 2, unit: 'h', format: (n: number) => `${n}h` },
  { label: 'Prazo de recebimento', before: 63.9, after: 9, unit: 'dias', format: (n: number) => `${n.toLocaleString('pt-BR')} dias`, note: '55 dias de caixa de volta' },
];
export const singles = [
  { figure: '94%', label: 'de acerto na conciliação automática' },
  { figure: 'R$ 12.480', label: 'recuperados pra um único cliente' },
];
export const pipeline = 'Uns 730 escritórios no pipeline. O alvo é 750 escritórios parceiros em 36 meses, umas 49 mil PMEs.';

export const team = [
  {
    name: 'Teodoro Trevisan',
    role: 'cofundador',
    href: 'https://www.linkedin.com/in/teodoro-trevisan',
    text: 'É de Porto Alegre e analisa dados desde os 14, quando entrou na Poatek. Foi admitido em engenharia na UT Austin e escolheu um ano construindo. Fundou o Voluntaria+, que levou mais de R$ 100 mil a ONGs. A gente se conheceu no Prep da Fundação Estudar.',
  },
  {
    name: 'Devansh Chopra',
    role: 'CTO, entrando pelo Entrepreneur First',
    href: 'https://www.linkedin.com/in/devansh-chopra0526',
    text: 'Mestre em Computer Science por St Andrews e vencedor do BlackRock Hackathon 2026. Na Vyntelligence, colocou fluxos com agentes em produção pra mais de 15 clientes enterprise. Vem direto de San Francisco.',
  },
];

export const validators = [
  { name: 'Rudimar Pascoal', role: 'RP Métodos', href: 'https://www.linkedin.com/in/rudimarpascoal/', text: 'Sexto maior usuário do Domínio no Brasil, mais de 800 bases. Contrato assinado.' },
  { name: 'Carla Koenig', role: 'BPO financeiro', href: 'https://www.linkedin.com/in/carla-koenig-de-azevedo-33a55255/', text: 'Pioneira do BPO financeiro no Brasil, exit na Ampulheta.' },
  { name: 'Luciano Oliveira', role: 'Grupo Voalle', href: 'https://www.linkedin.com/in/luciano-oliveira-11718749/', text: 'CTO do Grupo Voalle, advisor de produto.' },
];

export const year = [
  { name: 'Canastra AI Residency', text: '1 de 6 startups do Brasil. Eu e o Teodoro somos os founders mais novos da história do programa.' },
  { name: 'European Innovation Academy, Londres', text: '1 de 10 do mundo.' },
  { name: 'Latitud Fellowship', text: 'top 20%. Também LALA Start, Claude for Startups e AWS for Startups.' },
];

export const build = [
  'Primeiro a gente cobra por fluxo de trabalho entregue, depois por resultado. Em quatro anos, quero o back office inteiro da PME brasileira numa operação só, com crédito embarcado, vendido por quem a PME já confia.',
  'Na garagem do meu avô, a cidade trazia o que tinha parado de funcionar e ele não largava até achar o fusível. Eu quero construir esse lugar pra pequena empresa.',
];

export const ask = {
  intro: 'Em dezembro eu quero conversar com três tipos de gente.',
  people: [
    { who: 'Quem já faz financeiro, fiscal ou jurídico pra PME em escala,', examples: 'como Contabilizei, Conta Simples, Qive, Cora e a Enter no jurídico.' },
    { who: 'Quem tem o contador como canal,', examples: 'como Nibo, Omie e a Conta Azul, que acabou de comprar a Mister Contador. Quero entender como montaram esse relacionamento e o que o contador paga de verdade.' },
    { who: 'Quem investe em serviço com IA,', examples: 'como a Atlantico, a a16z e a Valor. Quero ouvir as perguntas mais duras sobre distribuição e dependência das APIs.' },
  ],
  close: 'Levo o produto rodando. Se for você, me escreve.',
};

export const footer = 'Hibeex: contabilidade, financeiro e jurídico da PME numa operação só. Outubro de 2026.';

// The build time busts the 30-day cache on /files when the PDF is regenerated.
export const PDF = `/files/gabriel-moreno-ribeiro-hibeex.pdf?v=${encodeURIComponent(__BUILD_TIME__)}`;
