/**
 * Geometria da estrada.
 *
 * O path é gerado em PIXELS da caixa medida da seção (ResizeObserver), não num viewBox fixo:
 * assim a estrada nunca distorce e as paradas caem exatamente no centro de cada `<li>`, que é
 * quem manda na altura (o conteúdo é HTML normal, não posicionado por JS).
 *
 * A estrada volta sobre si mesma (zigue-zague, rotatória, trevo), então não dá para
 * procurá-la por altura: a amostragem é por COMPRIMENTO DE ARCO. Como somos nós que geramos
 * retas e cúbicas, avaliamos o polinômio direto em JS, uma vez por layout, numa tabela de
 * passo fixo; por quadro é um índice e uma interpolação. (`getPointAtLength` a cada 2 px
 * custava 2 553 ms sob CPU 4× numa estrada de 4 177 px — inviável.)
 */

export const CAR_SCREEN = 0.5;

/** Largura do asfalto, em px. */
export const ROAD_W = { wide: 46, narrow: 18 } as const;
/** Vão fixo entre a borda do card e a borda da estrada, em px. */
export const CARD_GAP = { wide: 32, narrow: 20 } as const;

/** Do eixo até a borda de fora do acostamento (`.exp__road-edge` = asfalto + 2 px). */
export function roadHalf(narrow: boolean): number {
  return (narrow ? ROAD_W.narrow : ROAD_W.wide) / 2 + 1;
}

/** No mobile todos os cards ficam à direita: entre duas paradas a estrada recua isto. */
const NARROW_SWING = [22, 30, 14, 28, 16, 30] as const;

// ── Medidas das manobras (px, graus). O carro tem ~100 px: abaixo de ~55 de raio ele gira no lugar.
/** Reta depois de sair de uma parada e antes de chegar à seguinte (o marco de km fica livre). */
const LEAD = 44;
/** Folga entre a borda da estrada e a borda da coluna. */
const EDGE = 12;
/** Chicane: duas pernas inclinadas ligadas por um "S" apertado. */
const ESS = { r: 62, turn: 66 } as const;
/** Serra: três cotovelos empilhados, pistas inclinadas `slope` graus. */
const SWB = { r: 58, rIn: 60, slope: 10, width: 400 } as const;
/** Ponte: reta inclinada `turn` graus da vertical, sobre um rio de `width` px que serpenteia `sway` px. */
const RIV = { r: 120, turn: 42, width: 62, sway: 15, wave: 300 } as const;
/**
 * Rotatória: anel de raio `r`, alças de entrada e saída de raio `rin` (`tight`: coluna estreita),
 * `lift` px acima do vão do card seguinte.
 */
const RND = { r: 84, rin: 52, tight: { r: 70, rin: 40 }, lift: 15 } as const;
/** Túnel e curvão: morro de até `hill` px de largura numa reta, depois 180° de raio `r` (`tight`: coluna estreita). */
const TUN = { r: 105, rin: 70, tight: { r: 85, rin: 60 }, hill: 230, peak: 104 } as const;
/** Trevo: laço de 270° de raio `r` que passa por baixo do próprio viaduto, `drop` px abaixo do card de cima. */
const CLV = { r: 76, rOut: 70, drop: 70 } as const;

export interface StopAnchor {
  /** x do eixo da estrada na parada (rente ao card), px da seção. */
  x: number;
  /** Centro vertical da parada, px da seção. */
  y: number;
}

/** Caixa do card de uma parada, px da seção. */
export interface CardBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export type RoadSegment =
  | { kind: 'L'; x0: number; y0: number; x1: number; y1: number }
  | { kind: 'C'; x0: number; y0: number; x1: number; y1: number; x2: number; y2: number; x3: number; y3: number };

/** Cenário: traços prontos (a classe diz o que é), ícones e o tabuleiro do viaduto. */
export type Scenery =
  | { kind: 'path'; cls: 'rail' | 'kerb' | 'wash' | 'water' | 'pier' | 'island' | 'hill' | 'portal' | 'flag'; d: string }
  | { kind: 'icon'; icon: 'tree' | 'pine' | 'cactus' | 'rock' | 'lamp'; x: number; y: number; flip?: boolean }
  /** `s` = px de estrada até o meio do tabuleiro (alinha o tracejado dele ao da estrada). */
  | { kind: 'deck'; x: number; y: number; angle: number; s: number };

/** Cenário redesenhado POR CIMA do carro enquanto ele está entre `from` e `to` (px de estrada). */
export interface Cover {
  art: Scenery[];
  from: number;
  to: number;
  /** Caixa do desenho, px da seção. */
  box: { x: number; y: number; w: number; h: number };
}

export interface RoadPlan {
  d: string;
  segments: RoadSegment[];
  /** Índice do segmento que começa em cada parada. */
  stopSeg: number[];
  /** Desenhado junto com a estrada (e apagado com ela, à frente do carro). */
  scenery: Scenery[];
  covers: Cover[];
}

