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

export interface StopAnchor {
  /** x do eixo da estrada na parada (ápice da curva), px da seção. */
  x: number;
  /** Centro vertical da parada, px da seção. */
  y: number;
}

export type RoadSegment =
  | { kind: 'L'; x0: number; y0: number; x1: number; y1: number }
  | { kind: 'C'; x0: number; y0: number; x1: number; y1: number; x2: number; y2: number; x3: number; y3: number };

/**
 * Monta a estrada: entra na seção logo acima da 1ª parada (para não cruzar o cabeçalho),
 * cúbicas com tangente vertical em cada ponto, e termina em `endY` (o pé do último card):
 * nada de ponta solta sobre a seção seguinte.
 *
 * Cada parada é o ápice de uma curva que se abre na direção do card: o card fica do lado
 * de fora da curva, então o ponto da estrada mais perto dele é exatamente o da altura da
 * parada, e dali para cima e para baixo ela só se afasta. No desktop os cards alternam de
 * lado e isso sai de graça; no mobile (cards sempre à direita) entra um ponto recuado entre
 * duas paradas.
 */
export function buildRoad(
  width: number,
  height: number,
  stops: StopAnchor[],
  narrow: boolean,
  endY: number,
): { d: string; segments: RoadSegment[] } {
  if (width <= 0 || height <= 0 || stops.length === 0) return { d: '', segments: [] };
  const pts: StopAnchor[] = [];
  stops.forEach((s, i) => {
    const prev = stops[i - 1];
    if (narrow && prev) pts.push({ x: Math.min(prev.x, s.x) - NARROW_SWING, y: (prev.y + s.y) / 2 });
    pts.push(s);
  });
  const xs = pts.map((p) => +p.x.toFixed(2));
  const ys = pts.map((p) => +p.y.toFixed(2));
  // Uma caixa medida no meio de um resize pode vir sem número: nunca vira `d` com NaN.
  if (![...xs, ...ys, endY].every(Number.isFinite)) return { d: '', segments: [] };
  const gap = stops.length > 1 ? stops[1].y - stops[0].y : height * 0.2;
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
  const tail = +Math.max(ys[ys.length - 1], Math.min(height, endY)).toFixed(2);
  d += ` L ${endX} ${tail}`;
  segments.push({ kind: 'L', x0: endX, y0: ys[ys.length - 1], x1: endX, y1: tail });
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
  /** x do eixo da estrada em cada parada, em px da seção. */
  stopXs: number[];
  /** Topo e pé do card de cada parada, em px da seção (a legenda da D-20 se apoia neles). */
  cards: { top: number; bottom: number }[];
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
 *   yAlvo = (scroll já feito na seção) + 0.5 · vh          → meio da viewport
 *   yAlvo = clamp(yAlvo, y(1ª parada), y(última parada))   → estaciona nas pontas
 *   yAlvo = dwell(yAlvo)                                   → freia e para em cada parada
 *   yAlvo = clamp(yAlvo, janela segura da viewport)        → nunca sai do quadro
 *
 * Meio da viewport: é onde o card fica quando o leitor o centraliza (ou quando o índice
 * faz `scrollIntoView`), então o carro para rente ao próprio marco.
 */
export function carTargetY(box: LiveBox, road: RoadGeom): number {
  const scrolled = -box.top;
  const free = scrolled + CAR_SCREEN * box.vh;
  const first = road.stopYs[0] ?? free;
  const last = road.stopYs[road.stopYs.length - 1] ?? free;
  const parked = dwell(free < first ? first : free > last ? last : free, road.stopYs);
  const lo = scrolled + SAFE_MIN * box.vh;
  const hi = scrolled + SAFE_MAX * box.vh;
  return parked < lo ? lo : parked > hi ? hi : parked;
}

/**
 * Entre duas paradas, u ∈ [0, 1] vira u − sen(2πu)/2π: derivada zero em cada parada (o carro
 * freia, fica parado um trecho do scroll e sai acelerando), no máximo 2× no meio do trecho.
 * Monótona e contínua na derivada, então não há tranco na passagem de um trecho para o outro.
 */
function dwell(y: number, stopYs: number[]): number {
  for (let i = 0; i < stopYs.length - 1; i++) {
    const a = stopYs[i];
    const b = stopYs[i + 1];
    if (y < a || y > b || b <= a) continue;
    const u = (y - a) / (b - a);
    return a + (b - a) * (u - Math.sin(2 * Math.PI * u) / (2 * Math.PI));
  }
  return y;
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
