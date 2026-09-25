import { useEffect, useRef, useState } from 'react';
import type { MotionValue } from 'motion/react';
import { CAR_SPRITES } from './carSprites';
import { carU, roadLookup, type RoadGeom } from './geometry';

/**
 * A D-20 sobre a estrada.
 *
 * Não é 3D: são 48 sprites pré-renderizados do mesmo GLB (`scripts/render-car-sprites.mjs`),
 * desenhados num canvas 2D. A medição que decidiu sprites em vez de GLB está no relatório.
 *
 * Mapeamento tangente → sprite: a câmera do render está elevada 40°, então o yaw do modelo
 * NÃO vira ângulo de tela linearmente (7,5° de yaw perto da traseira valem ~11,5° na tela;
 * perto do perfil, ~5°). Por isso cada frame carrega o `heading` que o eixo frontal do carro
 * tem NA TELA naquele yaw, e escolhemos o frame cujo `heading` está mais perto da tangente do
 * path. `FRAME_BY_DEG` resolve isso em O(1).
 */

const FRAMES = CAR_SPRITES.frames;
const FRAME_PX = CAR_SPRITES.frameWidth;
/** Raio da roda em px do sprite (2,84 unidades do modelo × pxPerUnit do render). */
const WHEEL_R = 2.84 * CAR_SPRITES.pxPerUnit;

function angleDelta(a: number, b: number): number {
  return Math.abs(((((a - b) % 360) + 540) % 360) - 180);
}

const FRAME_BY_DEG = (() => {
  const table = new Uint8Array(360);
  for (let deg = 0; deg < 360; deg++) {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < FRAMES.length; i++) {
      const dist = angleDelta(FRAMES[i].heading, deg);
      if (dist < bestD) {
        bestD = dist;
        best = i;
      }
    }
    table[deg] = best;
  }
  return table;
})();

function frameForHeading(deg: number): number {
  return FRAME_BY_DEG[((Math.round(deg) % 360) + 360) % 360];
}

/** A estrada entra na seção descendo na vertical: tangente 90°. É o frame do poster. */
export const POSTER_FRAME = FRAMES[frameForHeading(90)];