export type Feature = 'esses' | 'switchback' | 'river' | 'roundabout' | 'tunnel' | 'clover';
const ROUTE: Feature[] = ['esses', 'switchback', 'river', 'roundabout', 'tunnel'];

/**
 * Manobra do trecho que sai da parada `i` (de `n`), no desktop. A rota é um passeio, cada
 * trecho com a sua cara: chicane, serra, ponte sobre o rio, rotatória, túnel com curvão e, na
 * chegada, o trevo e a avenida. A parada seguinte ganha um respiro acima (SCSS,
 * `.exp__stop--after-*`): é o espaço em que a manobra acontece, e a rolagem a mais para o carro
 * percorrê-la sem correr.
 */
export function featureAt(i: number, n: number): Feature | null {
  if (i < 0 || i > n - 2) return null;
  return i === n - 2 ? 'clover' : ROUTE[i % ROUTE.length];
}

const EMPTY: RoadPlan = { d: '', segments: [], stopSeg: [], scenery: [], covers: [] };
const RAD = Math.PI / 180;
const f = (v: number) => +v.toFixed(2);

interface Pt {
  x: number;
  y: number;
}

/** Caneta: reta, arco de círculo (em cúbicas de até 90°) e "S" de tangentes verticais. */
function pen(x: number, y: number) {
  const segments: RoadSegment[] = [];
  let d = `M ${f(x)} ${f(y)}`;
  let heading = 90; // graus, 0 = +x, horário na tela
  const cubic = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
    segments.push({ kind: 'C', x0: x, y0: y, x1, y1, x2, y2, x3, y3 });
    d += ` C ${f(x1)} ${f(y1)} ${f(x2)} ${f(y2)} ${f(x3)} ${f(y3)}`;
    x = x3;
    y = y3;
  };
  const api = {
    segments,
    path: () => d,
    pos: (): Pt => ({ x, y }),
    lineTo(nx: number, ny: number) {
      if (Math.hypot(nx - x, ny - y) < 0.5) return;
      segments.push({ kind: 'L', x0: x, y0: y, x1: nx, y1: ny });
      d += ` L ${f(nx)} ${f(ny)}`;
      x = nx;
      y = ny;
    },
    /** Reta de `len` px na direção em que a caneta aponta. */
    forward(len: number) {
      api.lineTo(x + len * Math.cos(heading * RAD), y + len * Math.sin(heading * RAD));
    },
    /** `turn` em graus: positivo = horário na tela (vira para a direita de quem dirige). Devolve o centro. */
    arc(r: number, turn: number): Pt {
      const n = Math.ceil(Math.abs(turn) / 90);
      const step = turn / n;
      const k = (4 / 3) * Math.tan((Math.abs(step) * RAD) / 4) * r;
      const side = Math.sign(turn);
      const centre = { x: x - side * r * Math.sin(heading * RAD), y: y + side * r * Math.cos(heading * RAD) };
      for (let i = 0; i < n; i++) {
        const h0 = heading * RAD;
        const h1 = (heading + step) * RAD;
        const ex = centre.x + side * r * Math.sin(h1);
        const ey = centre.y - side * r * Math.cos(h1);
        cubic(x + k * Math.cos(h0), y + k * Math.sin(h0), ex - k * Math.cos(h1), ey - k * Math.sin(h1), ex, ey);
        heading += step;
      }
      return centre;
    },
    /** "S" descendo de uma tangente vertical a outra. */
    sTo(nx: number, ny: number) {
      const dy = (ny - y) / 2;
      cubic(x, y + dy, nx, ny - dy, nx, ny);
    },
  };
  return api;
}

/** Arco de raio `r` em volta de `c`, do ângulo `a0` ao `a1` (graus de tela, horário positivo). */
function ring(c: Pt, r: number, a0: number, a1: number): string {
  const at = (deg: number) => `${f(c.x + r * Math.cos(deg * RAD))} ${f(c.y + r * Math.sin(deg * RAD))}`;
  return `M ${at(a0)} A ${f(r)} ${f(r)} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${at(a1)}`;
}

/**
 * Monta a estrada: entra na seção logo acima da 1ª parada (para não cruzar o cabeçalho),
 * passa rente a cada card na altura do centro dele, com tangente vertical, e termina em
 * `endY` (o pé do último card): nada de ponta solta sobre a seção seguinte.
 *
 * Desktop — os cards alternam de lado, e a parada depois de cada manobra tem um respiro
 * acima: entre o pé de um card e o topo do seguinte a coluna inteira fica livre, e ao lado de
 * cada card sobra meia coluna. É aí que a estrada faz as manobras (ver `featureAt`), sempre a
 * partir das caixas medidas: nada passa por baixo de um card, e o que não couber naquela
 * largura vira o "S" simples.
 * Mobile — cards sempre à direita, faixa estreita: só um recuo (que varia) entre duas paradas.
 */
