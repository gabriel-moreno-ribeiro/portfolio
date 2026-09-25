import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { CAR_SPRITES } from './carSprites';
import { roadLookup, type RoadGeom } from './geometry';

/**
 * A D-20 sobre a estrada.
 *
 * Não é 3D: são 48 sprites pré-renderizados do mesmo GLB (`scripts/render-car-sprites.mjs`),
 * desenhados num canvas 2D. A medição que decidiu sprites em vez de GLB está no relatório.
 *
 * Quem dirige é o `Experience`: ele lê o rect da seção uma vez por frame e chama `draw()`.
 * Este componente **não** assina MotionValue nem tem estado que mude durante o scroll — o
 * scroll não pode disparar render do React (o scheduler do React foi o gargalo medido:
 * 799 ms num frame sob CPU 4×).
 *
 * Mapeamento tangente → sprite: a câmera do render está elevada 40°, então o yaw do modelo
 * NÃO vira ângulo de tela linearmente (7,5° de yaw valem ~11,5° na tela perto da traseira e
 * ~5° perto do perfil). Cada frame carrega o `heading` que o eixo frontal do carro tem NA
 * TELA naquele yaw, e escolhemos o frame cujo `heading` está mais perto da tangente do path.
 * `FRAME_BY_DEG` resolve isso em O(1).
 */

const FRAMES = CAR_SPRITES.frames;
const FRAME_PX = CAR_SPRITES.frameWidth;
/** Altura, em px, do `<svg>` do cone (casa com `.exp__beam` no SCSS). */
const BEAM_H = 78;
/** Raio da roda em px do sprite (2,84 unidades do modelo × pxPerUnit do render). */
const WHEEL_R = 2.84 * CAR_SPRITES.pxPerUnit;

function angleDelta(a: number, b: number): number {
  return Math.abs(((((a - b) % 360) + 540) % 360) - 180);
}

/** Diferença com sinal, caminho mais curto, em graus. */
function shortestDelta(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180;
}

/**
 * Amaciamento. O frame do sprite é discreto (7,5° de yaw), então tudo que é contínuo —
 * inclinação, rodas, sombra, brilho e direção do cone — passa por lerp próprio, senão o
 * movimento "degrau" do sprite contamina o resto e vira trepidação na curva.
 */
const FRAME_HYSTERESIS = 1.6; // graus a mais que o vizinho precisa ser melhor para trocar
const K_ROLL = 0.12;
const K_WHEEL = 0.2;
const K_SHADE = 0.12;
const K_BEAM = 0.22;
const K_LAMP = 0.25;
const SETTLED = 0.002;

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

/** Mancha de sombra reaproveitada entre frames (nada de gradiente por desenho). */
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

/** Frame pedido, ou o mais próximo que já carregou (evita o carro sumir durante o preload). */
function nearestReady(imgs: HTMLImageElement[], frame: number): HTMLImageElement | null {
  const n = FRAMES.length;
  for (let d = 0; d <= n >> 1; d++) {
    for (const k of d === 0 ? [frame] : [(frame + d) % n, (frame - d + n) % n]) {
      const img = imgs[k];
      if (img && img.complete && img.naturalWidth) return img;
    }
  }
  return null;
}

export interface CarHandle {
  /**
   * `y` = altura em px da seção; `speed` = px de rolagem suavizada por quadro (alimenta
   * a opacidade da sombra e o brilho do farol).
   * Devolve `true` quando todos os lerps já assentaram (quem chama pode parar o rAF).
   */
  draw(y: number, speed: number): boolean;
}

interface CarProps {
  road: RoadGeom | null;
  /** Lado, em px, do quadrado do carro na página. */
  size: number;
  reduced: boolean;
  /** Seção perto da viewport (rootMargin 800px): dispara download + decode dos sprites. */
  active: boolean;
  /** Seção realmente visível: dispara o "engasga" uma vez (classe CSS, sem timer contínuo). */
  entered: boolean;
}

