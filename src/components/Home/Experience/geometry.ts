/**
 * Geometria da estrada.
 *
 * O path é gerado em PIXELS da caixa medida da seção (ResizeObserver), não num viewBox fixo:
 * assim a estrada nunca distorce e as paradas caem exatamente no centro de cada `<li>`, que é
 * quem manda na altura (o conteúdo é HTML normal, não posicionado por JS).
 *
 * Amostragem: como somos nós que geramos as cúbicas, avaliamos o polinômio direto em JS.
 * O `pathSampler` da lib usa `getPointAtLength` a cada 2 px; nesta estrada (4 177 px) são
 * 2 090 chamadas ao DOM, medidas em **2 553 ms sob CPU 4×** — inviável.
 */

export const CAR_SCREEN = 0.4;

/** Fração da largura em que a estrada cruza cada parada (alterna os lados). */
const LANES_WIDE = [0.68, 0.32];
/** No mobile a estrada é uma faixa à esquerda com curvas leves: px, não fração. */
const LANES_NARROW = [40, 22];

export function laneX(index: number, width: number, narrow: boolean): number {
  return narrow ? LANES_NARROW[index % 2] : width * LANES_WIDE[index % 2];
}

export type RoadSegment =
  | { kind: 'L'; x0: number; y0: number; x1: number; y1: number }
  | { kind: 'C'; x0: number; y0: number; x1: number; y1: number; x2: number; y2: number; x3: number; y3: number };

/**
 * Monta a estrada: entra na seção logo acima da 1ª parada (para não cruzar o cabeçalho),
 * cúbicas com tangente vertical em cada parada, e sai pelo pé da seção.
 * Devolve o `d` do SVG e os mesmos segmentos em forma numérica.
 */
