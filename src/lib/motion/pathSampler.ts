// Amostragem de path SVG: pré-calcula (x, y, angle) a cada ~2 px em um Float32Array, para que
// at()/atLength() sejam O(1) em runtime (nenhum getPointAtLength durante a animação).
// Cache por string `d`. O <path> é criado com createElementNS e nunca é anexado ao documento.
import type { PathSample, PathSampler } from './types';

const STEP_PX = 2;
const cache = new Map<string, PathSampler>();

const EMPTY: PathSample = { x: 0, y: 0, angle: 0, tangent: { x: 1, y: 0 } };

function emptySampler(): PathSampler {
  return {
    length: 0,
    at: () => ({ ...EMPTY }),
    atLength: () => ({ ...EMPTY }),
    nearest: () => 0,
  };
}

/** Diferença angular mais curta, em graus. */
function shortestDelta(a: number, b: number): number {
  let d = b - a;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

export function pathSampler(d: string): PathSampler {
  const hit = cache.get(d);
  if (hit) return hit;

  if (typeof document === 'undefined') return emptySampler();

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);

  let length = 0;
  try {
    length = path.getTotalLength();
  } catch {
    length = 0;
  }
  if (!Number.isFinite(length) || length <= 0) {
    const empty = emptySampler();
    cache.set(d, empty);
    return empty;
  }

  const count = Math.max(2, Math.ceil(length / STEP_PX) + 1);
  const step = length / (count - 1);
  const data = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const p = path.getPointAtLength(i * step);
    data[i * 3] = p.x;
    data[i * 3 + 1] = p.y;
  }
  for (let i = 0; i < count; i += 1) {
    const a = Math.max(0, i - 1);
    const b = Math.min(count - 1, i + 1);
    const dx = data[b * 3] - data[a * 3];
    const dy = data[b * 3 + 1] - data[a * 3 + 1];
    // Graus, 0 = +x, sentido horário (y cresce para baixo na tela).
    data[i * 3 + 2] = (Math.atan2(dy, dx) * 180) / Math.PI;
  }

  const atLength = (len: number): PathSample => {
    const clamped = len < 0 ? 0 : len > length ? length : len;
    const pos = clamped / step;
    const i = Math.min(count - 2, Math.floor(pos));
    const f = pos - i;
    const x0 = data[i * 3];
    const y0 = data[i * 3 + 1];
    const a0 = data[i * 3 + 2];
    const x = x0 + (data[(i + 1) * 3] - x0) * f;
    const y = y0 + (data[(i + 1) * 3 + 1] - y0) * f;
    const angle = a0 + shortestDelta(a0, data[(i + 1) * 3 + 2]) * f;
    const rad = (angle * Math.PI) / 180;
    return { x, y, angle, tangent: { x: Math.cos(rad), y: Math.sin(rad) } };
  };

  const sampler: PathSampler = {
    length,
    atLength,
    at: (t) => atLength((Number.isFinite(t) ? t : 0) * length),
    nearest(x, y) {
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < count; i += 1) {
        const dx = data[i * 3] - x;
        const dy = data[i * 3 + 1] - y;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      return count > 1 ? best / (count - 1) : 0;
    },
  };

  cache.set(d, sampler);
  return sampler;
}