export function buildRoad(
  width: number,
  height: number,
  stops: StopAnchor[],
  cards: CardBox[],
  narrow: boolean,
  endY: number,
): RoadPlan {
  if (width <= 0 || height <= 0 || stops.length === 0) return EMPTY;
  // Uma caixa medida no meio de um resize pode vir sem número: nunca vira `d` com NaN.
  const nums = [endY, ...stops.flatMap((s) => [s.x, s.y]), ...cards.flatMap((c) => [c.left, c.right, c.top, c.bottom])];
  if (!nums.every(Number.isFinite)) return EMPTY;

  const n = stops.length;
  const gap = n > 1 ? stops[1].y - stops[0].y : height * 0.2;
  const p = pen(stops[0].x, Math.max(0, stops[0].y - Math.min(200, gap * 0.55)));
  p.lineTo(stops[0].x, stops[0].y);
  const stopSeg = [p.segments.length];
  const scenery: Scenery[] = [];
  // Estrada que o carro não percorre: vai no mesmo `d` (mesmo traço, sem emenda), fora de `segments`.
  let extra = '';
  // Por cima do carro entre dois segmentos; `deck` = [segmento, px antes do fim dele].
  const covers: { art: Scenery[]; fromSeg: number; toSeg: number; box: Cover['box'] }[] = [];
  const decks: { item: Extract<Scenery, { kind: 'deck' }>; seg: number; back: number }[] = [];
  const half = roadHalf(false);
  const reach = CARD_GAP.wide + half;
  const xmin = EDGE + half;
  const xmax = width - EDGE - half;
  const path = (cls: Extract<Scenery, { kind: 'path' }>['cls'], d: string) => scenery.push({ kind: 'path', cls, d });
  const icon = (name: Extract<Scenery, { kind: 'icon' }>['icon'], x: number, y: number, flip?: boolean) =>
    scenery.push({ kind: 'icon', icon: name, x, y, flip });

  for (let i = 0; i < n - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (narrow) {
      const mid = i % 2 ? 0.42 : 0.58;
      p.sTo(Math.min(a.x, b.x) - NARROW_SWING[i % NARROW_SWING.length], a.y + (b.y - a.y) * mid);
      p.sTo(b.x, b.y);
      stopSeg.push(p.segments.length);
      continue;
    }
    // Para que lado fica a parada seguinte: +1 direita, −1 esquerda. O card de `a` fica do
    // lado −dir da estrada; o de `b`, do lado +dir.
    const dir = b.x > a.x ? 1 : -1;
    const dx = Math.abs(b.x - a.x);
    const cardA = cards[i];
    const cardB = cards[i + 1];
    const top = a.y + LEAD;
    const end = b.y - LEAD;

    /** Chicane: perna inclinada, "S" apertado com zebras por dentro, outra perna. */
    const esses = (): boolean => {
      const hl = (90 - ESS.turn) * RAD;
      const leg = (dx - 2 * ESS.r * (1 - Math.sin(hl))) / (2 * Math.cos(hl));
      const drop = 6 * ESS.r * Math.cos(hl) + 2 * leg * Math.sin(hl);
      if (leg < 20 || top + drop > end) return false;
      const kerb = (c: Pt, side: number) => {
        const mid = 90 - 90 * side;
        path('kerb', ring(c, ESS.r - half - 3, mid - 44, mid + 44));
      };
      p.lineTo(a.x, top + (end - top - drop) / 2);
      p.arc(ESS.r, -dir * ESS.turn);
      p.forward(leg);
      kerb(p.arc(ESS.r, dir * 2 * ESS.turn), dir);
      kerb(p.arc(ESS.r, -dir * 2 * ESS.turn), -dir);
      p.forward(leg);
      p.arc(ESS.r, dir * ESS.turn);
      // Sertão: mandacarus nas duas meias colunas vazias (acima do card seguinte, abaixo do de cima).
      icon('cactus', b.x + dir * 118, cardB.top - 104);
      icon('cactus', b.x + dir * 150, cardB.top - 84);
      icon('rock', b.x + dir * 96, cardB.top - 80);
      icon('cactus', a.x - dir * 170, cardA.bottom + 118);
      return true;
    };

    /**
     * Serra: quatro pistas inclinadas ligadas por três cotovelos, defensa por fora de cada um,
     * pinheiros nas cunhas. Fica um pouco acima do meio do espaço livre: o carro desce uma reta
     * antes (adianta-se na tela), zigue-zagueia (atrasa-se) e desce outra reta até a parada.
     */
    const switchback = (): boolean => {
      const sg = SWB.slope * RAD;
      const cs = Math.cos(sg);
      const ex = 1 - Math.sin(sg);
      const far = dir < 0 ? Math.max(xmin, a.x - SWB.width) : Math.min(xmax, a.x + SWB.width);
      const w = Math.abs(a.x - far);
      const l1 = (w - ex * (SWB.rIn + SWB.r)) / cs;
      const l2 = (w - 2 * ex * SWB.r) / cs;
      const l4 = (Math.abs(b.x - far) - ex * (SWB.rIn + SWB.r)) / cs;
      const drop = (2 * SWB.rIn + 6 * SWB.r) * cs + (l1 + 2 * l2 + l4) * Math.sin(sg);
      // A última pista passa sobre a coluna do card seguinte: o fim da serra fica `reach` acima dele.
      const slack = cardB.top - reach - drop - top;
      if (l4 < 30 || l2 < 120 || slack < 0) return false;
      const y0 = top + slack * 0.68;
      const bend = (c: Pt, side: number) => {
        const mid = 90 - 90 * side;
        const inward = -Math.cos(mid * RAD);
        path('rail', ring(c, SWB.r + half + 6, mid - 62, mid + 62));
        icon('pine', c.x + inward * w * 0.6, c.y - 4);
        icon('pine', c.x + inward * w * 0.68, c.y + 14);
        icon('rock', c.x + inward * w * 0.44, c.y + 8);
      };
      const hairpin = 180 - 2 * SWB.slope;
      p.lineTo(a.x, y0);
      p.arc(SWB.rIn, -dir * (90 - SWB.slope));
      p.forward(l1);
      bend(p.arc(SWB.r, dir * hairpin), dir);
      p.forward(l2);
      bend(p.arc(SWB.r, -dir * hairpin), -dir);
      p.forward(l2);
      bend(p.arc(SWB.r, dir * hairpin), dir);
      p.forward(l4);
      p.arc(SWB.rIn, -dir * (90 - SWB.slope));
      return true;
    };

    /**
     * Ponte: a estrada cruza a coluna numa reta inclinada, e um rio a corta em ângulo reto,
     * de uma borda da coluna à outra (até onde os cards deixam). O rio para nas muretas: não
     * há nada por baixo do asfalto translúcido.
     */
    const river = (): boolean => {
      const t = RIV.turn * RAD;
      const leg = (dx - 2 * RIV.r * (1 - Math.cos(t))) / Math.sin(t);
      const drop = 2 * RIV.r * Math.sin(t) + leg * Math.cos(t);
      if (leg < RIV.width + 70 || top + drop > end) return false;
      p.lineTo(a.x, top + (end - top - drop) / 2);
      p.arc(RIV.r, -dir * RIV.turn);
      const m0 = p.pos();
      p.forward(leg);
      const m1 = p.pos();
      p.arc(RIV.r, dir * RIV.turn);

      // Referencial da ponte: `al` ao longo dela, `ac` ao longo do rio. O rio cruza a ponte em
      // ângulo reto e serpenteia para um lado só (`sway`), afinando até sumir na ponta.
      const ux = (m1.x - m0.x) / leg;
      const uy = (m1.y - m0.y) / leg;
      const mx = (m0.x + m1.x) / 2;
      const my = (m0.y + m1.y) / 2;
      const sway = (ac: number) => RIV.sway * (Math.cos((2 * Math.PI * ac) / RIV.wave) - 1);
      const xy = (al: number, ac: number): Pt => ({ x: mx + ux * (al + sway(ac)) - uy * ac, y: my + uy * (al + sway(ac)) + ux * ac });
      const at = (al: number, ac: number) => {
        const q = xy(al, ac);
        return `${f(q.x)} ${f(q.y)}`;
      };
      const h = half + 4;
      const span = RIV.width / 2 + 22;
      const clear = RIV.width / 2 + CARD_GAP.wide;
      for (const s of [-1, 1]) {
        path('rail', `M ${at(-span - 7, s * (h + 6))} L ${at(-span, s * h)} L ${at(span, s * h)} L ${at(span + 7, s * (h + 6))}`);
        path('pier', [-0.3, 0.3].map((k) => `M ${at(k * RIV.width, s * (h + 3))} L ${at(k * RIV.width, s * (h + 9))}`).join(' '));
        // Até onde o rio vai para este lado: borda da coluna, ou o primeiro card no caminho.
        let far = h + 4;
        for (; far < 1400; far += 6) {
          const q = xy(0, s * far);
          if (q.x < 10 || q.x > width - 10 || q.y > b.y + 110 || q.y < a.y - 320) break;
          if (cards.some((c) => q.x > c.left - clear && q.x < c.right + clear && q.y > c.top - clear && q.y < c.bottom + clear)) break;
        }
        if (far < h + 90) continue;
        // Meia largura do leito: cheia até 110 px da ponta, depois afina.
        const wide = (ac: number) => (RIV.width / 2) * Math.min(1, (far - ac) / 110) ** 0.6;
        const bank = (side: number) => {
          const pts: string[] = [];
          for (let ac = h + 2; ac < far; ac += 10) pts.push(at(side * wide(ac), s * ac));
          return pts;
        };
        path('wash', `M ${[...bank(-1), at(0, s * far), ...bank(1).reverse()].join(' L ')} Z`);
        [-0.62, -0.14, 0.34, 0.7].forEach((o, k) => {
          const stop = far - 60 - ((k * 37) % 70);
          let d = `M ${at(o * wide(h + 8), s * (h + 8))}`;
          for (let ac = h + 22, wig = 1; ac < stop; ac += 14, wig = -wig) {
            d += ` Q ${at(o * wide(ac) + wig * 2.5, s * ac)} ${at(o * wide(ac + 7), s * (ac + 7))}`;
          }
          path('water', d);
        });
      }
      return true;
    };

    /**
     * Rotatória: a estrada chega de lado, entra por uma alça à direita, contorna a ilha no
     * sentido da mão brasileira (anti-horário) e sai para baixo, na faixa da parada seguinte.
     * O resto do anel, que o carro não percorre, fecha o desenho (`extra`). Fica logo acima do
     * card seguinte.
     */
    const roundabout = (): boolean => {
      const { r, rin } = dx < 200 ? RND.tight : RND;
      const reachX = Math.sqrt((r + rin) ** 2 - rin ** 2);
      const turnIn = Math.acos(rin / (r + rin)) / RAD;
      const r1 = Math.min(60, dx - reachX - 6);
      const c = { x: b.x, y: cardB.top - CARD_GAP.wide - RND.lift - (r + half) };
      if (r1 < 44 || c.y - r1 < top || c.x - r - half < 8 || c.x + r + half > width - 8) return false;
      const phiIn = Math.atan2(dir * rin, -dir * reachX) / RAD;
      const phiOut = 180 - turnIn;
      p.lineTo(a.x, c.y - r1);
      p.arc(r1, -dir * 90);
      p.lineTo(c.x - dir * reachX, c.y);
      p.arc(rin, turnIn);
      p.arc(r, -((((phiIn - phiOut) % 360) + 360) % 360));
      p.arc(rin, turnIn);
      // Da saída para a entrada: o tracejado começa na bifurcação da saída, não em cima do da entrada.
      extra += ` ${ring(c, r, phiIn + ((((phiOut - phiIn) % 360) + 360) % 360), phiIn)}`;
      path('island', ring(c, r - half - 7, 0, 359.9) + ' Z');
      icon('tree', c.x - 9, c.y + 10);
      icon('tree', c.x + 10, c.y + 16);
      icon('rock', c.x + 2, c.y - 12);
      return true;
    };

    /**
     * Túnel e curvão: a estrada cruza a meia coluna vazia por dentro de um morro (o carro some
     * e sai do outro lado), dá 180° largos rente à borda e volta por baixo, logo acima do
     * card seguinte.
     */
    const tunnel = (): boolean => {
      const far = dir > 0 ? xmax : xmin;
      const { r, rin } = Math.abs(far - a.x) < 480 ? TUN.tight : TUN;
      const cx = far - dir * r;
      const yt = cardB.top - reach - 2 * r;
      const run = Math.abs(cx - a.x) - rin;
      const hill = Math.min(TUN.hill, run - 110);
      if (yt - rin < top || hill < 150 || Math.abs(cx - b.x) < reach + 20) return false;
      p.lineTo(a.x, yt - rin);
      // O morro passa a cobrir o carro do meio da curva de entrada (ele já está na altura do
      // túnel, com a estrada toda à vista) até o começo do curvão, já fora do morro.
      p.arc(rin, -dir * 50);
      const fromSeg = p.segments.length;
      p.arc(rin, -dir * 40);
      p.lineTo(cx, yt);
      p.arc(r, dir * 30);
      const toSeg = p.segments.length;
      p.arc(r, dir * 150);
      // Quarto de volta de raio `reach` em torno do canto do card seguinte: vão constante.
      p.lineTo(b.x + dir * reach, yt + 2 * r);
      p.arc(reach, -dir * 90);

      const base = yt + half + 6;
      const hx = a.x + dir * (rin + run / 2);
      const peak = (TUN.peak * hill) / TUN.hill;
      const mound = (x0: number, x1: number, up: number) =>
        `M ${f(x0)} ${f(base)} C ${f(x0 + (x1 - x0) * 0.16)} ${f(base - up * 1.35)} ${f(x1 - (x1 - x0) * 0.16)} ${f(base - up * 1.35)} ${f(x1)} ${f(base)} Z`;
      const mouth = (x: number) => `M ${f(x)} ${f(yt - half - 3)} a 9 ${half + 3} 0 0 0 0 ${2 * (half + 3)} a 9 ${half + 3} 0 0 0 0 ${-2 * (half + 3)} Z`;
      const art: Scenery[] = [
        { kind: 'path', cls: 'hill', d: mound(hx - hill * 0.12, hx + hill * 0.5, peak * 1.16) },
        { kind: 'icon', icon: 'pine', x: hx + hill * 0.3, y: base - peak * 1.06 },
        { kind: 'path', cls: 'hill', d: mound(hx - hill / 2, hx + hill * 0.36, peak) },
        { kind: 'path', cls: 'portal', d: `${mouth(hx - hill / 2 + 15)} ${mouth(hx + hill / 2 - 15)}` },
        { kind: 'icon', icon: 'pine', x: hx - hill * 0.26, y: base - peak * 0.86 },
        { kind: 'icon', icon: 'pine', x: hx - hill * 0.08, y: base - peak * 0.97 },
        { kind: 'icon', icon: 'rock', x: hx + hill * 0.12, y: base - peak * 0.62 },
      ];
      scenery.push(...art);
      covers.push({ art, fromSeg, toSeg, box: { x: hx - hill / 2 - 8, y: base - peak * 1.16 - 44, w: hill + 16, h: peak * 1.16 + 52 } });
      icon('tree', cx - dir * 4, yt + r + 2);
      icon('tree', cx + dir * 22, yt + r + 20);
      icon('rock', cx + dir * 12, yt + r - 16);
      return true;
    };

    /**
     * Trevo e avenida: a estrada passa por cima de um viaduto, dá um laço de 270° para o lado
     * de fora, volta por baixo dele e desce a avenida dos postes até a linha de chegada e a
     * última parada.
     */
    const clover = (): boolean => {
      const { r, rOut } = CLV;
      const yx = cardA.bottom + reach + 8 + CLV.drop;
      const edge = a.x - dir * (2 * r + half);
      // 150 = a legenda da D-20 mora acima-ao-lado da última parada sob reduced-motion.
      if (yx < top || edge < 8 || edge > width - 8 || dx + r < rOut + 20 || yx + 2 * r + half > b.y - 150) return false;
      p.lineTo(a.x, yx + r);
      const item: Extract<Scenery, { kind: 'deck' }> = { kind: 'deck', x: a.x, y: yx, angle: 90, s: 0 };
      decks.push({ item, seg: p.segments.length - 1, back: r });
      scenery.push(item);
      p.arc(r, dir * 180);
      covers.push({ art: [item], fromSeg: p.segments.length, toSeg: -1, box: { x: a.x - 60, y: yx - 60, w: 120, h: 120 } });
      p.arc(r, dir * 90);
      p.lineTo(b.x - dir * rOut, yx);
      p.arc(rOut, dir * 90);
      icon('tree', a.x - dir * r, yx + r + 8);
      for (let y = yx + rOut + 22; y < b.y - 150; y += 72) icon('lamp', b.x - dir * (half + 13), y, dir > 0);
      // Linha de chegada, quadriculada, um carro antes da última parada.
      const flag: string[] = [];
      for (let row = 0; row < 2; row++) {
        for (let col = row; col < 6; col += 2) flag.push(`M ${f(b.x - 24 + 8 * col)} ${f(b.y - 92 + 6 * row)} h 8 v 6 h -8 Z`);
      }
      path('flag', flag.join(' '));
      return true;
    };

    const feature = cardA && cardB ? featureAt(i, n) : null;
    const drawn =
      (feature === 'esses' && esses()) ||
      (feature === 'switchback' && switchback()) ||
      (feature === 'river' && river()) ||
      (feature === 'roundabout' && roundabout()) ||
      (feature === 'tunnel' && tunnel()) ||
      (feature === 'clover' && clover());
    // Sem manobra (ou sem espaço para ela): "S" de um lado ao outro; no último trecho ele
    // acaba antes, e a estrada chega reta à última parada.
    if (!drawn) p.sTo(b.x, i === n - 2 ? b.y - Math.min(110, (b.y - a.y) * 0.3) : b.y);
    p.lineTo(b.x, b.y);
    stopSeg.push(p.segments.length);
  }

  const last = stops[n - 1];
  p.lineTo(last.x, Math.max(last.y, Math.min(height, endY)));
  const plan: RoadPlan = { d: p.path() + extra, segments: p.segments, stopSeg, scenery, covers: [] };
  // As distâncias saem da mesma tabela que o carro usa (fica em cache, pelo `d`).
  const { segS } = roadLookup(plan);
  for (const dk of decks) dk.item.s = (segS[dk.seg + 1] ?? 0) - dk.back;
  plan.covers = covers.map((c) => ({ art: c.art, box: c.box, from: segS[c.fromSeg] ?? 0, to: c.toSeg < 0 ? Infinity : (segS[c.toSeg] ?? Infinity) }));
  return plan;
}

