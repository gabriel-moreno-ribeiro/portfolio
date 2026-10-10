// The medal board on /work/medals: every medal photographed on its own, pinned
// to one white panel and grouped by subject. The photos were shot on white, so
// the panel stays white in both themes and the medals keep their real edges.
// Opening one shows it large; arrows, swipes and the keyboard walk the board.
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { Medal, medals, SUBJECTS } from '../../content/medals';
import '../../styles/components/pages/medalBoard.scss';

const label = (m: Medal) => [m.name, m.year].filter(Boolean).join(', ');

// Board order: subject by subject, oldest first inside each one.
const groups = SUBJECTS.map((s) => ({
  ...s,
  items: medals
    .filter((m) => m.subject === s.id)
    .sort((a, b) => (a.year ?? '9999').localeCompare(b.year ?? '9999') || a.num.localeCompare(b.num)),
})).filter((g) => g.items.length > 0);
const ordered = groups.flatMap((g) => g.items);

function Viewer({ index, onClose, onStep }: { index: number; onClose: () => void; onStep: (d: number) => void }) {
  const medal = ordered[index];
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

  // Same viewer as the project photos (portalled above the navbar).
  return createPortal(
    <div className="project-lightbox medal-viewer" role="dialog" aria-modal="true" aria-label={label(medal)} onClick={onClose}>
      <button ref={closeRef} className="project-lightbox__close" onClick={onClose} aria-label="Close">
        <FiX aria-hidden="true" />
      </button>
      <button
        className="project-lightbox__nav left"
        onClick={(e) => { e.stopPropagation(); onStep(-1); }}
        aria-label="Previous medal"
      >
        <FiChevronLeft aria-hidden="true" />
      </button>
      <figure
        className="project-lightbox__figure medal-viewer__figure"
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
        <img
          key={medal.num}
          src={`/work/medals/wall/full/${medal.num}.webp`}
          alt={label(medal)}
          width={1200}
          height={1200}
        />
        <figcaption aria-live="polite">
          <strong>{medal.name}</strong>
          {medal.year && <span>{medal.year}</span>}
          {medal.tier && <span>{medal.tier}</span>}
          <span className="medal-viewer__count">{index + 1} / {ordered.length}</span>
        </figcaption>
      </figure>
      <button
        className="project-lightbox__nav right"
        onClick={(e) => { e.stopPropagation(); onStep(1); }}
        aria-label="Next medal"
      >
        <FiChevronRight aria-hidden="true" />
      </button>
    </div>,
    document.body,
  );
}

export default function MedalBoard() {
  const [open, setOpen] = useState<number | null>(null);
  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? i : (i + d + ordered.length) % ordered.length)),
    [],
  );
  const close = useCallback(() => setOpen(null), []);

  if (ordered.length === 0) return null;

  return (
    <section className="medal-board" aria-labelledby="medal-board-title">
      <h2 id="medal-board-title">The medals</h2>
      <p className="medal-board__lead">Photographed one by one. Open any of them to see it up close.</p>
      <div className="medal-board__panel">
        {groups.map((g) => (
          <div className="medal-board__group" key={g.id}>
            <h3>
              {g.label} <span>{g.items.length}</span>
            </h3>
            <ul className="medal-board__grid">
              {g.items.map((m) => (
                <li key={m.num}>
                  <button
                    type="button"
                    className="medal-board__medal"
                    onClick={() => setOpen(ordered.indexOf(m))}
                    aria-label={`${label(m)}. Open large`}
                  >
                    <img
                      src={`/work/medals/wall/${m.num}.webp`}
                      alt=""
                      width={400}
                      height={400}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="medal-board__name">{m.name}</span>
                    {m.year && <span className="medal-board__year">{m.year}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {open !== null && <Viewer index={open} onClose={close} onStep={step} />}
    </section>
  );
}
