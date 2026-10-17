// Big view of the framed photo and every medal Gabriel photographed. Opening
// anything shows it large; arrows, swipes and the keyboard walk on.
// Loaded on demand from the medals card, so it brings its own styles.
import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { Medal, medals } from '../../content/medals';
import { useDialog } from '../../hooks/useDialog';
import '../../styles/components/pages/project.scss';
import '../../styles/components/pages/medalViewer.scss';

const PHOTO_ALT = 'Gabriel in uniform, wearing the medals';
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

export default function MedalViewer({ index, onClose, onStep }: { index: number; onClose: () => void; onStep: (d: number) => void }) {
  const item = ITEMS[index];
  const swipeStart = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useDialog(dialogRef, closeRef, onClose, onStep);

  // Same viewer as the project photos, portalled above the navbar.
  return createPortal(
    <div ref={dialogRef} className="project-lightbox medal-viewer" role="dialog" aria-modal="true" aria-label={item.title} onClick={onClose}>
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