export function buildRoad(
  width: number,
  height: number,
  stopYs: number[],
  narrow: boolean,
): { d: string; segments: RoadSegment[] } {
  if (width <= 0 || height <= 0 || stopYs.length === 0) return { d: '', segments: [] };
  const xs = stopYs.map((_, i) => +laneX(i, width, narrow).toFixed(2));
  const ys = stopYs.map((y) => +y.toFixed(2));
  const gap = ys.length > 1 ? ys[1] - ys[0] : height * 0.2;
  const startY = +Math.max(0, ys[0] - gap * 0.55).toFixed(2);

  const segments: RoadSegment[] = [{ kind: 'L', x0: xs[0], y0: startY, x1: xs[0], y1: ys[0] }];
  let d = `M ${xs[0]} ${startY} L ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < ys.length; i++) {
    const dy = (ys[i] - ys[i - 1]) / 2;
    const c1y = +(ys[i - 1] + dy).toFixed(2);
    const c2y = +(ys[i] - dy).toFixed(2);
    d += ` C ${xs[i - 1]} ${c1y} ${xs[i]} ${c2y} ${xs[i]} ${ys[i]}`;
    segments.push({
      kind: 'C',
      x0: xs[i - 1], y0: ys[i - 1],
      x1: xs[i - 1], y1: c1y,
      x2: xs[i], y2: c2y,
      x3: xs[i], y3: ys[i],
    });
  }
  const endX = xs[xs.length - 1];
  const endY = +height.toFixed(2);
  d += ` L ${endX} ${endY}`;
  segments.push({ kind: 'L', x0: endX, y0: ys[ys.length - 1], x1: endX, y1: endY });
  return { d, segments };
}

/** Lado da tela em que o card daquela parada fica: oposto à faixa da estrada. */
export function cardSide(index: number): 'left' | 'right' {
  return index % 2 === 0 ? 'left' : 'right';
}

export interface RoadSample {
  x: number;
  y: number;
  /** Graus, 0 = +x, horário (y cresce para baixo, como na tela). */
  angle: number;
}

export interface RoadLookup {
  /** Ponto e tangente da estrada na altura `y` (px da seção). */
  sampleAtY(y: number): RoadSample;
}

/** Amostras por cúbica: 160 × 5 curvas ≈ 4 px de passo, abaixo do limiar de percepção. */
const PER_CURVE = 160;
const lookupCache = new Map<string, RoadLookup>();

export function roadLookup(road: { d: string; segments: RoadSegment[] }): RoadLookup {
  const cached = lookupCache.get(road.d);
  if (cached) return cached;

  const xs: number[] = [];
  const ys: number[] = [];
  const as: number[] = [];
  const push = (x: number, y: number, tx: number, ty: number) => {
    if (ys.length && y <= ys[ys.length - 1]) return; // a estrada é monotônica em y
    xs.push(x);
    ys.push(y);
    as.push((Math.atan2(ty, tx) * 180) / Math.PI);
  };

  for (const seg of road.segments) {
    if (seg.kind === 'L') {
      const tx = seg.x1 - seg.x0;
      const ty = seg.y1 - seg.y0;
      push(seg.x0, seg.y0, tx, ty);
      push(seg.x1, seg.y1, tx, ty);
      continue;
    }
    for (let i = 0; i <= PER_CURVE; i++) {
      const t = i / PER_CURVE;
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

  const n = ys.length;
  const lookup: RoadLookup = {
    sampleAtY(y) {
      if (n === 0) return { x: 0, y: 0, angle: 90 };
      if (y <= ys[0]) return { x: xs[0], y: ys[0], angle: as[0] };
      if (y >= ys[n - 1]) return { x: xs[n - 1], y: ys[n - 1], angle: as[n - 1] };
      let lo = 0;
      let hi = n - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (ys[mid] <= y) lo = mid;
        else hi = mid;
      }
      const f = (y - ys[lo]) / (ys[hi] - ys[lo] || 1);
      const da = ((((as[hi] - as[lo]) % 360) + 540) % 360) - 180;
      return { x: xs[lo] + (xs[hi] - xs[lo]) * f, y, angle: as[lo] + da * f };
    },
  };
  if (lookupCache.size > 8) lookupCache.clear();
  lookupCache.set(road.d, lookup);
  return lookup;
}

export interface RoadGeom {
  d: string;
  segments: RoadSegment[];
  /** px, iguais aos do viewBox da estrada e aos da caixa da seção. */
  width: number;
  height: number;
  /** Centro vertical de cada parada, em px da seção. */
  stopYs: number[];
  /** Meia-janela (px) em que o card conta como iluminado pelo farol. */
  litWindowPx: number;
}

/** A seção como o carro precisa ver: posição e tamanho ao vivo. */
export interface LiveBox {
  /** Distância do topo da seção ao topo da viewport (negativa depois que ela sobe). */
  top: number;
  /** Altura da viewport. */
  vh: number;
}

/** Janela vertical (fração da viewport) fora da qual o carro não pode aparecer. */
const SAFE_MIN = 0.18;
const SAFE_MAX = 0.86;

/**
 * Altura, em px da seção, em que o carro deve estar.
 *
 *   yAlvo = (scroll já feito na seção) + 0.4 · vh          → linha dos 40 % da viewport
 *   yAlvo = clamp(yAlvo, y(1ª parada), y(última parada))   → estaciona nas pontas
 *   yAlvo = clamp(yAlvo, janela segura da viewport)        → nunca sai do quadro
 *
 * A 2ª clamp só morde enquanto a parada ainda está do lado certo da linha dos 40 %; a 3ª só
 * morde se a parada já saiu da tela. As três na ordem: estacionar não pode vencer a viewport.
 */
export function carTargetY(box: LiveBox, road: RoadGeom): number {
  const scrolled = -box.top;
  const free = scrolled + CAR_SCREEN * box.vh;
  const first = road.stopYs[0] ?? free;
  const last = road.stopYs[road.stopYs.length - 1] ?? free;
  const parked = free < first ? first : free > last ? last : free;
  const lo = scrolled + SAFE_MIN * box.vh;
  const hi = scrolled + SAFE_MAX * box.vh;
  return parked < lo ? lo : parked > hi ? hi : parked;
}

/** Índice da parada mais próxima do carro e a distância em px. */
export function nearestStop(y: number, stopYs: number[]): { index: number; distance: number } {
  let index = 0;
  let distance = Infinity;
  for (let i = 0; i < stopYs.length; i++) {
    const d = Math.abs(stopYs[i] - y);
    if (d < distance) {
      distance = d;
      index = i;
    }
  }
  return { index, distance };
}
