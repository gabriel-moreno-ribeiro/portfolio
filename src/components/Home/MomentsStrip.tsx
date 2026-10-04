// Two rows of photos drifting in opposite directions, right under the hero,
// so a first-time visitor sees the person before the product.
import { useMemo, useRef } from 'react';
import type { GalleryItem } from '../../lib/data';
import { useLocalData } from '../../lib/data';
import { usePageVisible, useVisible } from '../../lib/motion';

// Every caption follows the same shape: what the photo is · place · year.
function caption(item: GalleryItem): string {
  return item.year ? `${item.what} · ${item.city} · ${item.year}` : `${item.what} · ${item.city}`;
}

function Row({
  items,
  reverse,
  duration,
  priority,
  label,
}: {
  items: GalleryItem[];
  reverse?: boolean;
  duration: number;
  priority?: boolean;
  label: string;
}) {
  // The track holds two copies; the animation slides exactly one copy's width.
  const doubled = [...items, ...items];
  return (
    // Under prefers-reduced-motion the row stops and becomes scrollable, so it needs a keyboard stop
    <div
      className={`moments__row ${reverse ? 'moments__row--reverse' : ''}`}
      role="group"
      aria-label={label}
      tabIndex={0}
    >
      <div className="moments__track" style={{ animationDuration: `${duration}s` }}>
        {doubled.map((m, i) => (
          <figure className="moments__item" key={`${m.src}-${i}`} aria-hidden={i >= items.length}>
            {/* The first photo of the first row is the page's LCP element */}
            <img
              src={m.src}
              alt={i < items.length ? m.alt : ''}
              /* The first five of each row load up front (three let a photo slide
                 in before it arrived); the rest wait for the browser's lazy margin. */
              loading={i < 5 ? 'eager' : 'lazy'}
              fetchPriority={priority && i === 0 ? 'high' : undefined}
              decoding="async"
              width={m.w}
              height={m.h}
              style={m.focus ? { objectPosition: m.focus } : undefined}
            />
            <figcaption>{caption(m)}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

export default function MomentsStrip() {
  const { gallery } = useLocalData();
  const sectionRef = useRef<HTMLElement>(null);
  const visible = useVisible(sectionRef);
  const pageVisible = usePageVisible();

  const rowOne = useMemo(() => gallery.filter((g) => g.row === 1), [gallery]);
  const rowTwo = useMemo(() => gallery.filter((g) => g.row === 2), [gallery]);

  const paused = !visible || !pageVisible;

  return (
    <section
      className={`moments ${paused ? 'moments--paused' : ''}`}
      id="moments"
      aria-label="A few moments"
      ref={sectionRef}
    >
      <p className="moments__eyebrow">
        <span>Salvador</span><i />
        <span>Missão Velha</span><i />
        <span>Fortaleza</span><i />
        <span>São Paulo</span>
      </p>
      <Row items={rowOne} duration={75} priority label="Photos, first row" />
      <Row items={rowTwo} duration={85} reverse label="Photos, second row" />
    </section>
  );
}
