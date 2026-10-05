import createGlobe from 'cobe';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { config, useClock } from '../../lib/data';
import { usePageVisible, useReducedMotion } from '../../lib/motion';
import { useThemeStore } from '../../store/themeStore';
import CityPhotoStage, { type StagePhoto } from './CityPhotoStage';

interface City {
  id: string;
  name: string;
  lat: number;
  lon: number;
  coords: string;
  headline: string;
  story: string[];
  role: string;
}

const CITIES: City[] = [
  {
    id: 'missao-velha',
    name: 'Missão Velha, Ceará',
    lat: -7.2497,
    lon: -39.1431,
    coords: '7.2497° S, 39.1431° W',
    role: 'Roots',
    headline: 'My grandfather\'s garage.',
    story: [
      'The Cariri valley, in the countryside of Ceará. Waterfalls cut through the rock, Padre Cícero\'s statue watches from the hill, and everyone knows your name before you say it.',
      'My grandparents built their lives here and my father grew up on these streets. I came back every summer, months of 40°C heat, most of them spent handing my grandfather tools in his garage.',
      'It\'s not on any startup map. It\'s where I learned to open things that won\'t start.',
    ],
  },
  {
    id: 'salvador',
    name: 'Salvador, Bahia',
    lat: -12.9747,
    lon: -38.4767,
    coords: '12.9747° S, 38.4767° W',
    role: 'Foundation',
    headline: 'Home for seventeen years.',
    story: [
      'The first capital of Brazil. Pelourinho\'s cobblestones, the Elevador Lacerda over the bay, the gold ceilings of São Francisco, sunset at Farol da Barra.',
      'I got into Colégio Militar at 10, one of 30 out of 2,500 applicants, with a perfect math score. The olympiad run started here: 39 medals in math, physics, chemistry and astronomy.',
      'Projeto Candela was built for the public schools of this city. I still call it home.',
    ],
  },
  {
    id: 'fortaleza',
    name: 'Fortaleza, Ceará',
    lat: -3.7172,
    lon: -38.5433,
    coords: '3.7172° S, 38.5433° W',
    role: 'Acceleration',
    headline: 'Last year of school, far from home.',
    story: [
      'I moved here for my final year of high school at Colégio Ari de Sá Cavalcante, on the ITA/IME track, sharing an apartment with 11 other students. Graduated with a 9.41 average.',
      'That year: SAT 1510, Fundação Estudar PREP (70 picked from 10,000+ applicants), and admission to St Andrews with a Global Merit Scholarship.',
    ],
  },
  {
    id: 'sao-paulo',
    name: 'São Paulo, SP',
    lat: -23.5505,
    lon: -46.6333,
    coords: '23.5505° S, 46.6333° W',
    role: 'Building',
    headline: 'Building HIBEEX.',
    story: [
      'I moved here with Teodoro to build HIBEEX. Deferred university and went all in.',
      'One of 6 startups in the Canastra Ventures AI Residency. We build backoffice AI for small and medium businesses.',
      'I chose this over freshman year at St Andrews. So far, no regrets.',
    ],
  },
];

type PhotoEntry = string | { file: string; position: string };

