import { pathSampler, type PathSampler } from '../../../lib/motion';

/**
 * Geometria da estrada.
 *
 * O path é gerado em PIXELS da caixa medida da seção (ResizeObserver), não num viewBox fixo:
 * assim a estrada nunca distorce e as paradas caem exatamente no centro de cada `<li>`, que é
 * quem manda na altura (o conteúdo é HTML normal, não posicionado por JS).
 *
 * Invariante do movimento (`carTargetY`): tudo em PIXELS lidos ao vivo do
 * `getBoundingClientRect()` da seção no momento do desenho. Nenhuma altura de seção nem
 * altura de viewport fica em cache — cache aqui já produziu carro fora do quadro quando o
 * layout mudava depois da medição (a seção usa `vh` na sobra da estrada, então a altura muda
 * com resize).
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

export interface RoadGeom {
  d: string;
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
  /** `getBoundingClientRect().top` da seção. */
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
