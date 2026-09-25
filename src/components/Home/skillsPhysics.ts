// Caixa de ferramentas: a bandeja tomba, os ícones caem e empilham (matter-js).
// Sem React aqui de propósito — o componente só cria, ajusta e destrói.
// O loop só roda com a seção visível, a aba visível e algum corpo acordado.
import type { Body, Engine, Mouse, MouseConstraint } from 'matter-js';

export interface ToolboxItem {
  id: string;
  name: string;
  /** URL já resolvida do ícone no tema atual. */
  src: string;
  /** true para SVG "pelado" (devicon): desenha um card atrás. */
  card: boolean;
  /** true quando a skill está na stack do HIBEEX. */
  lit: boolean;
}

export interface ToolboxOptions {
  canvas: HTMLCanvasElement;
  items: ToolboxItem[];
  /** Lado do card, em px de CSS. */
  size: number;
  onHover(name: string | null, x: number, y: number): void;
}

export interface Toolbox {
  /** Troca as URLs dos ícones (mudança de tema) e redesenha. */
  setItems(items: ToolboxItem[]): void;
  /** Liga/desliga o realce "used in HIBEEX". */
  setHighlight(on: boolean): void;
  /** Liga/desliga o loop (seção visível). */
  setActive(on: boolean): void;
  destroy(): void;
}

/** Matter expõe estes handlers no objeto Mouse; os tipos oficiais não os declaram. */
type MouseWithHandlers = Mouse & {
  mousedown(event: Event): void;
  mousemove(event: Event): void;
  mouseup(event: Event): void;
  mousewheel(event: Event): void;
};

const STEP = 1000 / 60;
const TRAY_TILT = (12 * Math.PI) / 180;
const TRAY_MS = 500;
const WAVE_MS = 900;
/** Rede de segurança: passado isso sem arrasto, o mundo dorme à força e o rAF para. */
const SETTLE_MS = 9000;
const WALL = 200;

/** `roundRect` existe em todos os navegadores que interessam; sem ele fica a grade estática. */
export function canvasReady(): boolean {
  if (typeof document === 'undefined') return false;
  const probe = document.createElement('canvas').getContext('2d');
  return !!probe && typeof probe.roundRect === 'function';
}

function loadImages(items: ToolboxItem[]): Promise<Map<string, HTMLImageElement>> {
  const map = new Map<string, HTMLImageElement>();
  return Promise.all(
    items.map(
      (item) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            map.set(item.id, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = item.src;
        }),
    ),
  ).then(() => map);
}