// Photos in public/background/<cityId>/, in order. `position` is the object-position
// that keeps the action (the people, what they are doing) in the 16:10 card crop;
// it was worked out per photo, so recompute it if the card's aspect ratio changes.
const CITY_PHOTO_MANIFEST: Record<string, PhotoEntry[]> = {
  'missao-velha': [
    { file: '01.webp', position: '50% 74%' }, // family on the rocks at the waterfall
    { file: '02.webp', position: '50% 72%' }, // three kids under the trail gate
    { file: '03.webp', position: '50% 65%' }, // mechanical bull at the fair
    { file: '04.webp', position: '50% 50%' }, // cashew soda close-up
    { file: '05.webp', position: '50% 92%' }, // family at the mud house
    { file: '06.webp', position: '50% 50%' }, // cotton candy at the fair
    { file: '07.webp', position: '50% 62%' }, // car selfie
    { file: '08.webp', position: '50% 56%' }, // big hat at night
    { file: '09.webp', position: '50% 40%' }, // the parrot through the cage
    { file: '10.webp', position: '50% 62%' }, // two kisses for great-grandma
  ],
  'salvador': [
    { file: '01.webp', position: '50% 0%' },  // leaf headband
    { file: '02.webp', position: '50% 59%' }, // up the big tree
    { file: '03.webp', position: '50% 24%' }, // chocolate box
    { file: '04.webp', position: '50% 12%' }, // under the blanket
    { file: '05.webp', position: '50% 48%' }, // festa junina outfit
    { file: '06.webp', position: '50% 62%' }, // sandboarding the dunes
    { file: '07.webp', position: '50% 38%' }, // selfie under the tree
    { file: '08.webp', position: '50% 60%' }, // six on the wicker sofa
    { file: '09.webp', position: '50% 46%' }, // up the wooden climbing frame
    { file: '10.webp', position: '50% 26%' }, // praying with the rosary
    { file: '11.webp', position: '50% 40%' }, // the three brothers at the cinema, as kids
    { file: '12.webp', position: '50% 50%' }, // the same three at the cinema, today
  ],
  'fortaleza': [
    { file: '01.webp', position: '100% 50%' }, // graduation, in front of the banner
    { file: '02.webp', position: '50% 18%' },  // next to the poster
    { file: '03.webp', position: '50% 3%' },   // two grads with their books
    { file: '04.webp', position: '50% 56%' },  // speaking with the mic
    { file: '05.webp', position: '50% 26%' },  // four students at the event
  ],
  'sao-paulo': [
    { file: '01.webp', position: '50% 82%' }, // the team by the night-city window
    { file: '02.webp', position: '50% 52%' }, // at the WOW banner
    { file: '03.webp', position: '50% 0%' },  // at the table
    { file: '04.webp', position: '50% 31%' }, // selfie on the sofa
    { file: '05.webp', position: '50% 44%' }, // the toast
    { file: '06.webp', position: '50% 0%' },  // listening in the audience
  ],
};

function cityPhotos(city: City): StagePhoto[] {
  const entries = CITY_PHOTO_MANIFEST[city.id] ?? [];
  const place = city.name.split(',')[0];
  return entries.map((entry, i) => {
    const { file, position } = typeof entry === 'string'
      ? { file: entry, position: 'center top' }
      : entry;
    return {
      src: `/background/${city.id}/sm/${file}`, // 720px wide: the card is ~330px
      alt: `${place}, photo ${i + 1} of ${entries.length}`,
      position,
    };
  });
}

// The state each city sits in: its outline lights up while the city is open.
const CITY_UF: Record<string, string> = {
  'missao-velha': 'CE',
  salvador: 'BA',
  fortaleza: 'CE',
  'sao-paulo': 'SP',
};

type StateRing = { uf: string; pts: Float64Array };

// Brazil's state borders (simplified IBGE outlines, src/data/brazil-states.json)
// as unit vectors, in the same frame cobe uses for its markers.
function statesToWorld(data: Record<string, number[][][]>): StateRing[] {
  const rings: StateRing[] = [];
  for (const [uf, list] of Object.entries(data)) {
    for (const ring of list) {
      const pts = new Float64Array(ring.length * 3);
      ring.forEach(([lon, lat], i) => {
        const la = (lat * Math.PI) / 180;
        const lo = (lon * Math.PI) / 180 - Math.PI;
        const c = Math.cos(la);
        pts[i * 3] = -c * Math.cos(lo);
        pts[i * 3 + 1] = Math.sin(la);
        pts[i * 3 + 2] = c * Math.sin(lo);
      });
      rings.push({ uf, pts });
    }
  }
  return rings;
}

function locationToAngles(lat: number, lon: number): [number, number] {
  return [
    Math.PI - ((lon * Math.PI) / 180 - Math.PI / 2),
    (lat * Math.PI) / 180,
  ];
}

