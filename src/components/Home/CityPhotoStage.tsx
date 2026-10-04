import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/motion';

export interface StagePhoto {
  src: string;
  alt: string;
  position: string;
}

interface Props {
  /** City name as shown in each card's header. */
  label: string;
  photos: StagePhoto[];
  /** Someone browsed the photos: the section stops touring cities under them. */
  onInteract?: () => void;
  /** Page through the photos on its own (the section decides: on screen, tab
      visible, nobody has taken over, no reduced motion). */
  autoplay?: boolean;
  /** Autoplay went past the last photo: time for the next city. */
  onEnd?: () => void;
}

// Long enough to look at a photo, short enough that the section feels alive.
const PHOTO_MS = 3200;

type Slot = 'center' | 'prev' | 'next' | 'hidden';

// How many slides away from the active one a photo is, wrapping around.
function distance(i: number, active: number, n: number) {
  const d = Math.abs(i - active) % n;
  return Math.min(d, n - d);
}

const pad = (n: number) => String(n).padStart(2, '0');

// Signed distance from the active card, wrapping around, so the first photo
// still has a neighbour on its left.
function slotOf(i: number, active: number, n: number): Slot {
  if (i === active) return 'center';
  let d = (i - active + n) % n;
  if (d > n / 2) d -= n;
  if (d === 1) return 'next';
  if (d === -1) return 'prev';
  return 'hidden';
}

const SWIPE_PX = 40;

function CityPhotoStage({ label, photos, onInteract, autoplay = false, onEnd }: Props) {
  const [active, setActiveState] = useState(0);
  const reduced = useReducedMotion();
  const dragStart = useRef<number | null>(null);
  const n = photos.length;
  // Pointing at the photos holds them still; leaving lets them go on.
  const [held, setHeld] = useState(false);
  const activeRef = useRef(active);
  activeRef.current = active;
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  useEffect(() => {
    if (!autoplay || held || n < 2) return;
    const id = window.setInterval(() => {
      if (activeRef.current + 1 >= n) onEndRef.current?.();
      else setActiveState(activeRef.current + 1);
    }, PHOTO_MS);
    return () => window.clearInterval(id);
  }, [autoplay, held, n]);

  const setActive = useCallback(
    (i: number) => {
      onInteract?.();
      setActiveState(i);
    },
    [onInteract],
  );
  const go = useCallback(
    (step: number) => {
      onInteract?.();
      setActiveState((a) => (a + step + n) % n);
    },
    [n, onInteract],
  );

  if (n === 0) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    dragStart.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    const dx = e.clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(dx) > SWIPE_PX) go(dx < 0 ? 1 : -1);
  };

  return (
    <section
      className="photo-stage"
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHeld(true); }}
      onPointerLeave={() => setHeld(false)}
      data-reduced={reduced ? 'true' : undefined}
      aria-roledescription="carousel"
      aria-label={`Photos from ${label}`}
    >
      <div
        className="photo-stage__viewport"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { dragStart.current = null; }}
        aria-label={`${label} photos. Use the left and right arrow keys to browse.`}
      >
        {photos.map((photo, i) => {
          const slot = slotOf(i, active, n);
          const side = slot === 'prev' || slot === 'next';
          return (
            <figure
              key={photo.src}
              className="photo-card"
              data-slot={slot}
              aria-hidden={slot === 'center' ? undefined : 'true'}
              aria-roledescription="slide"
              aria-label={slot === 'center' ? `${i + 1} of ${n}` : undefined}
              onClick={side ? () => go(slot === 'next' ? 1 : -1) : undefined}
            >
              <header className="photo-card__head">
                <span className="photo-card__label">{label}</span>
                <span className="photo-card__count">
                  {pad(i + 1)} / {pad(n)}
                </span>
              </header>
              {/* The box is always there (aspect-ratio); a photo more than two
                  slides away waits for its turn instead of loading behind the others */}
              <div className="photo-card__media">
                {distance(i, active, n) <= 2 && (
                  <img
                    src={photo.src}
                    alt={slot === 'center' ? photo.alt : ''}
                    style={{ objectPosition: photo.position }}
                    width={640}
                    height={400}
                    decoding="async"
                    draggable={false}
                  />
                )}
              </div>
            </figure>
          );
        })}
      </div>

      <div className="photo-stage__bars">
        {photos.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            className="photo-stage__bar"
            aria-label={`Show photo ${i + 1} of ${n}`}
            aria-current={i === active ? 'true' : undefined}
            onClick={() => setActive(i)}
          />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        Photo {active + 1} of {n}
      </p>
    </section>
  );
}

export default CityPhotoStage;
