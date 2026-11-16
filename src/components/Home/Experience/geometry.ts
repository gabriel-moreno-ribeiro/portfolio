/**
 * Geometria da estrada.
 *
 * O path é gerado em PIXELS da caixa medida da seção (ResizeObserver), não num viewBox fixo:
 * assim a estrada nunca distorce e as paradas caem exatamente no centro de cada `<li>`, que é
 * quem manda na altura (o conteúdo é HTML normal, não posicionado por JS).
 *
 * A estrada volta sobre si mesma (curva fechada, laço com viaduto), então não dá para
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

/** No mobile todos os cards ficam à direita: entre duas paradas a estrada recua isso. */
const NARROW_SWING = 22;

/** Raios (px) das manobras no desktop. O carro tem ~100 px: abaixo disso ele gira no lugar. */
const LOOP_R = 72;
const HAIRPIN_R = { min: 46, max: 64 } as const;
/** Quanto a curva fechada passa do eixo da parada seguinte antes de voltar. */
const HAIRPIN_OVER = 60;

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

export interface RoadPlan {
  d: string;
  segments: RoadSegment[];
  /** Índice do segmento que começa em cada parada. */
  stopSeg: number[];
  /**
   * Viaduto do laço: a estrada passa por cima em (x, y) na direção `angle` e, três quartos de
   * volta depois, por baixo. `overSeg` = segmento a partir do qual o carro já está indo para
   * baixo do viaduto (o tabuleiro passa a ser desenhado por cima dele). A passagem por cima
   * fica `deckBack` px antes do fim do segmento `deckSeg`.
   */
  bridge: { x: number; y: number; angle: number; overSeg: number; deckSeg: number; deckBack: number } | null;
  /** Curva fechada: centro, raio e para que lado fica o ápice (a defensa vai por fora). */
  hairpin: { x: number; y: number; r: number; dir: 1 | -1 } | null;
}

/**
 * Manobra do trecho que sai da parada `i` (de `n`), no desktop: curva fechada no 2º trecho,
 * laço no antepenúltimo. A parada seguinte a uma manobra ganha um respiro acima (SCSS,
 * `.exp__stop--room`): é o espaço em que ela acontece, e a rolagem a mais para o carro
 * percorrê-la sem correr.
 */
export function featureAt(i: number, n: number): 'hairpin' | 'loop' | null {
  if (i === 1 && n > 2) return 'hairpin';
  if (i === n - 3 && i > 1) return 'loop';
  return null;
}

const EMPTY: RoadPlan = { d: '', segments: [], stopSeg: [], bridge: null, hairpin: null };
const RAD = Math.PI / 180;
const f = (v: number) => +v.toFixed(2);

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
  return {
    segments,
    path: () => d,
    lineTo(nx: number, ny: number) {
      if (Math.hypot(nx - x, ny - y) < 0.5) return;
      segments.push({ kind: 'L', x0: x, y0: y, x1: nx, y1: ny });
      d += ` L ${f(nx)} ${f(ny)}`;
      x = nx;
      y = ny;
    },
    /** `turn` em graus: positivo = horário na tela (vira para a direita de quem dirige). */
    arc(r: number, turn: number) {
      const n = Math.ceil(Math.abs(turn) / 90);
      const step = turn / n;
      const k = (4 / 3) * Math.tan((Math.abs(step) * RAD) / 4) * r;
      const side = Math.sign(turn);
      for (let i = 0; i < n; i++) {
        const h0 = heading * RAD;
        const h1 = (heading + step) * RAD;
        const cx = x - side * r * Math.sin(h0);
        const cy = y + side * r * Math.cos(h0);
        const ex = cx + side * r * Math.sin(h1);
        const ey = cy - side * r * Math.cos(h1);
        cubic(x + k * Math.cos(h0), y + k * Math.sin(h0), ex - k * Math.cos(h1), ey - k * Math.sin(h1), ex, ey);
        heading += step;
      }
    },
    /** "S" descendo de uma tangente vertical a outra. */
    sTo(nx: number, ny: number) {
      const dy = (ny - y) / 2;
      cubic(x, y + dy, nx, ny - dy, nx, ny);
    },
  };
}