/** Mancha de sombra reaproveitada entre frames (evita criar gradiente a cada desenho). */
function makeShadow(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  if (!g) return null;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(42, 26, 18, 0.9)');
  grad.addColorStop(0.55, 'rgba(42, 26, 18, 0.45)');
  grad.addColorStop(1, 'rgba(42, 26, 18, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

interface CarProps {
  progress: MotionValue<number>;
  velocity: MotionValue<number>;
  road: RoadGeom | null;
  /** Lado, em px, do quadrado do carro na página. */
  size: number;
  reduced: boolean;
  /** Seção perto da viewport (rootMargin 800px): dispara o preload dos sprites. */
  active: boolean;
  /** Seção realmente visível: dispara o "engasga" uma vez. */
  entered: boolean;
  /** Carro estacionado na última parada (HIBEEX) → pisca-alerta. */
  atLastStop: boolean;
}

export default function Car({ progress, velocity, road, size, reduced, active, entered, atLastStop }: CarProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hazardRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const redrawRef = useRef<(() => void) | null>(null);
  const shadowRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ phase: 0, lastU: -1, lastAngle: 90 });
  const [drawn, setDrawn] = useState(false);
  const [cranking, setCranking] = useState(false);

  // Pré-carrega os 48 sprites quando a seção se aproxima. O poster (car-00) já está no DOM.
  useEffect(() => {
    if (!active || imagesRef.current.length) return;
    imagesRef.current = FRAMES.map((f) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => redrawRef.current?.();
      img.src = `/assets/car/${f.file}`;
      return img;
    });
  }, [active]);

  // "Engasga": micro-shake + farol piscando 2×, 420 ms, ao entrar na seção.
  useEffect(() => {
    if (!entered || reduced) return;
    setCranking(true);
    const id = window.setTimeout(() => setCranking(false), 420);
    return () => window.clearTimeout(id);
  }, [entered, reduced]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !road) return;
    if (!shadowRef.current) shadowRef.current = makeShadow();

    const canvas = canvasRef.current;
    const ctx = canvas ? canvas.getContext('2d') : null; // null = sem canvas 2D → fica o poster
    const dpr = Math.min(2, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1);
    const px = Math.max(1, Math.round(size * dpr));
    if (canvas && canvas.width !== px) {
      canvas.width = px;
      canvas.height = px;
    }
    const s = px / FRAME_PX; // sprite px → px do canvas
    const pagePerSprite = size / FRAME_PX; // sprite px → px da página
    const lookup = roadLookup(road.d);
    const st = stateRef.current;

    const draw = (u: number, speed: number): void => {
      const p = lookup.sampler.at(lookup.tAtY(u * road.height));
      const f = FRAMES[frameForHeading(p.angle)];

      wrap.style.transform = `translate3d(${(p.x - size / 2).toFixed(1)}px, ${(p.y - size / 2).toFixed(1)}px, 0)`;
      if (beamRef.current) beamRef.current.style.transform = `rotate(${p.angle.toFixed(1)}deg)`;

      // Inclinação nas curvas ∝ derivada do ângulo, limitada.
      const dAngle = ((p.angle - st.lastAngle + 540) % 360) - 180;
      st.lastAngle = p.angle;
      if (bodyRef.current) {
        const roll = Math.max(-4, Math.min(4, dAngle * 0.4));
        bodyRef.current.style.setProperty('--exp-roll', `${roll.toFixed(2)}deg`);
      }

      // Rodas: fase ∝ deslocamento real, limitada por frame para o giro não virar ruído
      // quando o scroll é rápido (efeito roda-de-carroça).
      const travel = Math.abs(u - (st.lastU < 0 ? u : st.lastU)) * road.height;
      st.lastU = u;
      st.phase += Math.min(0.7, travel / (WHEEL_R * pagePerSprite));

      if (hazardRef.current) {
        const { tailL, tailR } = f.anchors;
        const style = hazardRef.current.style;
        style.setProperty('--exp-tl-x', `${(tailL.x * pagePerSprite).toFixed(1)}px`);
        style.setProperty('--exp-tl-y', `${(tailL.y * pagePerSprite).toFixed(1)}px`);
        style.setProperty('--exp-tr-x', `${(tailR.x * pagePerSprite).toFixed(1)}px`);
        style.setProperty('--exp-tr-y', `${(tailR.y * pagePerSprite).toFixed(1)}px`);
      }

      if (!ctx) return;
      const img = imagesRef.current[FRAME_BY_DEG[((Math.round(p.angle) % 360) + 360) % 360]];
      if (!img || !img.complete || !img.naturalWidth) return;

      ctx.clearRect(0, 0, px, px);

      // Sombra de contato: elipse na pegada das quatro rodas, opacidade ∝ velocidade.
      const shadow = shadowRef.current;
      if (shadow) {
        const w = [f.anchors.wheelFL, f.anchors.wheelFR, f.anchors.wheelRL, f.anchors.wheelRR];
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (const a of w) {
          if (a.x < minX) minX = a.x;
          if (a.x > maxX) maxX = a.x;
          if (a.y < minY) minY = a.y;
          if (a.y > maxY) maxY = a.y;
        }
        const rx = ((maxX - minX) / 2 + WHEEL_R * 1.1) * s;
        const ry = ((maxY - minY) / 2 + WHEEL_R * 0.9) * s * 0.7;
        const cx = ((minX + maxX) / 2) * s;
        const cy = ((minY + maxY) / 2) * s + WHEEL_R * s * 0.55;
        ctx.save();
        ctx.globalAlpha = 0.16 + Math.min(0.16, speed * 0.6);
        ctx.drawImage(shadow, cx - rx, cy - ry, rx * 2, ry * 2);
        ctx.restore();
      }

      ctx.drawImage(img, 0, 0, FRAME_PX, FRAME_PX, 0, 0, px, px);

      // Rodas 2D: brilho girando só nas duas rodas que estão à frente da carroceria naquele
      // yaw (`nearWheels` vem do render, ordenado por profundidade de câmera).
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(1, px * 0.014);
      ctx.strokeStyle = 'rgba(255, 236, 214, 0.55)';
      const r = WHEEL_R * s * 0.6;
      for (const key of f.nearWheels) {
        const a = f.anchors[key as keyof typeof f.anchors];
        ctx.beginPath();
        ctx.arc(a.x * s, a.y * s, r, st.phase, st.phase + 0.9);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(a.x * s, a.y * s, r, st.phase + Math.PI, st.phase + Math.PI + 0.9);
        ctx.stroke();
      }
      ctx.restore();

      setDrawn(true);
    };

    const paint = (): void => {
      draw(reduced ? road.uLast : carU(progress.get(), road), reduced ? 0 : Math.abs(velocity.get()));
    };
    redrawRef.current = paint;
    paint(); // estado final já no primeiro paint: nada espera scroll

    if (reduced) return () => { redrawRef.current = null; };

    let queued = false;
    const onChange = (): void => {
      if (queued || document.hidden) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        paint();
      });
    };
    const unsubP = progress.on('change', onChange);
    const unsubV = velocity.on('change', onChange);
    return () => {
      redrawRef.current = null;
      unsubP();
      unsubV();
    };
  }, [road, size, reduced, progress, velocity]);

  // O pisca-alerta entra no DOM depois do último desenho: reposiciona nas lanternas.
  useEffect(() => {
    if (atLastStop) redrawRef.current?.();
  }, [atLastStop]);

  return (
    <div className="exp__car" ref={wrapRef} aria-hidden="true" style={{ width: size, height: size }}>
      <div className={`exp__car-body${cranking ? ' is-cranking' : ''}`} ref={bodyRef}>
        <svg className="exp__beam" ref={beamRef} viewBox="0 0 200 120" aria-hidden="true" focusable="false">
          <defs>
            <radialGradient id="expBeamGrad" cx="0.02" cy="0.5" r="1">
              <stop offset="0%" stopColor="var(--accent-decor)" stopOpacity="0.95" />
              <stop offset="50%" stopColor="var(--accent-decor)" stopOpacity="0.38" />
              <stop offset="100%" stopColor="var(--accent-decor)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d="M 6 60 L 200 12 L 200 108 Z" fill="url(#expBeamGrad)" />
        </svg>
        <div className="exp__car-shake">
          <img
            className={`exp__poster${drawn ? ' is-hidden' : ''}`}
            src={`/assets/car/${POSTER_FRAME.file}`}
            width={size}
            height={size}
            alt=""
            decoding="async"
          />
          <canvas className="exp__sprite" ref={canvasRef} style={{ width: size, height: size }} />
          {atLastStop && !reduced && (
            <div className="exp__hazard" ref={hazardRef}>
              <span className="exp__hazard-dot exp__hazard-dot--l" />
              <span className="exp__hazard-dot exp__hazard-dot--r" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