function GlobeCanvas({
  selected,
  darkMode,
  onPainted,
  onInteract,
}: {
  selected: City | null;
  darkMode?: boolean;
  /** Someone grabbed the globe: the tour stops. */
  onInteract?: () => void;
  /** true once the live globe has drawn real frames; false if its context is lost. */
  onPainted: (painted: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statesRef = useRef<HTMLCanvasElement>(null);
  const highlightRef = useRef<string | null>(null);
  const focusRef = useRef<[number, number] | null>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const pointerMovement = useRef({ x: 0, y: 0 });
  const foldDrag = useRef<(() => void) | null>(null);
  const onPaintedRef = useRef(onPainted);
  onPaintedRef.current = onPainted;

  useEffect(() => {
    foldDrag.current?.();
    focusRef.current = selected ? locationToAngles(selected.lat, selected.lon) : null;
    highlightRef.current = selected ? CITY_UF[selected.id] ?? null : null;
  }, [selected]);

  const onInteractRef = useRef(onInteract);
  onInteractRef.current = onInteract;
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    pointerMovement.current = { x: 0, y: 0 };
    // Dragging stops the tour; on release the globe eases back to the open city.
    onInteractRef.current?.();
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let globe: ReturnType<typeof createGlobe> | null = null;
    const [brazilPhi] = locationToAngles(-10, -38.5);
    let currentPhi = brazilPhi;
    let currentTheta = 0.12;
    // Zoom: the sphere grows a little past the circular canvas while a city is
    // open. Kept mild so the globe still reads as a globe and the other three
    // cities (about 20° apart) stay in view around the open one.
    let currentScale = 1;
    // The poster stays until cobe has actually drawn: a few frames, not a timer.
    let frames = 0;
    const overlay = statesRef.current;
    const reveal = () => {
      if (canvas) canvas.style.opacity = '1';
      if (overlay) overlay.style.opacity = '1';
      onPaintedRef.current(true);
    };
    const onLost = () => {
      canvas.style.opacity = '0';
      if (overlay) overlay.style.opacity = '0';
      onPaintedRef.current(false);
    };

    // ── State borders, drawn on a 2D layer over the globe ──
    // Same projection as cobe's shader: a unit vector P is turned by the matrix
    // J(theta, phi) and lands at 0.8 * scale of the half-width; only the side
    // facing us (z > 0) is drawn.
    let states: StateRing[] = [];
    import('../../data/brazil-states.json').then((m) => {
      states = statesToWorld(m.default as Record<string, number[][][]>);
    });
    const octx = overlay?.getContext('2d') ?? null;
    const glow: Record<string, number> = {}; // per-state highlight, eased 0..1
    const line = darkMode ? 'rgba(255, 236, 220, 0.3)' : 'rgba(70, 45, 30, 0.32)';
    const drawStates = (phi: number, theta: number, scale: number) => {
      if (!overlay || !octx || states.length === 0) return;
      const cssW = canvas.offsetWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (overlay.width !== Math.round(cssW * dpr)) {
        overlay.width = Math.round(cssW * dpr);
        overlay.height = Math.round(cssW * dpr);
      }
      const W = overlay.width;
      const c = Math.cos(theta), e = Math.sin(theta), d = Math.cos(phi), f = Math.sin(phi);
      const k = 0.8 * scale * (W / 2);
      const hi = highlightRef.current;
      octx.clearRect(0, 0, W, W);
      octx.lineJoin = 'round';
      for (const { uf, pts } of states) {
        const target = uf === hi ? 1 : 0;
        const g = (glow[uf] ?? 0) + (target - (glow[uf] ?? 0)) * 0.08;
        glow[uf] = g;
        octx.beginPath();
        let pen = false;
        let allFront = true;
        for (let i = 0; i < pts.length; i += 3) {
          const x = pts[i], y = pts[i + 1], z = pts[i + 2];
          const lz = -f * c * x + e * y + d * c * z;
          if (lz <= 0) { pen = false; allFront = false; continue; }
          const sx = W / 2 + k * (d * x + f * z);
          const sy = W / 2 - k * (f * e * x + c * y - d * e * z);
          if (pen) octx.lineTo(sx, sy);
          else { octx.moveTo(sx, sy); pen = true; }
        }
        if (g > 0.01 && allFront) {
          octx.closePath();
          octx.fillStyle = `rgba(240, 115, 45, ${0.3 * g})`;
          octx.fill();
          octx.strokeStyle = `rgba(240, 115, 45, ${0.35 + 0.6 * g})`;
          octx.lineWidth = (1 + 1.2 * g) * dpr;
        } else {
          octx.strokeStyle = line;
          octx.lineWidth = 0.8 * dpr;
        }
        octx.stroke();
      }
    };
    canvas.addEventListener('webglcontextlost', onLost);
    const FOCUS_SCALE = 1.3;
    const doublePi = Math.PI * 2;
    const clampTheta = (t: number) => Math.max(-1.35, Math.min(1.35, t));

    foldDrag.current = () => {
      currentPhi += pointerMovement.current.x / 100;
      currentTheta = clampTheta(currentTheta + pointerMovement.current.y / 150);
      pointerMovement.current = { x: 0, y: 0 };
      pointerInteracting.current = null;
    };

    const onMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        pointerMovement.current = {
          x: e.clientX - pointerInteracting.current.x,
          y: e.clientY - pointerInteracting.current.y,
        };
      }
    };
    const onUp = () => {
      if (pointerInteracting.current !== null) foldDrag.current?.();
      if (canvas) canvas.style.cursor = 'grab';
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });

    let isInView = true;

    const init = () => {
      const size = canvas.offsetWidth;
      if (size === 0 || globe) return;

      const isMobileDevice = window.innerWidth < 768;
      globe = createGlobe(canvas, {
        devicePixelRatio: isMobileDevice ? 1.5 : 2,
        width: size * (isMobileDevice ? 1.5 : 2),
        height: size * (isMobileDevice ? 1.5 : 2),
        phi: brazilPhi,
        theta: 0.12,
        dark: darkMode ? 1 : 0,
        diffuse: 1.5,
        mapSamples: isMobileDevice ? 8000 : 16000,
        mapBrightness: darkMode ? 6 : 9,
        baseColor: darkMode ? [0.2, 0.15, 0.12] : [1, 1, 1],
        markerColor: [240 / 255, 115 / 255, 45 / 255],
        glowColor: darkMode ? [0.3, 0.17, 0.1] : [0.98, 0.95, 0.92],
        markers: CITIES.map((c) => ({ location: [c.lat, c.lon], size: 0.06 })),
        onRender: (state) => {
          if (++frames === 3) reveal();
          const focus = focusRef.current;
          const dragX = pointerMovement.current.x / 100;
          const dragY = pointerMovement.current.y / 150;

          // Markers are set once at creation, never through `state`: cobe counts
          // markers passed here at half their number, so two of the four vanished.
          currentScale += ((focus ? FOCUS_SCALE : 1) - currentScale) * 0.06;
          state.scale = currentScale;

          if (focus) {
            const [focusPhi, focusTheta] = focus;
            const distPositive = (focusPhi - currentPhi + doublePi) % doublePi;
            const distNegative = (currentPhi - focusPhi + doublePi) % doublePi;
            if (distPositive < distNegative) {
              currentPhi += distPositive * 0.08;
            } else {
              currentPhi -= distNegative * 0.08;
            }
            currentTheta = currentTheta * 0.92 + focusTheta * 0.08;
          } else if (pointerInteracting.current === null) {
            const BASE_SPEED = 0.0132;
            const SLOW_RADIUS = 0.35;
            const normPhi = ((currentPhi % doublePi) + doublePi) % doublePi;
            let minDist = Infinity;
            for (const cityPhi of CITY_PHIS) {
              const d = Math.min(
                Math.abs(normPhi - cityPhi),
                doublePi - Math.abs(normPhi - cityPhi)
              );
              if (d < minDist) minDist = d;
            }
            const speedMult = minDist < SLOW_RADIUS ? 0.2 + 0.8 * (minDist / SLOW_RADIUS) : 1;
            currentPhi += BASE_SPEED * speedMult;
            // Keep Brazil in view: gently pull theta back to ~0.12
            currentTheta = currentTheta * 0.995 + 0.12 * 0.005;
          }

          state.phi = currentPhi + dragX;
          state.theta = clampTheta(currentTheta + dragY);
          drawStates(state.phi, state.theta, currentScale);
          const w = canvas.offsetWidth || size;
          state.width = w * 2;
          state.height = w * 2;
        },
      });
      // The observer may already have reported us off-screen before this ran
      globe.toggle(isInView);
    };

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) { ro.disconnect(); init(); }
      });
      ro.observe(canvas);
    }

    // cobe spins on its own rAF forever. Park it while the section is off-screen.
    const io = new IntersectionObserver(
      ([e]) => {
        isInView = e.isIntersecting;
        globe?.toggle(isInView);
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    return () => {
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('webglcontextlost', onLost);
      if (globe) globe.destroy();
    };
  }, [darkMode]);

  return (
    <>
      <canvas ref={canvasRef} className="globe-canvas" onPointerDown={onPointerDown} aria-hidden="true" />
      <canvas ref={statesRef} className="globe-states" aria-hidden="true" />
    </>
  );
}

