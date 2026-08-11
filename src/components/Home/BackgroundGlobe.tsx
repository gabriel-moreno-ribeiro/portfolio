import createGlobe from 'cobe';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import AccordionGallery from '../ReactBits/AccordionGallery';

interface City {
  id: string;
  name: string;
  lat: number;
  lon: number;
  headline: string;
  story: string[];
  period: string;   // shown in the horizontal timeline
  role: string;     // one-line label for timeline chip
}

const CITIES: City[] = [
  {
    id: 'missao-velha',
    name: 'Missão Velha, Ceará',
    lat: -7.2497,
    lon: -39.1431,
    period: 'Every summer',
    role: 'Where the roots are',
    headline: 'Where the roots are.',
    story: [
      'Small city in the interior of Ceará. My grandparents are from here. My father grew up here.',
      'Every summer — 4 or 5 months. The heat. Everyone knowing each other by name.',
      "Not the kind of place that shows up on maps of Brazilian ambition. But it's where mine started.",
    ],
  },
  {
    id: 'salvador',
    name: 'Salvador, Bahia',
    lat: -12.9747,
    lon: -38.4767,
    period: 'Age 0 – 17',
    role: 'Where I grew up',
    headline: 'Where I grew up.',
    story: [
      'Grew up here. Got into Colégio Militar at 10 — one of 30 from 2,500 applicants. Perfect score in math.',
      'The olympiads started here. I built Projeto Candela for schools in this city.',
      'Still call it home.',
    ],
  },
  {
    id: 'fortaleza',
    name: 'Fortaleza, Ceará',
    lat: -3.7172,
    lon: -38.5433,
    period: '2024 – 2025',
    role: 'Third year of high school',
    headline: 'Third year — new city.',
    story: [
      'Third year of high school. Moved closer to family.',
      'SAT 1510. Got into Fundação Estudar PREP. The year things started moving fast.',
    ],
  },
  {
    id: 'sao-paulo',
    name: 'São Paulo, SP',
    lat: -23.5505,
    lon: -46.6333,
    period: '2025 – present',
    role: 'Building HIBEEX',
    headline: 'Building HIBEEX.',
    story: [
      'Moved here with Teodoro to build HIBEEX.',
      'One of 6 startups in the Canastra Ventures AI Residency.',
      'Chose this over freshman year. No regrets.',
    ],
  },
];

// Static manifest of photos that actually exist in public/background/<cityId>/.
// Each entry can be a filename string or {file, position} for object-position hints.
type PhotoEntry = string | { file: string; position: string };

const CITY_PHOTO_MANIFEST: Record<string, PhotoEntry[]> = {
  'missao-velha': ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg', '07.jpg', '08.jpg'],
  'salvador':     ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg'],
  // 'fortaleza': [],  // no photos uploaded yet
  // 'sao-paulo': [],  // no photos uploaded yet
};

function locationToAngles(lat: number, lon: number): [number, number] {
  return [
    Math.PI - ((lon * Math.PI) / 180 - Math.PI / 2),
    (lat * Math.PI) / 180,
  ];
}

function GlobeCanvas({ selected, darkMode }: { selected: City | null; darkMode?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const focusRef = useRef<[number, number] | null>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const pointerMovement = useRef({ x: 0, y: 0 });
  const foldDrag = useRef<(() => void) | null>(null);

  useEffect(() => {
    foldDrag.current?.();
    focusRef.current = selected ? locationToAngles(selected.lat, selected.lon) : null;
  }, [selected]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    pointerMovement.current = { x: 0, y: 0 };
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let globe: ReturnType<typeof createGlobe> | null = null;
    const [brazilPhi] = locationToAngles(-10, -38.5);
    let currentPhi = brazilPhi;
    let currentTheta = 0.12;
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
        baseColor: darkMode ? [0.1, 0.1, 0.2] : [1, 1, 1],
        markerColor: [240 / 255, 115 / 255, 45 / 255],
        glowColor: darkMode ? [0.15, 0.1, 0.3] : [0.98, 0.95, 0.92],
        markers: CITIES.map((c) => ({ location: [c.lat, c.lon], size: 0.06 })),
        onRender: (state) => {
          const focus = focusRef.current;
          const dragX = pointerMovement.current.x / 100;
          const dragY = pointerMovement.current.y / 150;

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
            for (const city of CITIES) {
              const [cityPhi] = locationToAngles(city.lat, city.lon);
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
          const w = canvas.offsetWidth || size;
          state.width = w * 2;
          state.height = w * 2;
        },
      });
      setTimeout(() => { if (canvas) canvas.style.opacity = '1'; });
    };

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) { ro.disconnect(); init(); }
      });
      ro.observe(canvas);
    }

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (globe) globe.destroy();
    };
  }, []);

  return <canvas ref={canvasRef} className="globe-canvas" onPointerDown={onPointerDown} aria-hidden="true" />;
}

function CityPanel({ city, onClose }: { city: City; onClose: () => void }) {
  const galleryItems = useMemo(() => {
    const entries = CITY_PHOTO_MANIFEST[city.id] ?? [];
    return entries.map(entry => {
      const { file, position } = typeof entry === 'string'
        ? { file: entry, position: 'center top' }
        : entry;
      return {
        image: `/background/${city.id}/${file}`,
        label: city.name.split(',')[0],
        position,
      };
    });
  }, [city.id, city.name]);

  return (
    <motion.div
      className="city-panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <button className="city-panel__close" onClick={onClose} aria-label="Close">✕</button>

      <div className="city-panel__text">
        <div className="city-panel__meta">
          <p className="city-panel__location">{city.name}</p>
          <span className="city-panel__period">{city.period}</span>
        </div>
        <h3 className="city-panel__headline">{city.headline}</h3>
        {city.story.map((para, i) => (
          <p key={i} className="city-panel__para">{para}</p>
        ))}
      </div>

      {galleryItems.length > 0 && (
        <AccordionGallery
          items={galleryItems as any}
          height={320}
          defaultIndex={0}
          trigger="hover"
          showLabels={false}
          grayscale={true}
          expandRatio={galleryItems.length === 1 ? 0.99 : 0.6}
          gap={5}
          radius={10}
        />
      )}
    </motion.div>
  );
}

// Horizontal city timeline
function CityTimeline({ selected, onSelect }: { selected: City | null; onSelect: (c: City) => void }) {
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
            </button>
            <div className="city-timeline__label">
              <span className="city-timeline__city">{city.name.split(',')[0]}</span>
              <span className="city-timeline__period">{city.period}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BackgroundGlobe() {
  const [selected, setSelected] = useState<City | null>(null);
  const darkMode = document.documentElement.getAttribute('data-theme') === 'dark';

  const handleSelect = (city: City) => {
    setSelected(selected?.id === city.id ? null : city);
  };

  return (
    <div className="background-section" id="background">
      <h2 className="heading" data-color-inverted="true">
        Where I Come From.
      </h2>

      <div className={`globe-layout ${selected ? 'globe-layout--open' : ''}`}>
        {/* ── Globe column ── */}
        <div className="globe-column">
          <div className="globe-wrap">
            <GlobeCanvas selected={selected} darkMode={darkMode} />
          </div>

        </div>

        {/* ── Panel column ── */}
        <AnimatePresence>
          {selected && (
            <CityPanel key={selected.id} city={selected} onClose={() => setSelected(null)} />
          )}
        </AnimatePresence>
      </div>

      {/* ── Horizontal timeline ── */}
      <CityTimeline selected={selected} onSelect={handleSelect} />
    </div>
  );
}

export default BackgroundGlobe;
