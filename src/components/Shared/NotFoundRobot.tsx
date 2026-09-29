import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/motion';

// The site's orange robot stands in the gap of "404" doing keepy-uppy with the
// missing zero. The zero is a real toy: grab it, throw it, bounce it off the fours
// and the floor, tap it higher. When it lands anywhere but the robot's head, the
// robot calls it back. All physics constants are in units of the digits' size (F),
// so the scene behaves the same at every size.
const G = 3.4;          // gravity, F/s²
const HEADER_V = 1.95;  // the robot's own header
const TAP_V = 1.25;     // added per tap
const MAX_THROW = 7;    // cap on a flung zero, F/s
const BOUNCE = 0.62;    // restitution on the fours, walls and floor
const REST_MS = 700;    // lying still this long means "call it back"
const RECALL_MS = 850;

// Drawing proportions (robot viewBox is 200×250, drawn 0.8F tall).
const ROBOT_H = 0.8;
const HEAD_TOP = ROBOT_H * (230 / 250); // vent top above the baseline
const BALL_RX = 0.165;
const BALL_RY = 0.215;
const BALL_R = 0.19;    // collision radius
const CAP = 0.7;        // DM Sans cap height: top of the fours

interface Box { x0: number; x1: number; y0: number; y1: number; kind: 'four' | 'robot'; el?: HTMLElement }

interface Props {
  onScore?: (streak: number, best: number) => void;
}

// The playground is the zero's positioned ancestor (the 404 page). Read it from
// the DOM: a parent's ref is not attached yet when this component's layout effect runs.
const containerOf = (el: HTMLElement | null) => (el?.offsetParent as HTMLElement | null) ?? null;