const CITY_TZ: Record<string, string> = Object.fromEntries(
  config.cities.map((c) => [c.id, c.tz]),
);

// Mounted only while the section is on screen: the shared clock ticks once a second.
function CityClock({ tz }: { tz: string }) {
  const { hhmm } = useClock(tz);
  return <>{hhmm} local</>;
}

function CityPanel({
  city,
  onClose,
  onStep,
  showClock,
}: {
  city: City;
  onClose: () => void;
  /** Move to the previous (-1) or next (+1) city of the journey. */
  onStep: (dir: -1 | 1) => void;
  showClock: boolean;
}) {
  const reduced = useReducedMotion();
  const index = CITIES.findIndex((c) => c.id === city.id);
  const prev = CITIES[(index - 1 + CITIES.length) % CITIES.length];
  const next = CITIES[(index + 1) % CITIES.length];

  return (
    <motion.div
      className="city-panel"
      initial={reduced ? false : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? { opacity: 1 } : { opacity: 0, x: 20 }}
      transition={{ duration: reduced ? 0 : 0.35, ease: 'easeOut' }}
    >
      <button type="button" className="city-panel__close" onClick={onClose} aria-label="Close">✕</button>

      <div className="city-panel__text">
        <div className="city-panel__meta">
          <p className="city-panel__location">{city.name}</p>
          <span className="city-panel__coords">{city.coords}</span>
          {/* The local time with previous / next city right beside it; they wrap as one. */}
          <span className="city-panel__steps">
            <span className="city-panel__time">
              {showClock && <CityClock tz={CITY_TZ[city.id] ?? config.location.tz} />}
            </span>
            <button
              type="button"
              className="city-panel__arrow"
              onClick={() => onStep(-1)}
              aria-label={`Previous city: ${prev.name.split(',')[0]}`}
              title={prev.name.split(',')[0]}
            >
              <FiArrowLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className="city-panel__arrow"
              onClick={() => onStep(1)}
              aria-label={`Next city: ${next.name.split(',')[0]}`}
              title={next.name.split(',')[0]}
            >
              <FiArrowRight aria-hidden="true" />
            </button>
          </span>
        </div>
        <h3 className="city-panel__headline">{city.headline}</h3>
        {city.story.map((para, i) => (
          <p key={i} className="city-panel__para">{para}</p>
        ))}
      </div>
    </motion.div>
  );
}