/** Lado da tela em que o card daquela parada fica: oposto à faixa da estrada. */
export function cardSide(index: number): 'left' | 'right' {
  return index % 2 === 0 ? 'left' : 'right';
}

export interface RoadSample {
  x: number;
  y: number;
  /** Graus, 0 = +x, horário (y cresce para baixo, como na tela). Contínuo: não dobra em ±180. */
  angle: number;
}

export interface RoadLookup {
  /** Comprimento total da estrada, px. */
  length: number;
  /** Distância ao longo da estrada (px) de cada parada. */
  stopS: number[];
  /** Distância (px) em que cada segmento do path começa; o último valor é o comprimento. */
  segS: number[];
  /**
   * Por trecho entre paradas: fração da rolagem do trecho → distância na estrada, em
   * `PROFILE_N` passos iguais (ver `carTargetS`).
   */
  profile: Float32Array[];
  /** Por trecho: px de rolagem que o perfil pede para andar nos limites nominais (só QA). */
  need: number[];
  /** Ponto e tangente a `s` px do início da estrada. */
  at(s: number): RoadSample;
  /** Ponto mais baixo (maior y) que a estrada já alcançou até `s`: é até onde ela "existe". */
  reachedY(s: number): number;
}

/** Passo da tabela, px de estrada. Bem abaixo do que se percebe; ~4 500 entradas no desktop. */
const STEP = 2;
/** Passos da tabela rolagem → estrada de cada trecho. */
const PROFILE_N = 512;
/**
 * Quem dirige: px de estrada por px de rolagem. Teto na reta, velocidade com que o carro sai
 * de uma parada e chega à seguinte, quanto a tangente pode girar por px de rolagem (é o que
 * freia o carro nas curvas: cotovelo devagar, reta depressa) e quanto ele acelera ou freia
 * (v² por px de estrada). São os valores nominais: o trecho inteiro é depois ajustado à
 * rolagem que existe entre as duas paradas.
 */