/**
 * Monta a estrada: entra na seção logo acima da 1ª parada (para não cruzar o cabeçalho),
 * passa rente a cada card na altura do centro dele, com tangente vertical, e termina em
 * `endY` (o pé do último card): nada de ponta solta sobre a seção seguinte.
 *
 * Desktop — os cards alternam de lado, então ao lado de cada um sobra meia coluna vazia, e é
 * nela que a estrada faz as manobras (nunca por baixo de um card: os raios saem das caixas
 * medidas, e o que não couber vira o "S" simples):
 *   · trecho 2 (depois da 2ª parada): curva fechada — sai da parada, cruza a coluna, dá meia
 *     volta e retorna contornando o canto do card seguinte;
 *   · antepenúltimo trecho: laço — uma curva aberta até um viaduto, três quartos de volta e a
 *     estrada passa por baixo dele rumo à parada seguinte;
 *   · último trecho: o "S" termina cedo e a estrada chega reta à última parada, onde o carro
 *     estaciona;
 *   · os demais: "S" de um lado ao outro.
 * Mobile — cards sempre à direita, faixa estreita: só um ponto recuado entre duas paradas.
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
  let bridge: RoadPlan['bridge'] = null;
  let hairpin: RoadPlan['hairpin'] = null;
  const reach = CARD_GAP.wide + roadHalf(false);

  for (let i = 0; i < n - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (narrow) {
      p.sTo(Math.min(a.x, b.x) - NARROW_SWING, (a.y + b.y) / 2);
      p.sTo(b.x, b.y);
      stopSeg.push(p.segments.length);
      continue;
    }
    // Para que lado fica a parada seguinte: +1 direita, −1 esquerda.
    const dir = b.x > a.x ? 1 : -1;
    const dx = Math.abs(b.x - a.x);
    // A meia coluna vazia abaixo desta parada vai do pé do card de cima (mesmo lado do
    // seguinte) até o topo do card seguinte.
    const floor = (cards[i + 1]?.top ?? b.y) - reach;
    const ceiling = i > 0 ? (cards[i - 1]?.bottom ?? a.y) + reach : -Infinity;
    const room = floor - a.y;
    const feature = featureAt(i, n);

    // Curva fechada: quarto de volta (r1), reta, meia-volta (r2) e um quarto de raio `reach`
    // em torno do canto do card seguinte — a estrada fica a um vão constante dele.
    const r2 = Math.max(HAIRPIN_R.min, Math.min(HAIRPIN_R.max, (room - 70) / 2));
    const r1 = Math.min(room - 2 * r2, dx - 40);
    const apexX = b.x + dir * (reach + HAIRPIN_OVER);
    const apexEdge = apexX + dir * (r2 + roadHalf(false));
    if (feature === 'hairpin' && r1 >= reach && floor - 2 * r2 >= ceiling && apexEdge > 8 && apexEdge < width - 8 && b.y - floor > reach + 20) {
      p.lineTo(a.x, floor - 2 * r2 - r1);
      p.arc(r1, -dir * 90);
      p.lineTo(apexX, floor - 2 * r2);
      p.arc(r2, dir * 180);
      hairpin = { x: apexX, y: floor - r2, r: r2, dir };
      p.lineTo(b.x + dir * reach, floor);
      p.arc(reach, -dir * 90);
      p.lineTo(b.x, b.y);
      stopSeg.push(p.segments.length);
      continue;
    }

    // Laço: quarto de volta aberto (rq) até a altura do viaduto, passa por cima em (b.x, yX),
    // três quartos de volta para o lado de fora e desce por b.x, por baixo do viaduto. Fica o
    // mais baixo que couber (rente ao card seguinte): enquanto o carro dá a volta ele não
    // desce, e quanto mais baixo o laço, menos o carro sobe na tela em relação à rolagem.
    const rq = Math.min(dx - 20, room);
    const yX = a.y + Math.max(rq, room - 24);
    const loopEdge = b.x + dir * (2 * LOOP_R + roadHalf(false));
    if (feature === 'loop' && rq >= 90 && yX - 2 * LOOP_R >= ceiling && loopEdge > 8 && loopEdge < width - 8 && b.y - yX > 40) {
      p.lineTo(a.x, yX - rq);
      p.arc(rq, -dir * 90);
      p.lineTo(b.x + dir * LOOP_R, yX);
      const deckSeg = p.segments.length - 1;
      p.arc(LOOP_R, -dir * 180);
      bridge = { x: b.x, y: yX, angle: dir > 0 ? 0 : 180, overSeg: p.segments.length, deckSeg, deckBack: LOOP_R };
      p.arc(LOOP_R, -dir * 90);
      p.lineTo(b.x, b.y);
      stopSeg.push(p.segments.length);
      continue;
    }

    // Último trecho: o "S" acaba antes, e a estrada chega reta à última parada.
    if (i === n - 2) p.sTo(b.x, b.y - Math.min(110, (b.y - a.y) * 0.3));
    else p.sTo(b.x, b.y);
    p.lineTo(b.x, b.y);
    stopSeg.push(p.segments.length);
  }

  const last = stops[n - 1];
  p.lineTo(last.x, Math.max(last.y, Math.min(height, endY)));
  return { d: p.path(), segments: p.segments, stopSeg, bridge, hairpin };
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
  /** Distância a partir da qual o carro está indo para baixo do viaduto (Infinity sem laço). */
  overS: number;
  /** Distância em que a estrada passa por cima do viaduto (0 sem laço). */
  deckS: number;
  /** Ponto e tangente a `s` px do início da estrada. */
  at(s: number): RoadSample;
  /** Ponto mais baixo (maior y) que a estrada já alcançou até `s`: é até onde ela "existe". */
  reachedY(s: number): number;
}