const Car = forwardRef<CarHandle, CarProps>(function Car({ road, size, reduced, active, entered }, ref) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const hazardRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const drawRef = useRef<((y: number, speed: number) => boolean) | null>(null);
  const shadowRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    phase: 0,
    lastY: -1,
    lastAngle: 90,
    frame: frameForHeading(90),
    roll: 0,
    wheelRate: 0,
    shade: 0.16,
    beam: 90,
    beamK: 0.72,
    lampX: 0,
    lampY: 0,
    drawn: false,
    y: -1,
    speed: 0,
  });

  useImperativeHandle(ref, () => ({
    draw: (y, speed) => {
      stateRef.current.y = y;
      stateRef.current.speed = speed;
      return drawRef.current ? drawRef.current(y, speed) : true;
    },
  }), []);

  // Baixa os 48 sprites quando a seção se aproxima e encadeia os `decode()` em idle,
  // começando pelo frame do poster: os 48 decodes de uma vez competiam com o scroll.
  useEffect(() => {
    if (!active || imagesRef.current.length) return;
    const imgs: HTMLImageElement[] = FRAMES.map((f) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = `/assets/car/${f.file}`;
      return img;
    });
    imagesRef.current = imgs;

    const order = imgs.map((_, i) => i).sort((a, b) => angleDelta(FRAMES[a].heading, 90) - angleDelta(FRAMES[b].heading, 90));
    let cancelled = false;
    let i = 0;
    const idle = (cb: () => void) =>
      typeof requestIdleCallback === 'function' ? requestIdleCallback(cb, { timeout: 250 }) : window.setTimeout(cb, 32);
    const step = () => {
      if (cancelled || i >= order.length) return;
      const img = imgs[order[i++]];
      const next = () => {
        if (cancelled) return;
        const st = stateRef.current;
        if (!st.drawn && st.y >= 0) drawRef.current?.(st.y, st.speed);
        idle(step);
      };
      (img.decode ? img.decode() : Promise.resolve()).then(next, next);
    };
    step();
    return () => {
      cancelled = true;
    };
  }, [active]);

  // "Engasga" ao entrar: 420 ms de keyframes CSS. Sem estado do React — classe direto no DOM.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body || !entered || reduced) return;
    body.classList.add('is-cranking');
    const id = window.setTimeout(() => body.classList.remove('is-cranking'), 420);
    return () => {
      window.clearTimeout(id);
      body.classList.remove('is-cranking');
    };
  }, [entered, reduced]);

  // Monta o desenhador. Só refaz quando a geometria ou o tamanho mudam.
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
    const lookup = roadLookup(road);
    const st = stateRef.current;
    const shadow = shadowRef.current;

    drawRef.current = (y: number, speed: number): boolean => {
      const p = lookup.sampleAtY(y);

      // Frame do sprite com histerese: só troca quando o vizinho fica melhor que o atual por
      // mais de FRAME_HYSTERESIS, e no máximo um frame por rAF. Sem isso a tangente oscilando
      // em torno do meio-caminho entre dois yaws fazia o carro tremer na curva.
      const want = frameForHeading(p.angle);
      if (want !== st.frame) {
        const n = FRAMES.length;
        const dir = (((want - st.frame) % n) + n + n / 2) % n - n / 2;
        const next = (st.frame + (dir > 0 ? 1 : -1) + n) % n;
        if (angleDelta(FRAMES[next].heading, p.angle) + FRAME_HYSTERESIS < angleDelta(FRAMES[st.frame].heading, p.angle)) {
          st.frame = next;
        }
      }
      const frame = st.frame;
      const f = FRAMES[frame];

      wrap.style.transform = `translate3d(${(p.x - size / 2).toFixed(1)}px, ${(p.y - size / 2).toFixed(1)}px, 0)`;

      // Inclinação ∝ taxa de variação do ângulo, amaciada (não pula junto com o frame).
      const dAngle = shortestDelta(st.lastAngle, p.angle);
      st.lastAngle = p.angle;
      const targetRoll = Math.max(-4, Math.min(4, dAngle * 0.8));
      st.roll += (targetRoll - st.roll) * K_ROLL;
      wrap.style.setProperty('--exp-roll', `${st.roll.toFixed(2)}deg`);

      // Cone: aponta para o heading do frame DESENHADO (não para a tangente crua), com lerp —
      // assim a luz nunca descasa do capô, e o apex acompanha os faróis sem saltar no troca-frame.
      const lampX = ((f.anchors.lampL.x + f.anchors.lampR.x) / 2) * pagePerSprite;
      const lampY = ((f.anchors.lampL.y + f.anchors.lampR.y) / 2) * pagePerSprite;
      if (st.lampX === 0 && st.lampY === 0) {
        st.lampX = lampX;
        st.lampY = lampY;
        st.beam = f.heading;
      }
      st.lampX += (lampX - st.lampX) * K_LAMP;
      st.lampY += (lampY - st.lampY) * K_LAMP;
      st.beam += shortestDelta(st.beam, f.heading) * K_BEAM;
      const targetBeamK = 0.72 + Math.min(0.28, speed / 80);
      st.beamK += (targetBeamK - st.beamK) * K_SHADE;
      wrap.style.setProperty('--exp-beam-k', st.beamK.toFixed(3));
      if (beamRef.current) {
        beamRef.current.style.transform =
          `translate(${st.lampX.toFixed(1)}px, ${(st.lampY - BEAM_H / 2).toFixed(1)}px) rotate(${st.beam.toFixed(1)}deg)`;
      }

      // Rodas: a taxa de giro também é amaciada, então o giro não engasga quando o frame troca.
      const travel = Math.abs(y - (st.lastY < 0 ? y : st.lastY));
      st.lastY = y;
      const targetRate = Math.min(0.7, travel / (WHEEL_R * pagePerSprite));
      st.wheelRate += (targetRate - st.wheelRate) * K_WHEEL;
      st.phase += st.wheelRate;

      const targetShade = 0.16 + Math.min(0.16, speed / 120);
      st.shade += (targetShade - st.shade) * K_SHADE;

      const settled =
        Math.abs(targetRoll - st.roll) < SETTLED &&
        st.wheelRate < SETTLED &&
        Math.abs(targetShade - st.shade) < SETTLED &&
        Math.abs(targetBeamK - st.beamK) < SETTLED &&
        Math.abs(shortestDelta(st.beam, f.heading)) < 0.05 &&
        want === st.frame;

      if (hazardRef.current) {
        const { tailL, tailR } = f.anchors;
        const style = hazardRef.current.style;
        style.setProperty('--exp-tl-x', `${(tailL.x * pagePerSprite).toFixed(1)}px`);
        style.setProperty('--exp-tl-y', `${(tailL.y * pagePerSprite).toFixed(1)}px`);
        style.setProperty('--exp-tr-x', `${(tailR.x * pagePerSprite).toFixed(1)}px`);
        style.setProperty('--exp-tr-y', `${(tailR.y * pagePerSprite).toFixed(1)}px`);
      }

      if (!ctx) return settled;
      const img = nearestReady(imagesRef.current, frame);
      if (!img) return settled; // nada pronto ainda → fica o poster

      ctx.clearRect(0, 0, px, px);

      // Sombra de contato: elipse na pegada das quatro rodas, opacidade ∝ velocidade.
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
        ctx.globalAlpha = st.shade;
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

      if (!st.drawn) {
        st.drawn = true;
        posterRef.current?.classList.add('is-hidden');
      }
      return settled;
    };

    if (st.y >= 0) drawRef.current(st.y, st.speed);
    return () => {
      drawRef.current = null;
    };
  }, [road, size]);

  return (
    <div className="exp__car" ref={wrapRef} aria-hidden="true" style={{ width: size, height: size }}>
      <div className="exp__car-body" ref={bodyRef}>
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
            className="exp__poster"
            ref={posterRef}
            src={`/assets/car/${POSTER_FRAME.file}`}
            width={size}
            height={size}
            alt=""
            decoding="async"
          />
          <canvas className="exp__sprite" ref={canvasRef} style={{ width: size, height: size }} />
          {!reduced && (
            <div className="exp__hazard" ref={hazardRef}>
              <span className="exp__hazard-dot exp__hazard-dot--l" />
              <span className="exp__hazard-dot exp__hazard-dot--r" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default Car;