const DRIVE = { max: 2.8, stop: 0.5, turn: 1.25 * RAD, accel: 0.045 } as const;
const lookupCache = new Map<string, RoadLookup>();

export function roadLookup(road: RoadPlan): RoadLookup {
  const cached = lookupCache.get(road.d);
  if (cached) return cached;

  // 1) polilinha densa com comprimento acumulado; 2) reamostragem em passo fixo.
  const px: number[] = [];
  const py: number[] = [];
  const pa: number[] = [];
  const pl: number[] = [];
  const segS: number[] = [];
  let total = 0;
  const push = (x: number, y: number, tx: number, ty: number) => {
    const k = px.length;
    let a = Math.atan2(ty, tx) / RAD;
    if (k) {
      total += Math.hypot(x - px[k - 1], y - py[k - 1]);
      a = pa[k - 1] + ((((a - pa[k - 1]) % 360) + 540) % 360) - 180; // contínuo
    }
    px.push(x);
    py.push(y);
    pa.push(a);
    pl.push(total);
  };
  for (const seg of road.segments) {
    segS.push(total);
    if (seg.kind === 'L') {
      const tx = seg.x1 - seg.x0;
      const ty = seg.y1 - seg.y0;
      push(seg.x0, seg.y0, tx, ty);
      push(seg.x1, seg.y1, tx, ty);
      continue;
    }
    const poly =
      Math.hypot(seg.x1 - seg.x0, seg.y1 - seg.y0) +
      Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1) +
      Math.hypot(seg.x3 - seg.x2, seg.y3 - seg.y2);
    const steps = Math.max(8, Math.ceil(poly / 3));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const u = 1 - t;
      const b0 = u * u * u;
      const b1 = 3 * u * u * t;
      const b2 = 3 * u * t * t;
      const b3 = t * t * t;
      const d0 = 3 * u * u;
      const d1 = 6 * u * t;
      const d2 = 3 * t * t;
      push(
        b0 * seg.x0 + b1 * seg.x1 + b2 * seg.x2 + b3 * seg.x3,
        b0 * seg.y0 + b1 * seg.y1 + b2 * seg.y2 + b3 * seg.y3,
        d0 * (seg.x1 - seg.x0) + d1 * (seg.x2 - seg.x1) + d2 * (seg.x3 - seg.x2),
        d0 * (seg.y1 - seg.y0) + d1 * (seg.y2 - seg.y1) + d2 * (seg.y3 - seg.y2),
      );
    }
  }
  segS.push(total);

  const count = Math.max(1, Math.ceil(total / STEP)) + 1;
  const xs = new Float32Array(count);
  const ys = new Float32Array(count);
  const as = new Float32Array(count);
  const low = new Float32Array(count);
  let j = 0;
  let deepest = -Infinity;
  for (let i = 0; i < count; i++) {
    const s = Math.min(total, i * STEP);
    while (j < pl.length - 2 && pl[j + 1] < s) j++;
    const span = pl[j + 1] - pl[j];
    const t = span > 0 ? (s - pl[j]) / span : 0;
    xs[i] = px[j] + (px[j + 1] - px[j]) * t;
    ys[i] = py[j] + (py[j + 1] - py[j]) * t;
    as[i] = pa[j] + (pa[j + 1] - pa[j]) * t;
    if (ys[i] > deepest) deepest = ys[i];
    low[i] = deepest;
  }

  const index = (s: number) => {
    const v = s <= 0 ? 0 : s >= total ? count - 1 : s / STEP;
    return v > count - 1 ? count - 1 : v;
  };

  // Perfil de velocidade, como o de uma volta de pista: teto pela curvatura, depois uma
  // passada para a frente (aceleração) e outra para trás (frenagem). `time` = rolagem
  // acumulada que esse perfil gasta até cada ponto da tabela.
  const stopS = road.stopSeg.map((k) => segS[k] ?? total);
  const v = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const bend = (Math.abs(as[Math.min(count - 1, i + 1)] - as[Math.max(0, i - 1)]) * RAD) / (2 * STEP);
    v[i] = Math.min(DRIVE.max, DRIVE.turn / Math.max(bend, 1e-6));
  }
  for (const s of stopS) v[Math.min(count - 1, Math.round(s / STEP))] = DRIVE.stop;
  for (let i = 1; i < count; i++) v[i] = Math.min(v[i], Math.sqrt(v[i - 1] * v[i - 1] + 2 * DRIVE.accel * STEP));
  for (let i = count - 2; i >= 0; i--) v[i] = Math.min(v[i], Math.sqrt(v[i + 1] * v[i + 1] + 2 * DRIVE.accel * STEP));
  const time = new Float32Array(count);
  for (let i = 1; i < count; i++) time[i] = time[i - 1] + (2 * STEP) / (v[i - 1] + v[i]);
  const profile: Float32Array[] = [];
  const need: number[] = [];
  for (let k = 0; k + 1 < stopS.length; k++) {
    const i0 = Math.min(count - 1, Math.round(stopS[k] / STEP));
    const i1 = Math.min(count - 1, Math.round(stopS[k + 1] / STEP));
    const span = time[i1] - time[i0];
    const table = new Float32Array(PROFILE_N + 1);
    for (let q = 0, m = i0; q <= PROFILE_N; q++) {
      const t = time[i0] + (span * q) / PROFILE_N;
      while (m < i1 - 1 && time[m + 1] < t) m++;
      const dt = time[m + 1] - time[m];
      table[q] = (m + (dt > 0 ? Math.min(1, (t - time[m]) / dt) : 0)) * STEP;
    }
    table[0] = stopS[k];
    table[PROFILE_N] = stopS[k + 1];
    profile.push(table);
    need.push(span);
  }

  const lookup: RoadLookup = {
    length: total,
    stopS,
    segS,
    profile,
    need,
    at(s) {
      const v = index(s);
      const i = Math.min(count - 2, v | 0);
      if (i < 0) return { x: xs[0] ?? 0, y: ys[0] ?? 0, angle: as[0] ?? 90 };
      const t = v - i;
      return {
        x: xs[i] + (xs[i + 1] - xs[i]) * t,
        y: ys[i] + (ys[i + 1] - ys[i]) * t,
        angle: as[i] + (as[i + 1] - as[i]) * t,
      };
    },
    reachedY(s) {
      const v = index(s);
      const i = Math.min(count - 2, v | 0);
      if (i < 0) return low[0] ?? 0;
      return low[i] + (low[i + 1] - low[i]) * (v - i);
    },
  };
  if (lookupCache.size > 8) lookupCache.clear();
  lookupCache.set(road.d, lookup);
  return lookup;
}

