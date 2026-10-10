// /work/medals: Gabriel's photo with every medal around it, pinned to one white
// wall. An 8x8 grid: the photo takes the middle 6x6, the medals flow into the
// ring of cells left around it (28 cells for 28 medals; more would add rows).
// The medal photos were shot on white, so the wall is white in both themes.
// Opening anything shows it large; arrows, swipes and the keyboard walk on.
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { Medal, medals } from '../../content/medals';
import '../../styles/components/pages/medalWall.scss';

const PHOTO_ALT = 'Gabriel in uniform, wearing the medals';

// Grid column of the i-th medal as auto-placement puts it: the top row, then one
// cell each side of the photo per row, then the bottom row. Edge medals anchor
// their name tag inwards so it never spills off the wall.
const column = (i: number) => (i < 8 ? i + 1 : i < 20 ? ((i - 8) % 2 === 0 ? 1 : 8) : ((i - 20) % 8) + 1);
const edge = (i: number) => (column(i) === 1 ? ' is-left' : column(i) === 8 ? ' is-right' : '');
const short = (m: Medal) => [m.name, m.year].filter(Boolean).join(' · ');

// Everything the viewer can show: the photo first, then the medals in wall order.
type Item = { key: string; src: string; alt: string; title: string; lines: string[]; square: boolean };
const ITEMS: Item[] = [
  { key: 'photo', src: '/work/medals/portrait.webp', alt: PHOTO_ALT, title: 'Wearing the medals', lines: [], square: false },
  ...medals.map((m) => ({
    key: m.num,
    src: `/work/medals/wall/full/${m.num}.webp`,
    alt: short(m),
    title: m.fullName ?? m.name,
    lines: [m.year, m.tier].filter(Boolean) as string[],
    square: true,
  })),
];

function Viewer({ index, onClose, onStep }: { index: number; onClose: () => void; onStep: (d: number) => void }) {
  const item = ITEMS[index];
  const swipeStart = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onStep(1);
      if (e.key === 'ArrowLeft') onStep(-1);
    };
    window.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, [onClose, onStep]);

  // Same viewer as the project photos, portalled above the navbar.
  return createPortal(
    <div className="project-lightbox medal-viewer" role="dialog" aria-modal="true" aria-label={item.title} onClick={onClose}>
      <button ref={closeRef} className="project-lightbox__close" onClick={onClose} aria-label="Close">
        <FiX aria-hidden="true" />
      </button>
      <button className="project-lightbox__nav left" onClick={(e) => { e.stopPropagation(); onStep(-1); }} aria-label="Previous">
        <FiChevronLeft aria-hidden="true" />
      </button>
      <figure
        className={`project-lightbox__figure medal-viewer__figure${item.square ? ' is-medal' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => { if (e.pointerType !== 'mouse') swipeStart.current = e.clientX; }}
        onPointerUp={(e) => {
          if (swipeStart.current === null) return;
          const dx = e.clientX - swipeStart.current;
          swipeStart.current = null;
          if (Math.abs(dx) > 40) onStep(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => { swipeStart.current = null; }}
      >
        <img key={item.key} src={item.src} alt={item.alt} />
        <figcaption aria-live="polite">
          <strong>{item.title}</strong>
          {item.lines.map((l) => <span key={l}>{l}</span>)}
          <span className="medal-viewer__count">{index + 1} / {ITEMS.length}</span>
        </figcaption>
      </figure>
      <button className="project-lightbox__nav right" onClick={(e) => { e.stopPropagation(); onStep(1); }} aria-label="Next">
        <FiChevronRight aria-hidden="true" />
      </button>
    </div>,
    document.body,
  );
}

export default function MedalWall() {
  const [open, setOpen] = useState<number | null>(null);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + ITEMS.length) % ITEMS.length)), []);
  const close = useCallback(() => setOpen(null), []);

  return (
    <section className="medal-wall" aria-label={`${medals.length} medals around a photo of Gabriel`}>
      <ul className="medal-wall__grid">
        <li className="medal-wall__photo">
          <button type="button" onClick={() => setOpen(0)} aria-label="Open the photo large">
            <img src="/work/medals/portrait-square.webp" alt={PHOTO_ALT} width={1125} height={1125} decoding="async" />
          </button>
        </li>
        {medals.map((m, i) => (
          <li key={m.num} className={`medal-wall__cell${edge(i)}`}>
            <button
              type="button"
              className="medal-wall__medal"
              data-label={short(m)}
              onClick={() => setOpen(i + 1)}
              aria-label={`${short(m)}. Open large`}
            >
              <img src={`/work/medals/wall/${m.num}.webp`} alt="" width={400} height={400} loading="lazy" decoding="async" />
            </button>
          </li>
        ))}
      </ul>
      {open !== null && <Viewer index={open} onClose={close} onStep={step} />}
    </section>
  );
}
