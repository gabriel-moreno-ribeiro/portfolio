import { useCallback, useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/motion';

export interface StagePhoto {
  src: string;
  alt: string;
  position: string;
}

interface Props {
  /** City name as shown in each card's header. */
  label: string;
  /** Where this city sits in the journey: lights one of the header dots. */
  cityIndex: number;
  cityCount: number;
  photos: StagePhoto[];
  /** Someone browsed the photos: the section stops touring cities under them. */
  onInteract?: () => void;
}

type Slot = 'center' | 'prev' | 'next' | 'hidden';

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

function CityPhotoStage({ label, cityIndex, cityCount, photos, onInteract }: Props) {
  const [active, setActiveState] = useState(0);
  const reduced = useReducedMotion();
  const dragStart = useRef<number | null>(null);
  const n = photos.length;

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
                <span className="photo-card__steps" aria-hidden="true">
                  {Array.from({ length: cityCount }, (_, k) => (
                    <i key={k} data-on={k === cityIndex ? 'true' : undefined} />
                  ))}
                </span>
                <span className="photo-card__label">{label}</span>
                <span className="photo-card__count">
                  {pad(i + 1)} / {pad(n)}
                </span>
              </header>
              <div className="photo-card__media">
                <img
                  src={photo.src}
                  alt={slot === 'center' ? photo.alt : ''}
                  style={{ objectPosition: photo.position }}
                  width={640}
                  height={480}
                  loading={slot === 'hidden' ? 'lazy' : 'eager'}
                  decoding="async"
                  draggable={false}
                />
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