export interface RoadGeom extends RoadPlan {
  /** px, iguais aos do viewBox da estrada e aos da caixa da seção. */
  width: number;
  height: number;
  /** Centro vertical de cada parada, em px da seção. */
  stopYs: number[];
  /** x do eixo da estrada em cada parada, em px da seção. */
  stopXs: number[];
  /** Topo e pé do card de cada parada, em px da seção (a legenda da D-20 se apoia neles). */
  cards: CardBox[];
  /** Meia-janela (px de estrada) em que o card conta como iluminado pelo farol. */
  litWindowPx: number;
}

/**
 * Distância ao longo da estrada em que o carro deve estar, dado `center` = altura (px da
 * seção) que está no meio da viewport.
 *
 * Cada parada tem a sua altura (o centro do card) e a sua distância na estrada. Quando o
 * centro do card está no meio da tela — onde o leitor o põe para ler, e onde o índice o
 * deixa com `scrollIntoView` — o carro está parado rente a ele. Entre duas paradas a rolagem
 * percorre o trecho inteiro de estrada, por mais voltas que ele dê, no perfil de velocidade do
 * trecho (`RoadLookup.profile`: devagar nas curvas fechadas, depressa nas retas, saindo e
 * chegando devagar). Antes da 1ª parada e depois da última o carro fica estacionado nela.
 */
export function carTargetS(center: number, stopYs: number[], lookup: RoadLookup): number {
  const stopS = lookup.stopS;
  const n = Math.min(stopYs.length, stopS.length);
  if (n === 0) return 0;
  if (center <= stopYs[0]) return stopS[0];
  for (let i = 1; i < n; i++) {
    if (center > stopYs[i]) continue;
    const span = stopYs[i] - stopYs[i - 1];
    const table = lookup.profile[i - 1];
    if (span <= 0 || !table) return stopS[i];
    const q = ((center - stopYs[i - 1]) / span) * PROFILE_N;
    const j = Math.min(PROFILE_N - 1, q | 0);
    return table[j] + (table[j + 1] - table[j]) * (q - j);
  }
  return stopS[n - 1];
}

/** Índice da parada mais próxima do carro e a distância, em px de estrada. */
export function nearestStop(s: number, stopS: number[]): { index: number; distance: number } {
  let index = 0;
  let distance = Infinity;
  for (let i = 0; i < stopS.length; i++) {
    const d = Math.abs(stopS[i] - s);
    if (d < distance) {
      distance = d;
      index = i;
    }
  }
  return { index, distance };
}