export async function createToolbox({ canvas, items, size, onHover }: ToolboxOptions): Promise<Toolbox | null> {
  const host = canvas.parentElement;
  const ctx2d = canvas.getContext('2d');
  if (!host || !ctx2d) return null;
  const c = ctx2d;

  const mod = await import('matter-js');
  const M = ((mod as unknown as { default?: typeof mod }).default ?? mod) as typeof mod;
  const { Bodies, Body: Bd, Common, Composite, Engine: Eng, Events, Mouse: Ms, MouseConstraint: MC, Query, Sleeping } = M;

  let byId = new Map(items.map((item) => [item.id, item]));
  let images = await loadImages(items);

  const engine: Engine = Eng.create({ enableSleeping: true });
  engine.gravity.y = 1;
  engine.positionIterations = 4;
  engine.velocityIterations = 4;
  const world = engine.world;

  let w = Math.max(1, host.clientWidth);
  let h = Math.max(1, host.clientHeight);
  let dpr = Math.min(2, window.devicePixelRatio || 1);

  const left = Bodies.rectangle(-WALL / 2, h / 2, WALL, h * 4, { isStatic: true });
  const right = Bodies.rectangle(w + WALL / 2, h / 2, WALL, h * 4, { isStatic: true });
  const floor = Bodies.rectangle(w / 2, h + WALL / 2, w * 4, WALL, { isStatic: true, friction: 0.6 });
  Composite.add(world, [left, right, floor]);

  const half = Math.ceil(items.length / 2);
  const trayY = Math.min(96, h * 0.16);
  const trayW = Math.min(w * 0.86, half * (size + 18));
  let tray: Body | null = Bodies.rectangle(w / 2, trayY, trayW, 12, {
    isStatic: true,
    friction: 0.6,
    chamfer: { radius: 6 },
  });
  Composite.add(world, tray);

  const cards: Body[] = [];
  const palette = { surface: '#fff', border: '#e7e7e7', accent: '#f0732d', fg: '#111' };

  function readPalette(): void {
    const cs = getComputedStyle(document.documentElement);
    palette.surface = cs.getPropertyValue('--surface').trim() || palette.surface;
    palette.border = cs.getPropertyValue('--border').trim() || palette.border;
    palette.accent = cs.getPropertyValue('--accent-decor').trim() || palette.accent;
    palette.fg = cs.getPropertyValue('--fg').trim() || palette.fg;
  }
  readPalette();

  function spawn(from: number, to: number): void {
    const span = to - from;
    const y = trayY - 6 - size / 2 - 1;
    for (let i = from; i < to; i++) {
      const slot = (i - from + 0.5) / span;
      const body = Bodies.rectangle(w / 2 - trayW / 2 + slot * trayW + Common.random(-4, 4), y, size, size, {
        chamfer: { radius: size * 0.22 },
        restitution: 0.2,
        friction: 0.4,
        frictionAir: 0.012,
        angle: Common.random(-0.08, 0.08),
        sleepThreshold: 45,
        label: items[i].id,
      });
      cards.push(body);
      Composite.add(world, body);
    }
  }

  // ── loop ───────────────────────────────────────────────────────────────────
  let raf = 0;
  let active = true;
  let elapsed = 0;
  let waveTwo = false;
  let frames = 0;
  let stepMax = 0;
  let stepSum = 0;
  let dragging = false;
  let touching = false;
  let highlight = false;
  let hovered: string | null = null;

  function report(running: boolean): void {
    if (!import.meta.env.DEV) return;
    (window as unknown as Record<string, unknown>).__skillsPhysics = {
      frames,
      running,
      elapsed,
      stepMax: Math.round(stepMax * 100) / 100,
      stepAvg: frames ? Math.round((stepSum / frames) * 100) / 100 : 0,
      // O QA precisa saber onde os cards estão para testar o arrasto.
      bodies: cards.map((b) => ({ id: String(b.label), x: Math.round(b.position.x), y: Math.round(b.position.y) })),
    };
  }

  function step(): void {
    raf = 0;
    if (!active || document.hidden) {
      report(false);
      return;
    }
    elapsed += STEP;

    if (tray) {
      const t = Math.min(1, elapsed / TRAY_MS);
      Bd.setAngle(tray, TRAY_TILT * t * t);
      if (t >= 1) {
        Composite.remove(world, tray);
        tray = null;
      }
    }
    if (!waveTwo && elapsed >= WAVE_MS) {
      waveTwo = true;
      spawn(half, items.length);
    }

    const t = performance.now();
    Eng.update(engine, STEP);
    draw();
    frames++;
    if (import.meta.env.DEV) {
      const cost = performance.now() - t;
      stepSum += cost;
      if (cost > stepMax) stepMax = cost;
    }

    const busy = dragging || touching;
    if (!busy && waveTwo && !tray && elapsed > SETTLE_MS) {
      for (const body of cards) Sleeping.set(body, true);
    }
    if (!busy && waveTwo && !tray && cards.every((b) => b.isSleeping)) {
      report(false);
      return;
    }
    report(true);
    raf = requestAnimationFrame(step);
  }

  function kick(): void {
    if (raf || !active || document.hidden) return;
    raf = requestAnimationFrame(step);
  }

  // ── desenho ────────────────────────────────────────────────────────────────
  function roundedPath(x: number, y: number, s: number, r: number): void {
    c.beginPath();
    c.roundRect(x, y, s, s, r);
  }

  function draw(): void {
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);

    if (tray) {
      c.save();
      c.translate(tray.position.x, tray.position.y);
      c.rotate(tray.angle);
      c.fillStyle = palette.border;
      c.beginPath();
      c.roundRect(-trayW / 2, -6, trayW, 12, 6);
      c.fill();
      c.restore();
    }

    for (const body of cards) {
      const item = byId.get(String(body.label));
      const img = item && images.get(item.id);
      if (!item || !img) continue;
      c.save();
      c.globalAlpha = highlight && !item.lit ? 0.45 : 1;
      c.translate(body.position.x, body.position.y);
      c.rotate(body.angle);
      if (item.card) {
        roundedPath(-size / 2, -size / 2, size, size * 0.22);
        c.fillStyle = palette.surface;
        c.fill();
        c.lineWidth = 1;
        c.strokeStyle = palette.border;
        c.stroke();
        const inner = size * 0.62;
        c.drawImage(img, -inner / 2, -inner / 2, inner, inner);
      } else {
        c.drawImage(img, -size / 2, -size / 2, size, size);
      }
      if (highlight && item.lit) {
        roundedPath(-size / 2 - 3, -size / 2 - 3, size + 6, size * 0.22 + 3);
        c.lineWidth = 2.5;
        c.strokeStyle = palette.accent;
        c.stroke();
      } else if (hovered === item.id) {
        roundedPath(-size / 2 - 3, -size / 2 - 3, size + 6, size * 0.22 + 3);
        c.lineWidth = 2;
        c.strokeStyle = palette.fg;
        c.stroke();
      }
      c.restore();
    }
  }

  // ── entrada por ponteiro ───────────────────────────────────────────────────
  const mouse = Ms.create(canvas) as MouseWithHandlers;
  // Matter converte o ponto por `x / (clientWidth / width * pixelRatio)`. Com o backing store em
  // `cssW * dpr`, só `pixelRatio = dpr` devolve coordenadas em px de CSS (o mundo é em px de CSS).
  mouse.pixelRatio = dpr;
  const mc: MouseConstraint = MC.create(engine, {
    mouse,
    constraint: { stiffness: 0.18, damping: 0.08, render: { visible: false } },
  });
  Composite.add(world, mc);

  // Matter prende os touch* com `preventDefault` fixo: a página pararia de rolar dentro da seção.
  // Trocamos pelos nossos, que só bloqueiam o scroll quando o dedo de fato pegou um card.
  canvas.removeEventListener('touchstart', mouse.mousedown);
  canvas.removeEventListener('touchmove', mouse.mousemove);
  canvas.removeEventListener('touchend', mouse.mouseup);
  canvas.removeEventListener('wheel', mouse.mousewheel);
  canvas.removeEventListener('mousewheel', mouse.mousewheel);

  Events.on(mc, 'startdrag', () => {
    dragging = true;
    kick();
  });
  Events.on(mc, 'enddrag', () => {
    dragging = false;
  });

  function localPoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function onTouchStart(e: TouchEvent): void {
    const t = e.changedTouches[0];
    if (!t) return;
    if (Query.point(cards, localPoint(t.clientX, t.clientY)).length === 0) return; // dedo no vazio: a página rola
    touching = true;
    kick();
    mouse.mousedown(e);
  }
  function onTouchMove(e: TouchEvent): void {
    if (!touching) return;
    e.preventDefault();
    mouse.mousemove(e);
  }
  function onTouchEnd(e: TouchEvent): void {
    if (!touching) return;
    touching = false;
    mouse.mouseup(e);
  }
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd, { passive: false });
  canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });
  canvas.addEventListener('mousedown', kick);

  function onMouseMove(e: MouseEvent): void {
    const p = localPoint(e.clientX, e.clientY);
    const hit = Query.point(cards, p)[0];
    const id = hit ? String(hit.label) : null;
    if (id === hovered) return;
    hovered = id;
    const item = id ? byId.get(id) : undefined;
    onHover(item ? item.name : null, p.x, p.y);
    if (!raf) draw();
  }
  function onMouseLeave(): void {
    if (hovered === null) return;
    hovered = null;
    onHover(null, 0, 0);
    if (!raf) draw();
  }
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', onMouseLeave);

  function onVisibility(): void {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      report(false);
    } else {
      kick();
    }
  }
  document.addEventListener('visibilitychange', onVisibility);

  // ── tamanho ────────────────────────────────────────────────────────────────
  function measure(): void {
    w = Math.max(1, host!.clientWidth);
    h = Math.max(1, host!.clientHeight);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    mouse.pixelRatio = dpr;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    Bd.setPosition(left, { x: -WALL / 2, y: h / 2 });
    Bd.setPosition(right, { x: w + WALL / 2, y: h / 2 });
    Bd.setPosition(floor, { x: w / 2, y: h + WALL / 2 });
    for (const body of cards) Sleeping.set(body, false);
    draw();
    kick();
  }

  measure();
  spawn(0, half);
  draw();

  const ro = new ResizeObserver(measure);
  ro.observe(host);
  kick();

  return {
    setItems(next) {
      byId = new Map(next.map((item) => [item.id, item]));
      readPalette();
      loadImages(next).then((loaded) => {
        images = loaded;
        draw();
      });
    },
    setHighlight(on) {
      highlight = on;
      draw();
    },
    setActive(on) {
      active = on;
      if (!on) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        report(false);
      } else {
        kick();
      }
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      report(false);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
      canvas.removeEventListener('mousedown', kick);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      Ms.clearSourceEvents(mouse);
      Composite.clear(world, false);
      Eng.clear(engine);
    },
  };
}