/** Passo da tabela, px de estrada. Bem abaixo do que se percebe; ~2 200 entradas no desktop. */
const STEP = 2;
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
  const lookup: RoadLookup = {
    length: total,
    stopS: road.stopSeg.map((k) => segS[k] ?? total),
    overS: road.bridge ? (segS[road.bridge.overSeg] ?? Infinity) : Infinity,
    deckS: road.bridge ? (segS[road.bridge.deckSeg + 1] ?? 0) - road.bridge.deckBack : 0,
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

/** Fração de cada trecho gasta acelerando (e a mesma freando). */
const RAMP = 0.2;

/**
 * Perfil de velocidade em trapézio entre duas paradas: parte do zero, acelera durante `RAMP`
 * do trecho, segue em velocidade constante e freia até parar na parada seguinte. Contínuo na
 * velocidade (zero dos dois lados de cada parada, então não há tranco de um trecho ao outro)
 * e com pico de só 1/(1 − RAMP) = 1,25× a média: o seno de antes chegava a 2× e ficava quase
 * parado por um quinto do trecho.
 */
function cruise(u: number): number {
  const v = 1 / (1 - RAMP);
  if (u < RAMP) return (v * u * u) / (2 * RAMP);
  if (u > 1 - RAMP) return 1 - (v * (1 - u) * (1 - u)) / (2 * RAMP);
  return v * (u - RAMP / 2);
}

/**
 * Distância ao longo da estrada em que o carro deve estar, dado `center` = altura (px da
 * seção) que está no meio da viewport.
 *
 * Cada parada tem a sua altura (o centro do card) e a sua distância na estrada. Quando o
 * centro do card está no meio da tela — onde o leitor o põe para ler, e onde o índice o
 * deixa com `scrollIntoView` — o carro está parado rente a ele. Entre duas paradas a rolagem
 * percorre o trecho inteiro de estrada, por mais voltas que ele dê, no perfil de `cruise`.
 * Antes da 1ª parada e depois da última o carro fica estacionado nela.
 */
export function carTargetS(center: number, stopYs: number[], stopS: number[]): number {
  const n = Math.min(stopYs.length, stopS.length);
  if (n === 0) return 0;
  if (center <= stopYs[0]) return stopS[0];
  for (let i = 1; i < n; i++) {
    if (center > stopYs[i]) continue;
    const span = stopYs[i] - stopYs[i - 1];
    const u = span > 0 ? (center - stopYs[i - 1]) / span : 1;
    return stopS[i - 1] + (stopS[i] - stopS[i - 1]) * cruise(u);
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