// Horizontal city timeline
function CityTimeline({ selected, onSelect, autoplay }: { selected: City | null; onSelect: (c: City) => void; autoplay: boolean }) {
  return (
    <div className="city-timeline">
      <div className="city-timeline__track">
        {CITIES.map((city, i) => (
          <div key={city.id} className="city-timeline__stop">
            {i > 0 && <div className="city-timeline__line" />}
            <button
              className={`city-timeline__dot ${selected?.id === city.id ? 'city-timeline__dot--active' : ''}`}
              onClick={() => onSelect(city)}
              aria-label={city.name}
            >
              <span className="city-timeline__dot-inner" />
              {autoplay && selected?.id === city.id && (
                <span key={city.id} className="city-timeline__dot-progress" aria-hidden="true" />
              )}
            </button>
            <div className="city-timeline__label">
              <span className="city-timeline__city">{city.name.split(',')[0]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CITY_PHIS = CITIES.map((c) => locationToAngles(c.lat, c.lon)[0]);

const skipGlobe =
  typeof window !== 'undefined' && window.innerWidth < 768;


function BackgroundGlobe() {
  // The first city is selected from the start: the text is in the DOM before any
  // scrolling, observer or WebGL context.
  const [selected, setSelected] = useState<City | null>(CITIES[0]);
  const [pinned, setPinned] = useState(false); // a click stops the tour
  // Paused while focus is inside the section: the tour must never pull a photo
  // or a button out from under a keyboard (WCAG 2.2.2). Pointing at the photos
  // holds them too (CityPhotoStage).
  const [focusInside, setFocusInside] = useState(false);
  const held = focusInside;
  const [inView, setInView] = useState(false);
  const [globePainted, setGlobePainted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { darkMode } = useThemeStore();
  const reduced = useReducedMotion();
  const pageVisible = usePageVisible();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onPainted = useCallback((painted: boolean) => setGlobePainted(painted), []);
  const stagePhotos = useMemo(() => (selected ? cityPhotos(selected) : []), [selected]);
  const pinTour = useCallback(() => setPinned(true), []);

  // Guided tour: the open city pages through its photos, and after the last
  // one the next city opens. Runs only while the section is on screen, the tab
  // is visible and nobody has taken over; reduced motion keeps it still.
  const touring = inView && !pinned && !held && !reduced && pageVisible;
  const nextCity = useCallback(() => {
    setSelected((prev) => CITIES[(CITIES.findIndex((c) => c.id === prev?.id) + 1) % CITIES.length]);
  }, []);

  const handleSelect = (city: City) => {
    setPinned(true);
    setSelected(selected?.id === city.id ? null : city);
  };

  const handleStep = (dir: -1 | 1) => {
    setPinned(true);
    setSelected((prev) => {
      const i = CITIES.findIndex((c) => c.id === prev?.id);
      return CITIES[(i + dir + CITIES.length) % CITIES.length];
    });
  };

  const handleClose = () => {
    setPinned(true);
    setSelected(null);
  };

  return (
    <div
      className="background-section"
      id="background"
      ref={sectionRef}
      onFocus={() => setFocusInside(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusInside(false); }}
    >
      <h2 className="heading section-title" data-color-inverted="true">
        Where I Come <em>From</em>
      </h2>

      <div className={`globe-layout ${selected ? 'globe-layout--open' : ''}`}>
        {/* ── Globe column ── */}
        {!skipGlobe && (
          <div className="globe-column">
            <div className="globe-wrap">
              {/* Static poster first; the live globe fades in over it once it paints. */}
              <img
                className="globe-poster"
                src={darkMode ? '/background/globe-poster-dark.webp' : '/background/globe-poster.webp'}
                alt=""
                width={480}
                height={480}
                loading="lazy"
                decoding="async"
                aria-hidden="true"
                data-hidden={globePainted ? 'true' : undefined}
              />
              {!reduced && (
                <GlobeCanvas selected={selected} darkMode={darkMode} onPainted={onPainted} onInteract={pinTour} />
              )}
            </div>
          </div>
        )}

        {/* ── Right column: the city's story, its photos right under it ── */}
        {selected && (
          <div className="city-column">
            <div className="city-column__text">
              {/* Invisible copies of every city's text share the cell, so the box
                  is always as tall as the longest one and the photos below never
                  jump when the tour changes city */}
              {CITIES.map((c) => (
                <div key={c.id} className="city-panel city-panel--sizer" aria-hidden="true">
                  <div className="city-panel__text">
                    <div className="city-panel__meta">
                      <p className="city-panel__location">{c.name}</p>
                      <span className="city-panel__coords">{c.coords}</span>
                      <span className="city-panel__steps">
                        <span className="city-panel__time">00:00 local</span>
                        <span className="city-panel__arrow" />
                        <span className="city-panel__arrow" />
                      </span>
                    </div>
                    <h3 className="city-panel__headline">{c.headline}</h3>
                    {c.story.map((para, i) => (
                      <p key={i} className="city-panel__para">{para}</p>
                    ))}
                  </div>
                </div>
              ))}
              <AnimatePresence initial={false}>
                <CityPanel
                  key={selected.id}
                  city={selected}
                  onClose={handleClose}
                  onStep={handleStep}
                  showClock={inView}
                />
              </AnimatePresence>
            </div>
            <CityPhotoStage
              key={selected.id}
              label={selected.name.split(',')[0]}
              photos={stagePhotos}
              onInteract={pinTour}
              autoplay={touring}
              onEnd={nextCity}
            />
          </div>
        )}
      </div>

      {/* ── Horizontal timeline ── */}
      <CityTimeline
        selected={selected}
        onSelect={handleSelect}
        autoplay={touring}
      />
    </div>
  );
}

export default BackgroundGlobe;