function NotFoundRobot({ onScore }: Props) {
  const reduced = useReducedMotion();
  const sceneRef = useRef<HTMLParagraphElement>(null);
  const slotRef = useRef<HTMLSpanElement>(null);
  const fourRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const ballRef = useRef<HTMLButtonElement>(null);
  const torsoRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const armsRef = useRef<[SVGGElement | null, SVGGElement | null]>([null, null]);
  const [hint, setHint] = useState(true);
  const onScoreRef = useRef(onScore);
  onScoreRef.current = onScore;

  // World, in px relative to the container. Rebuilt on resize.
  const world = useRef({ F: 100, w: 0, h: 0, cx: 0, base: 0, boxes: [] as Box[] });
  const ball = useRef({
    x: 0, y: 0, vx: 0, vy: 0, spin: 0, omega: 80, squash: 0,
    held: false, grabDX: 0, grabDY: 0, samples: [] as { t: number; x: number; y: number }[],
    downAt: 0, downX: 0, downY: 0, keptVX: 0, keptVY: 0,
    restSince: 0, recall: null as null | { t0: number; x0: number; y0: number },
    streak: 0, best: 0, lastT: 0,
  });

  const restPoint = () => {
    const { cx, base, F } = world.current;
    return { x: cx, y: base - HEAD_TOP * F - BALL_RY * F };
  };

  const measure = useCallback(() => {
    const c = containerOf(ballRef.current), slot = slotRef.current, scene = sceneRef.current;
    if (!c || !slot || !scene) return;
    const m = c.getBoundingClientRect();
    const F = parseFloat(getComputedStyle(scene).fontSize);
    const s = slot.getBoundingClientRect();
    const cx = s.left + s.width / 2 - m.left;
    const base = s.bottom - m.top;
    const boxes: Box[] = [];
    fourRefs.current.forEach((el) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      boxes.push({ x0: r.left - m.left + 0.03 * F, x1: r.right - m.left - 0.03 * F, y0: base - CAP * F, y1: base, kind: 'four', el });
    });
    // Head (the vent) and body.
    boxes.push({ x0: cx - 0.13 * F, x1: cx + 0.13 * F, y0: base - HEAD_TOP * F, y1: base, kind: 'robot' });
    boxes.push({ x0: cx - 0.21 * F, x1: cx + 0.21 * F, y0: base - 0.6 * F, y1: base, kind: 'robot' });
    world.current = { F, w: m.width, h: m.height, cx, base, boxes };
  }, []);

  const place = useCallback(() => {
    const b = ball.current, el = ballRef.current;
    if (!el) return;
    const { F } = world.current;
    const sq = b.squash;
    el.style.transform =
      `translate3d(${b.x - BALL_RX * F}px, ${b.y - BALL_RY * F}px, 0) rotate(${b.spin}deg) scale(${1 + sq}, ${1 - sq})`;
  }, []);

  // First paint: the zero already sits on the robot's head.
  useLayoutEffect(() => {
    measure();
    const p = restPoint();
    Object.assign(ball.current, { x: p.x, y: p.y - (reduced ? 0 : 0.4 * world.current.F), vx: 0, vy: 0 });
    place();
    const ro = new ResizeObserver(() => {
      const before = restPoint();
      measure();
      const after = restPoint();
      ball.current.x += after.x - before.x;
      ball.current.y += after.y - before.y;
      place();
    });
    const c = containerOf(ballRef.current);
    if (c) ro.observe(c);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, place, reduced]);

  const bump = () => {
    torsoRef.current?.animate(
      [
        { transform: 'translateY(0) scaleY(1)' },
        { transform: 'translateY(4px) scaleY(0.965)', offset: 0.35 },
        { transform: 'translateY(0) scaleY(1)' },
      ],
      { duration: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  };

  const wobble = (el: HTMLElement | undefined, dir: number) => {
    el?.animate(
      [
        { transform: 'rotate(0deg)' },
        { transform: `rotate(${dir * 5}deg)`, offset: 0.3 },
        { transform: `rotate(${-dir * 2.5}deg)`, offset: 0.65 },
        { transform: 'rotate(0deg)' },
      ],
      { duration: 520, easing: 'ease-out' },
    );
  };

  const report = () => onScoreRef.current?.(ball.current.streak, ball.current.best);

  // The loop.
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const b = ball.current;

    const collide = (now: number) => {
      const { F, w, base, boxes, cx } = world.current;
      const r = BALL_R * F;
      let touching = false;

      // Walls and floor.
      if (b.x < r) { b.x = r; b.vx = Math.abs(b.vx) * BOUNCE; }
      if (b.x > w - r) { b.x = w - r; b.vx = -Math.abs(b.vx) * BOUNCE; }
      if (b.y < r) { b.y = r; b.vy = Math.abs(b.vy) * BOUNCE; }
      if (b.y > base - r) {
        const impact = b.vy;
        b.y = base - r;
        b.vy = -Math.abs(b.vy) * BOUNCE;
        if (Math.abs(b.vy) < 0.35 * F) b.vy = 0;
        b.vx *= 0.8;
        b.omega = (b.vx / F) * 90; // rolls instead of spinning in place
        touching = true;
        if (impact > 0.8 * F) { b.squash = Math.min(0.22, impact / (10 * F)); drop(); }
      }

      for (const box of boxes) {
        const px = Math.max(box.x0, Math.min(b.x, box.x1));
        const py = Math.max(box.y0, Math.min(b.y, box.y1));
        const dx = b.x - px, dy = b.y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 >= r * r) continue;
        const d = Math.sqrt(d2) || 0.0001;
        const nx = d2 ? dx / d : 0, ny = d2 ? dy / d : -1;
        b.x = px + nx * r;
        b.y = py + ny * r;
        const vn = b.vx * nx + b.vy * ny;

        if (box.kind === 'robot' && ny < -0.5) {
          // On the head: header, nudged back toward the middle.
          b.vy = -HEADER_V * F;
          b.vx = (cx - b.x) * 2.4 + (Math.random() - 0.5) * 0.12 * F;
          b.omega = (Math.random() < 0.5 ? -1 : 1) * (70 + Math.random() * 90);
          b.squash = 0.12;
          b.streak += 1;
          b.best = Math.max(b.best, b.streak);
          report();
          bump();
          return false;
        }
        if (vn < 0) {
          b.vx -= (1 + BOUNCE) * vn * nx;
          b.vy -= (1 + BOUNCE) * vn * ny;
          b.omega += b.vx / F * 40;
          if (-vn > 0.9 * F) {
            b.squash = Math.min(0.2, -vn / (10 * F));
            if (box.kind === 'four') { wobble(box.el, nx >= 0 ? 1 : -1); drop(); }
          }
        }
        if (ny < -0.5) {
          touching = true;
          if (Math.abs(b.vy) < 0.25 * F) b.vy = 0;
          b.vx *= 0.92;
        }
      }
      void now;
      return touching;
    };

    const drop = () => {
      if (b.streak > 0) { b.streak = 0; report(); }
    };

    const frame = (now: number) => {
      const dt = b.lastT ? Math.min((now - b.lastT) / 1000, 1 / 30) : 0;
      b.lastT = now;
      const { F } = world.current;

      if (b.recall) {
        const t = Math.min((now - b.recall.t0) / RECALL_MS, 1);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const p = restPoint();
        const tx = p.x, ty = p.y - 0.45 * F;
        const mx = (b.recall.x0 + tx) / 2, my = Math.min(b.recall.y0, ty) - 0.9 * F;
        b.x = (1 - e) * (1 - e) * b.recall.x0 + 2 * (1 - e) * e * mx + e * e * tx;
        b.y = (1 - e) * (1 - e) * b.recall.y0 + 2 * (1 - e) * e * my + e * e * ty;
        b.spin += 360 * dt;
        if (t >= 1) { b.recall = null; b.vx = 0; b.vy = 0; }
      } else if (!b.held) {
        b.vy += G * F * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.spin += b.omega * dt;
        const resting = collide(now) && Math.hypot(b.vx, b.vy) < 0.2 * F;
        if (resting) {
          if (!b.restSince) b.restSince = now;
          else if (now - b.restSince > REST_MS) {
            b.recall = { t0: now, x0: b.x, y0: b.y };
            b.restSince = 0;
          }
        } else {
          b.restSince = 0;
        }
      }
      b.squash *= Math.pow(0.001, dt * 4);
      place();

      // The robot watches the zero, and reaches for it while someone holds it.
      const { cx, base } = world.current;
      const lookX = Math.max(-1, Math.min(1, (b.x - cx) / (2.5 * F)));
      const lookY = Math.max(-1, Math.min(1, (b.y - (base - HEAD_TOP * F)) / (1.2 * F)));
      if (eyesRef.current) eyesRef.current.style.transform = `translate(${lookX * 6}px, ${lookY * 6 + 1}px)`;
      armsRef.current.forEach((arm, i) => {
        if (!arm) return;
        const target = b.held ? (i === 0 ? 38 : -38) : 0;
        const cur = Number(arm.dataset.a || 0);
        const next = cur + (target - cur) * Math.min(1, dt * 10);
        arm.dataset.a = String(next);
        if (!arm.getAnimations().length) arm.style.transform = `rotate(${next}deg)`;
      });

      raf = requestAnimationFrame(frame);
    };

    const start = () => { if (!raf) { b.lastT = 0; raf = requestAnimationFrame(frame); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const onVis = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener('visibilitychange', onVis);
    return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, place]);

  // ── Grab, throw, tap ──
  const toLocal = (e: { clientX: number; clientY: number }) => {
    const m = containerOf(ballRef.current)!.getBoundingClientRect();
    return { x: e.clientX - m.left, y: e.clientY - m.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (reduced || !containerOf(ballRef.current)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const b = ball.current, p = toLocal(e);
    Object.assign(b, {
      held: true, recall: null, restSince: 0,
      grabDX: b.x - p.x, grabDY: b.y - p.y,
      downAt: performance.now(), downX: p.x, downY: p.y,
      keptVX: b.vx, keptVY: b.vy,
      samples: [{ t: performance.now(), x: b.x, y: b.y }],
    });
    setHint(false);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const b = ball.current;
    if (!b.held) return;
    const { F, w, base } = world.current;
    const p = toLocal(e);
    const r = BALL_R * F;
    b.x = Math.max(r, Math.min(w - r, p.x + b.grabDX));
    b.y = Math.max(r, Math.min(base - r, p.y + b.grabDY));
    const now = performance.now();
    b.samples.push({ t: now, x: b.x, y: b.y });
    while (b.samples.length > 2 && now - b.samples[0].t > 90) b.samples.shift();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const b = ball.current;
    if (!b.held) return;
    b.held = false;
    const { F } = world.current;
    const p = toLocal(e);
    const moved = Math.hypot(p.x - b.downX, p.y - b.downY);
    if (moved < 6 && performance.now() - b.downAt < 300) {
      // A tap: keep flying, just higher.
      b.vx = b.keptVX;
      b.vy = Math.min(b.keptVY, 0) - TAP_V * F;
      b.omega *= -1.6;
      return;
    }
    const first = b.samples[0], last = b.samples[b.samples.length - 1];
    const dt = Math.max((last.t - first.t) / 1000, 0.016);
    let vx = (last.x - first.x) / dt, vy = (last.y - first.y) / dt;
    const sp = Math.hypot(vx, vy), cap = MAX_THROW * F;
    if (sp > cap) { vx *= cap / sp; vy *= cap / sp; }
    b.vx = vx; b.vy = vy;
    b.omega = vx / F * 60;
    if (b.streak) { b.streak = 0; report(); }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (reduced) return;
    const b = ball.current, { F } = world.current;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.recall = null; b.vy = Math.min(b.vy, 0) - TAP_V * F; }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); b.recall = null; b.vx -= 1.2 * F; b.vy -= 0.6 * F; }
    else if (e.key === 'ArrowRight') { e.preventDefault(); b.recall = null; b.vx += 1.2 * F; b.vy -= 0.6 * F; }
    else return;
    setHint(false);
  };

  return (
    <>
      <p className="nf-digits" ref={sceneRef} aria-label="404">
        <span className="nf-digit" aria-hidden="true" ref={(el) => { fourRefs.current[0] = el; }}>4</span>
        <span className="nf-slot" ref={slotRef} aria-hidden="true">
          <svg className="nf-robot" viewBox="0 0 200 250">
            {/* legs */}
            <g className="nf-robot__metal">
              {[0, 1, 2, 3].map((k) => (
                <g key={k}>
                  <rect x="50" y={188 + k * 11} width="20" height="9" rx="3" />
                  <rect x="130" y={188 + k * 11} width="20" height="9" rx="3" />
                </g>
              ))}
            </g>
            <path className="nf-robot__dark" d="M42 246 L48 232 H72 L78 246 Z M122 246 L128 232 H152 L158 246 Z" />

            <g ref={torsoRef} className="nf-robot__torso">
              {/* arms, behind the body */}
              <g ref={(el) => { armsRef.current[0] = el; }} className="nf-robot__arm nf-robot__arm--left">
                <rect className="nf-robot__metal" x="12" y="120" width="34" height="30" rx="6" />
                <rect className="nf-robot__dark" x="21" y="150" width="16" height="8" rx="3" />
                <rect className="nf-robot__metal" x="20" y="160" width="18" height="8" rx="3" />
                <rect className="nf-robot__metal" x="20" y="170" width="18" height="8" rx="3" />
                <path className="nf-robot__dark" d="M16 180 H42 L38 194 H34 L32 186 H26 L24 194 H20 Z" />
              </g>
              <g ref={(el) => { armsRef.current[1] = el; }} className="nf-robot__arm nf-robot__arm--right">
                <rect className="nf-robot__metal" x="154" y="120" width="34" height="30" rx="6" />
                <rect className="nf-robot__dark" x="163" y="150" width="16" height="8" rx="3" />
                <rect className="nf-robot__metal" x="162" y="160" width="18" height="8" rx="3" />
                <rect className="nf-robot__metal" x="162" y="170" width="18" height="8" rx="3" />
                <path className="nf-robot__dark" d="M158 180 H184 L180 194 H176 L174 186 H168 L166 194 H162 Z" />
              </g>

              {/* head vent */}
              <rect className="nf-robot__metal" x="76" y="12" width="4" height="12" rx="2" />
              <rect className="nf-robot__metal" x="120" y="12" width="4" height="12" rx="2" />
              <rect className="nf-robot__shell" x="64" y="20" width="72" height="38" rx="9" />
              {[0, 1, 2, 3, 4].map((k) => (
                <rect key={k} className="nf-robot__metal" x={73 + k * 11} y="27" width="6" height="24" rx="3" />
              ))}
              <rect className="nf-robot__dark" x="60" y="56" width="80" height="7" rx="3" />

              {/* body */}
              <rect className="nf-robot__shell" x="38" y="60" width="124" height="128" rx="18" />
              <rect className="nf-robot__shade" x="148" y="66" width="10" height="116" rx="5" />
              {[[52, 74], [148, 74], [52, 142], [148, 142]].map(([cx, cy]) => (
                <circle key={`${cx}-${cy}`} className="nf-robot__metal" cx={cx} cy={cy} r="3.5" />
              ))}

              {/* visor and eyes */}
              <circle cx="100" cy="106" r="37" className="nf-robot__visor" />
              <g ref={eyesRef}>
                <g className="nf-robot__blink">
                  <rect x="85" y="98" width="9" height="17" rx="4.5" fill="#fff" />
                  <rect x="106" y="98" width="9" height="17" rx="4.5" fill="#fff" />
                </g>
              </g>

              {/* belly */}
              <rect className="nf-robot__metal" x="48" y="150" width="10" height="30" rx="5" />
              <rect className="nf-robot__metal" x="142" y="150" width="10" height="30" rx="5" />
              <rect className="nf-robot__metal" x="70" y="152" width="60" height="34" rx="7" />
              <rect className="nf-robot__light" x="78" y="159" width="44" height="8" rx="4" />
              <rect className="nf-robot__light" x="78" y="171" width="44" height="8" rx="4" />
            </g>
          </svg>
          {hint && !reduced && <span className="nf-hint">grab, throw or tap the 0</span>}
        </span>
        <span className="nf-digit" aria-hidden="true" ref={(el) => { fourRefs.current[1] = el; }}>4</span>
      </p>

      <button
        ref={ballRef}
        type="button"
        className="nf-ball"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        aria-label="The missing zero. Press Enter to knock it up, arrow keys to push it."
        tabIndex={reduced ? -1 : 0}
      >
        <svg viewBox="0 0 100 130" aria-hidden="true">
          <ellipse cx="50" cy="65" rx="35" ry="51" fill="none" stroke="currentColor" strokeWidth="27" />
        </svg>
      </button>
    </>
  );
}

export default NotFoundRobot;
