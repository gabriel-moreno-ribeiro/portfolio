import createGlobe from 'cobe';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface City {
  id: string;
  name: string;
  lat: number;
  lon: number;
  headline: string;
  story: string[];
}

// Coordenadas exatas:
// Salvador: 12°58′29″S 38°28′36″W  |  Missão Velha: 07°14′59″S 39°08′35″W
const CITIES: City[] = [
  {
    id: 'missao-velha',
    name: 'Missão Velha, Ceará',
    lat: -7.2497,
    lon: -39.1431,
    headline: 'Where the roots are.',
    story: [
      'A small city in the interior of Ceará. My grandparents are from here. My father grew up here.',
      'Every time I went back as a kid, something clicked about where I came from — the heat, the simplicity, the way people knew each other by name.',
      'It\'s the kind of place that doesn\'t show up on anyone\'s map of Brazilian ambition. But it\'s where mine started.',
    ],
  },
  {
    id: 'salvador',
    name: 'Salvador, Bahia',
    lat: -12.9747,
    lon: -38.4767,
    headline: 'Where I grew up.',
    story: [
      'I moved to Salvador when I was young and grew up here. Got into Colégio Militar at 10 — one of 30 from 2,500 applicants, perfect score in math.',
      'The city shaped how I think. The olympiads started here. Projeto Candela was built for schools here. The first time I really built something that mattered was in Salvador.',
      'I still call it home.',
    ],
  },
];

const MEDIA_FILES = ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg', '07.jpg', '08.jpg', '01.mp4', '02.mp4'];

// From cobe's official "focus on location" example
function locationToAngles(lat: number, lon: number): [number, number] {
  return [
    Math.PI - ((lon * Math.PI) / 180 - Math.PI / 2),
    (lat * Math.PI) / 180,
  ];
}

function GlobeCanvas({ selected }: { selected: City | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const focusRef = useRef<[number, number] | null>(null);
  // Drag state (official cobe example pattern, extended to both axes)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const pointerMovement = useRef({ x: 0, y: 0 }); // px of the current drag
  const foldDrag = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Fold any leftover drag offset into the base rotation, then focus
    foldDrag.current?.();
    focusRef.current = selected
      ? locationToAngles(selected.lat, selected.lon)
      : null;
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
    let currentPhi = 0;
    let currentTheta = 0.3;
    const doublePi = Math.PI * 2;
    const clampTheta = (t: number) => Math.max(-1.35, Math.min(1.35, t));

    // Merge the finished drag into the base rotation so focus math stays exact
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
      if (pointerInteracting.current !== null) {
        foldDrag.current?.();
      }
      if (canvas) canvas.style.cursor = 'grab';
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });

    const init = () => {
      const size = canvas.offsetWidth;
      if (size === 0 || globe) return;

      globe = createGlobe(canvas, {
        devicePixelRatio: 2,
        width: size * 2,
        height: size * 2,
        phi: 0,
        theta: 0.3,
        dark: 0,
        diffuse: 1.5,
        mapSamples: 16000,
        mapBrightness: 9,
        baseColor: [1, 1, 1],
        markerColor: [240 / 255, 115 / 255, 45 / 255],
        glowColor: [0.98, 0.95, 0.92],
        markers: CITIES.map((c) => ({
          location: [c.lat, c.lon],
          size: 0.06,
        })),
        onRender: (state) => {
          const focus = focusRef.current;
          const dragX = pointerMovement.current.x / 100;
          const dragY = pointerMovement.current.y / 150;

          if (focus) {
            // Official cobe "rotate to location" math — shortest way around
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
            // Slow down near each city marker — min angular dist across all cities
            const BASE_SPEED = 0.0068; // 1.7× original 0.004
            const SLOW_RADIUS = 0.35;  // radians — ~20° of arc
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
            const speedMult = minDist < SLOW_RADIUS
              ? 0.2 + 0.8 * (minDist / SLOW_RADIUS)
              : 1;
            currentPhi += BASE_SPEED * speedMult;
          }

          state.phi = currentPhi + dragX;
          state.theta = clampTheta(currentTheta + dragY);
          // Always use width for both dimensions to guarantee a perfect sphere
          const w = canvas.offsetWidth || size;
          state.width = w * 2;
          state.height = w * 2;
        },
      });
      setTimeout(() => {
        if (canvas) canvas.style.opacity = '1';
      });
    };

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          ro.disconnect();
          init();
        }
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

  return (
    <canvas
      ref={canvasRef}
      className="globe-canvas"
      onPointerDown={onPointerDown}
    />
  );
}

function CityMedia({ cityId, file }: { cityId: string; file: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  const src = `/background/${cityId}/${file}`;
  if (file.endsWith('.mp4')) {
    return (
      <video
        src={src}
        controls
        playsInline
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <img
      src={src}
      alt={`Photo in ${cityId}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function CityPanel({ city, onClose }: { city: City; onClose: () => void }) {
  return (
    <motion.div
      className="city-panel"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <button className="city-panel__close" onClick={onClose} aria-label="Close">
        ✕
      </button>

      <div className="city-panel__body">
        <div className="city-panel__text">
          <p className="city-panel__location">{city.name}</p>
          <h3 className="city-panel__headline">{city.headline}</h3>
          {city.story.map((para, i) => (
            <p key={i} className="city-panel__para">{para}</p>
          ))}
        </div>

        <div className="city-panel__photos">
          {MEDIA_FILES.map((file) => (
            <CityMedia key={file} cityId={city.id} file={file} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function BackgroundGlobe() {
  const [selected, setSelected] = useState<City | null>(null);

  return (
    <div className="background-section" id="background">
      <h1 className="heading" data-color-inverted="true">
        Where I Come From.
      </h1>
      <div className={`globe-wrap ${selected ? 'zoomed' : ''}`}>
        <GlobeCanvas selected={selected} />
      </div>
      <div className="globe-buttons">
        {CITIES.map((city) => (
          <button
            key={city.id}
            className={selected?.id === city.id ? 'active' : ''}
            onClick={() => setSelected(selected?.id === city.id ? null : city)}
          >
            {city.name}
          </button>
        ))}
        {selected && (
          <button className="clear" onClick={() => setSelected(null)}>
            Keep spinning
          </button>
        )}
      </div>
      <AnimatePresence>
        {selected && <CityPanel key={selected.id} city={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

export default BackgroundGlobe;
