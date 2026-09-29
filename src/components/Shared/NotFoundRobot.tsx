import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/motion';

// The site's orange robot, drawn flat so it can move part by part. It stands in
// the gap of "404" doing keepy-uppy with the missing zero; tapping the zero
// pushes it higher. Heights are in em of the digits, so the scene scales as one.
const GRAVITY = 3.4; // em/s²
const HEADER_V = 1.95; // em/s, the robot's own header (about 0.55em high)
const TAP_V = 1.25; // em/s added per tap
const MAX_V = 2.9; // keeps the zero inside the scene
const EYE_LIFT = 7; // svg units the eyes travel looking up

interface Props {
  onHeader?: (count: number) => void;
}

function NotFoundRobot({ onHeader }: Props) {
  const reduced = useReducedMotion();
  const ballRef = useRef<HTMLButtonElement>(null);
  const torsoRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const armsRef = useRef<[SVGGElement | null, SVGGElement | null]>([null, null]);
  const robotRef = useRef<SVGSVGElement>(null);
  const state = useRef({ y: 0.5, v: 0, spin: 0, omega: 90, lookX: 0, headers: 0 });
  const onHeaderRef = useRef(onHeader);
  onHeaderRef.current = onHeader;
  const [hint, setHint] = useState(true);

  // Eyes follow the pointer sideways, the zero up and down.
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      const box = robotRef.current?.getBoundingClientRect();
      if (!box) return;
      const dx = (e.clientX - (box.left + box.width / 2)) / 260;
      state.current.lookX = Math.max(-1, Math.min(1, dx));
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last = 0;
    const s = state.current;

    const bump = () => {
      const t = torsoRef.current;
      t?.animate(
        [
          { transform: 'translateY(0) scaleY(1)' },
          { transform: 'translateY(4px) scaleY(0.965)', offset: 0.35 },
          { transform: 'translateY(0) scaleY(1)' },
        ],
        { duration: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      );
      armsRef.current.forEach((arm, i) =>
        arm?.animate(
          [
            { transform: 'rotate(0deg)' },
            { transform: `rotate(${i === 0 ? 14 : -14}deg)`, offset: 0.35 },
            { transform: 'rotate(0deg)' },
          ],
          { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        ),
      );
    };

    const frame = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 0;
      last = now;

      s.v -= GRAVITY * dt;
      s.y += s.v * dt;
      s.spin += s.omega * dt;
      if (s.y <= 0 && s.v < 0) {
        s.y = 0;
        s.v = HEADER_V;
        s.omega = (Math.random() < 0.5 ? -1 : 1) * (70 + Math.random() * 90);
        s.headers += 1;
        onHeaderRef.current?.(s.headers);
        bump();
      }

      // A little squash as it meets the head.
      const squash = s.y < 0.04 ? 1 - (0.04 - s.y) * 3 : 1;
      if (ballRef.current) {
        ballRef.current.style.transform =
          `translate3d(0, ${-s.y}em, 0) rotate(${s.spin}deg) scale(${2 - squash}, ${squash})`;
      }
      if (eyesRef.current) {
        const up = Math.min(s.y / 1.2, 1);
        eyesRef.current.style.transform =
          `translate(${s.lookX * 5}px, ${-up * EYE_LIFT + 2}px)`;
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced]);

  const tap = () => {
    if (reduced) return;
    const s = state.current;
    s.v = Math.min(Math.max(s.v, 0) + TAP_V, MAX_V);
    s.omega *= -1.6;
    setHint(false);
  };

  return (
    <span className="nf-slot">
      <button
        ref={ballRef}
        type="button"
        className="nf-ball"
        onClick={tap}
        aria-label="Tap the zero to knock it higher"
        tabIndex={reduced ? -1 : 0}
      >
        <svg viewBox="0 0 100 130" aria-hidden="true">
          <ellipse cx="50" cy="65" rx="35" ry="51" fill="none" stroke="currentColor" strokeWidth="27" />
        </svg>
      </button>

      <svg
        ref={robotRef}
        className="nf-robot"
        viewBox="0 0 200 250"
        aria-hidden="true"
      >
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

      {hint && !reduced && <span className="nf-hint" aria-hidden="true">tap the 0</span>}
    </span>
  );
}

export default NotFoundRobot;
