import { pathSampler, type PathSampler } from '../../../lib/motion';

/**
 * Geometria da estrada.
 *
 * O path é gerado em PIXELS da caixa medida da seção (ResizeObserver), não num viewBox fixo:
 * assim a estrada nunca distorce e as paradas caem exatamente no centro de cada `<li>`, que é
 * quem manda na altura (o conteúdo é HTML normal, não posicionado por JS).
 *
 * Invariante do movimento: o carro fica perto de `CAR_SCREEN` (40 %) da altura da viewport
 * enquanto a estrada passa por baixo. Com `k = viewportHeight / sectionHeight`:
 *
 *   u(p) = p · (1 − k) + CAR_SCREEN · k        (u = fração vertical percorrida na seção)
 *   p(u) = (u − CAR_SCREEN · k) / (1 − k)      (inversa: em que progresso a parada é atingida)
 */

export const CAR_SCREEN = 0.4;

/** Fração da largura em que a estrada cruza cada parada (alterna os lados). */
const LANES_WIDE = [0.68, 0.32];
/** No mobile a estrada é uma faixa à esquerda com curvas leves: px, não fração. */
const LANES_NARROW = [40, 22];

export function laneX(index: number, width: number, narrow: boolean): number {
  return narrow ? LANES_NARROW[index % 2] : width * LANES_WIDE[index % 2];
}

/**
 * Monta o `d` da estrada: entra na seção logo acima da 1ª parada (para não cruzar o
 * cabeçalho), cúbicas com tangente vertical em cada parada, e sai pelo pé da seção.
 */
export function buildRoadPath(width: number, height: number, stopYs: number[], narrow: boolean): string {
  if (width <= 0 || height <= 0 || stopYs.length === 0) return '';
  const xs = stopYs.map((_, i) => +laneX(i, width, narrow).toFixed(2));
  const ys = stopYs.map((y) => +y.toFixed(2));
  const gap = ys.length > 1 ? ys[1] - ys[0] : height * 0.2;
  const startY = Math.max(0, ys[0] - gap * 0.55).toFixed(2);

  let d = `M ${xs[0]} ${startY} L ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < ys.length; i++) {
    const dy = (ys[i] - ys[i - 1]) / 2;
    d += ` C ${xs[i - 1]} ${(ys[i - 1] + dy).toFixed(2)} ${xs[i]} ${(ys[i] - dy).toFixed(2)} ${xs[i]} ${ys[i]}`;
  }
  d += ` L ${xs[xs.length - 1]} ${height.toFixed(2)}`;
  return d;
}

/** Lado da tela em que o card daquela parada fica: oposto à faixa da estrada. */
export function cardSide(index: number): 'left' | 'right' {
  return index % 2 === 0 ? 'left' : 'right';
}

/**
 * Inversa de y(t) do path. A estrada é monotônica em y, então uma tabela de 256 amostras
 * + interpolação linear basta e evita `getPointAtLength` em loop a cada frame.
 */
export interface RoadLookup {
  sampler: PathSampler;
  /** t (0..1) do ponto do path na altura `y` (px). */
  tAtY(y: number): number;
}

const SAMPLES = 256;
const lookupCache = new Map<string, RoadLookup>();

export function roadLookup(d: string): RoadLookup {
  const cached = lookupCache.get(d);
  if (cached) return cached;
  const sampler = pathSampler(d);
  const ys = new Float64Array(SAMPLES + 1);
  for (let i = 0; i <= SAMPLES; i++) ys[i] = sampler.at(i / SAMPLES).y;
  const lookup: RoadLookup = {
    sampler,
    tAtY(y) {
      if (y <= ys[0]) return 0;
      if (y >= ys[SAMPLES]) return 1;
      let lo = 0;
      let hi = SAMPLES;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (ys[mid] <= y) lo = mid;
        else hi = mid;
      }
      const span = ys[hi] - ys[lo] || 1;
      return (lo + (y - ys[lo]) / span) / SAMPLES;
    },
  };
  if (lookupCache.size > 8) lookupCache.clear();
  lookupCache.set(d, lookup);
  return lookup;
}

/** Progresso da seção em que a parada na fração vertical `u` é atingida. */
export function progressAtU(u: number, k: number): number {
  const denom = 1 - k;
  if (denom <= 0.02) return u;
  return Math.max(0, Math.min(1, (u - CAR_SCREEN * k) / denom));
}

/** Fração vertical da seção correspondente ao progresso `p`. */
export function uAtProgress(p: number, k: number): number {
  const denom = 1 - k;
  if (denom <= 0.02) return p;
  return Math.max(0, Math.min(1, p * denom + CAR_SCREEN * k));
}

export interface RoadStop {
  /** Fração vertical da seção em que a parada está. */
  u: number;
  /** Progresso da seção em que o carro chega nela. */
  p: number;
}

export interface RoadGeom {
  d: string;
  /** px, iguais aos do viewBox da estrada e aos da seção. */
  width: number;
  height: number;
  /** viewportHeight / sectionHeight. */
  k: number;
  stops: RoadStop[];
  uFirst: number;
  uLast: number;
  /** Meia-janela (em u) em que o card conta como iluminado pelo farol. */
  litWindowU: number;
}

/**
 * Posição do carro (fração vertical da seção) para um progresso.
 * Fora do trecho entre a primeira e a última parada o carro fica estacionado nelas — é isso
 * que faz "começa parado na 1ª parada" e "termina parado no HIBEEX" serem verdade em qualquer
 * altura de viewport, sem depender de a seção ter exatamente a altura certa.
 */
export function carU(p: number, road: RoadGeom): number {
  const u = uAtProgress(p, road.k);
  return u < road.uFirst ? road.uFirst : u > road.uLast ? road.uLast : u;
}

/** Índice da parada mais próxima do carro e a distância (em u) até ela. */
export function nearestStop(u: number, stops: RoadStop[]): { index: number; distance: number } {
  let index = 0;
  let distance = Infinity;
  for (let i = 0; i < stops.length; i++) {
    const d = Math.abs(stops[i].u - u);
    if (d < distance) {
      distance = d;
      index = i;
    }
  }
  return { index, distance };
}
