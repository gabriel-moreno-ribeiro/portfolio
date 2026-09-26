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
 * inclinação, rodas e sombra — passa por lerp próprio, senão o
 * movimento "degrau" do sprite contamina o resto e vira trepidação na curva.
 */
const FRAME_HYSTERESIS = 1.6; // graus a mais que o vizinho precisa ser melhor para trocar
const K_ROLL = 0.12;
const K_WHEEL = 0.2;
const K_SHADE = 0.12;
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
   * a opacidade da sombra).
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const hazardRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const drawRef = useRef<((y: number, speed: number) => boolean) | null>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const wheelFxRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLSpanElement>(null);
  const wheelARef = useRef<HTMLSpanElement>(null);
  const wheelBRef = useRef<HTMLSpanElement>(null);
  const stateRef = useRef({
    phase: 0,
    lastY: -1,
    lastAngle: 90,
    frame: frameForHeading(90),
    roll: 0,
    wheelRate: 0,
    shade: 0.16,
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
        // Primeiro desenho, ou o frame em que o carro está parado acabou de ficar pronto.
        if (st.y >= 0 && (!st.drawn || img === imgs[st.frame])) drawRef.current?.(st.y, st.speed);
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
  //
  // O canvas só é redesenhado quando o frame do sprite troca (algumas dezenas de vezes na
  // estrada inteira). O que muda a cada quadro (sombra e brilho das rodas) são elementos
  // próprios movidos só por `transform`/`opacity`: redesenhar o canvas por quadro (clear,
  // sombra, sprite, arcos) era o grosso do custo do rAF da seção sob CPU 4×.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !road) return;

    const canvas = canvasRef.current;
    const ctx = canvas ? canvas.getContext('2d') : null; // null = sem canvas 2D → fica o poster
    const dpr = Math.min(2, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1);
    const px = Math.max(1, Math.round(size * dpr));
    if (canvas && canvas.width !== px) {
      canvas.width = px;
      canvas.height = px;
    }
    const pagePerSprite = size / FRAME_PX; // sprite px → px da página
    const lookup = roadLookup(road);
    const st = stateRef.current;
    const body = bodyRef.current;
    const fx = fxRef.current;
    const wheelFx = wheelFxRef.current;
    const shade = shadeRef.current;
    const wheels = [wheelARef.current, wheelBRef.current];
    // Últimos valores escritos: só toca no DOM quando mudam (cada escrita de estilo é um
    // recálculo de estilo no quadro).
    let lastRoll = '';
    let lastShade = '';
    let lastPhase = Number.NaN;
    let placedFrame = -1;
    let drawnImg: HTMLImageElement | null = null;
    const wheelAt = ['', ''];

    // Âncoras do frame: sombra na pegada das quatro rodas, brilho nas duas rodas à frente da
    // carroceria naquele yaw (`nearWheels` vem do render), piscas nas lanternas.
    const place = (frame: number) => {
      placedFrame = frame;
      const f = FRAMES[frame];
      const a = f.anchors;
      if (shade) {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (const w of [a.wheelFL, a.wheelFR, a.wheelRL, a.wheelRR]) {
          if (w.x < minX) minX = w.x;
          if (w.x > maxX) maxX = w.x;
          if (w.y < minY) minY = w.y;
          if (w.y > maxY) maxY = w.y;
        }
        const rx = ((maxX - minX) / 2 + WHEEL_R * 1.1) * pagePerSprite;
        const ry = ((maxY - minY) / 2 + WHEEL_R * 0.9) * pagePerSprite * 0.7;
        const cx = ((minX + maxX) / 2) * pagePerSprite;
        const cy = ((minY + maxY) / 2 + WHEEL_R * 0.55) * pagePerSprite;
        shade.style.transform = `translate3d(${(cx - rx).toFixed(1)}px, ${(cy - ry).toFixed(1)}px, 0) scale(${((rx * 2) / size).toFixed(3)}, ${((ry * 2) / size).toFixed(3)})`;
      }
      f.nearWheels.forEach((key, i) => {
        const w = a[key as keyof typeof a];
        wheelAt[i] = `translate3d(${(w.x * pagePerSprite).toFixed(1)}px, ${(w.y * pagePerSprite).toFixed(1)}px, 0)`;
      });
      lastPhase = Number.NaN; // força reescrever o brilho na posição nova
      if (hazardRef.current) {
        const style = hazardRef.current.style;
        style.setProperty('--exp-tl-x', `${(a.tailL.x * pagePerSprite).toFixed(1)}px`);
        style.setProperty('--exp-tl-y', `${(a.tailL.y * pagePerSprite).toFixed(1)}px`);
        style.setProperty('--exp-tr-x', `${(a.tailR.x * pagePerSprite).toFixed(1)}px`);
        style.setProperty('--exp-tr-y', `${(a.tailR.y * pagePerSprite).toFixed(1)}px`);
      }
    };

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

      wrap.style.transform = `translate3d(${(p.x - size / 2).toFixed(1)}px, ${(p.y - size / 2).toFixed(1)}px, 0)`;

      // Inclinação ∝ taxa de variação do ângulo, amaciada (não pula junto com o frame).
      const dAngle = shortestDelta(st.lastAngle, p.angle);
      st.lastAngle = p.angle;
      const targetRoll = Math.max(-4, Math.min(4, dAngle * 0.8));
      st.roll += (targetRoll - st.roll) * K_ROLL;
      const roll = st.roll.toFixed(2);
      if (body && roll !== lastRoll) {
        body.style.transform = `rotate(${roll}deg)`;
        lastRoll = roll;
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
        want === st.frame;

      if (frame !== placedFrame) place(frame);

      if (!ctx) return settled;
      // Sprite: só quando o frame troca ou quando o frame certo acaba de carregar.
      const imgs = imagesRef.current;
      if (drawnImg !== imgs[frame]) {
        const img = nearestReady(imgs, frame);
        if (!img) return settled; // nada pronto ainda → fica o poster
        if (img !== drawnImg) {
          ctx.clearRect(0, 0, px, px);
          ctx.drawImage(img, 0, 0, FRAME_PX, FRAME_PX, 0, 0, px, px);
          drawnImg = img;
        }
      }

      // Sombra de contato: opacidade ∝ velocidade. Brilho girando nas rodas.
      const shadeOp = st.shade.toFixed(3);
      if (shade && shadeOp !== lastShade) {
        shade.style.opacity = shadeOp;
        lastShade = shadeOp;
      }
      if (st.phase !== lastPhase) {
        lastPhase = st.phase;
        const turn = `rotate(${st.phase.toFixed(3)}rad)`;
        if (wheels[0]) wheels[0].style.transform = `${wheelAt[0]} ${turn}`;
        if (wheels[1]) wheels[1].style.transform = `${wheelAt[1]} ${turn}`;
      }

      if (!st.drawn) {
        st.drawn = true;
        fx?.classList.add('is-on');
        wheelFx?.classList.add('is-on');
        posterRef.current?.classList.add('is-hidden');
      }
      return settled;
    };

    if (st.y >= 0) drawRef.current(st.y, st.speed);
    return () => {
      drawRef.current = null;
    };
  }, [road, size]);

  // Brilho da roda: raio e traço iguais aos dos arcos que o canvas desenhava antes.
  const wheelR = WHEEL_R * (size / FRAME_PX) * 0.6;
  const wheelLine = Math.max(1, size * 0.014);
  const wheelStyle = {
    width: wheelR * 2 + wheelLine,
    height: wheelR * 2 + wheelLine,
    margin: -(wheelR + wheelLine / 2),
    borderWidth: wheelLine,
  };

  return (
    <div className="exp__car" ref={wrapRef} aria-hidden="true" style={{ width: size, height: size }}>
      <div className="exp__car-body" ref={bodyRef}>
        <div className="exp__car-shake">
          <div className="exp__car-fx" ref={fxRef}>
            <span className="exp__shade" ref={shadeRef} />
          </div>
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
          <div className="exp__car-fx" ref={wheelFxRef}>
            <span className="exp__wheel" ref={wheelARef} style={wheelStyle} />
            <span className="exp__wheel" ref={wheelBRef} style={wheelStyle} />
          </div>
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
