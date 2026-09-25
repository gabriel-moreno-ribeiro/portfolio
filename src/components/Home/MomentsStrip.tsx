// Two rows of photos drifting in opposite directions, right under the hero,
// so a first-time visitor sees the person before the product.
import { useMemo, useRef, useState } from 'react';
import type { GalleryItem } from '../../lib/data';
import { useLocalData } from '../../lib/data';
import { usePageVisible, useVisible } from '../../lib/motion';

// Every caption follows the same shape: what the photo is · place · year.
function caption(item: GalleryItem): string {
  return item.year ? `${item.what} · ${item.city} · ${item.year}` : `${item.what} · ${item.city}`;
}

// A row shorter than this leaves a visible gap in the loop, so it repeats itself.
const MIN_PER_ROW = 4;

function loopable(items: GalleryItem[]): { items: GalleryItem[]; real: number } {
  if (items.length === 0) return { items, real: 0 };
  const out = [...items];
  while (out.length < MIN_PER_ROW) out.push(...items);
  return { items: out, real: items.length };
}

function Row({
  items,
  real,
  reverse,
  duration,
  priority,
  label,
}: {
  items: GalleryItem[];
  real: number;
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
          <figure className="moments__item" key={`${m.src}-${i}`} aria-hidden={i >= real}>
            {/* The first photo of the first row is the page's LCP element */}
            <img
              src={m.src}
              alt={i < real ? m.alt : ''}
              /* Only the first three of each row race for bandwidth; the rest wait. */
              loading={i < 3 ? 'eager' : 'lazy'}
              fetchPriority={priority && i === 0 ? 'high' : undefined}
              decoding="async"
              width={m.w}
              height={m.h}
            />
            <figcaption>{caption(m)}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

export default function MomentsStrip() {
  const { gallery, config } = useLocalData();
  const [city, setCity] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const visible = useVisible(sectionRef);
  const pageVisible = usePageVisible();

  // Same order as the globe timeline, minus any city with no photos.
  const cities = useMemo(
    () => config.cities.map((c) => c.name).filter((name) => gallery.some((g) => g.city === name)),
    [config.cities, gallery],
  );

  const [rowOne, rowTwo] = useMemo(() => {
    if (!city) {
      return [
        loopable(gallery.filter((g) => g.row === 1)),
        loopable(gallery.filter((g) => g.row === 2)),
      ];
    }
    // One city rarely fills both rows, so its photos are dealt alternately.
    const picked = gallery.filter((g) => g.city === city);
    const top = picked.filter((_, i) => i % 2 === 0);
    const bottom = picked.filter((_, i) => i % 2 === 1);
    return [loopable(top.length ? top : picked), loopable(bottom.length ? bottom : picked)];
  }, [gallery, city]);

  const paused = !visible || !pageVisible;

  return (
    <section
      className={`moments ${paused ? 'moments--paused' : ''}`}
      id="moments"
      aria-label="A few moments"
      ref={sectionRef}
    >
      <div className="moments__filters" role="group" aria-label="Filter photos by place">
        <button
          type="button"
          className="moments__filter"
          aria-pressed={city === null}
          onClick={() => setCity(null)}
        >
          All
        </button>
        {cities.map((name) => (
          <button
            key={name}
            type="button"
            className="moments__filter"
            aria-pressed={city === name}
            onClick={() => setCity((prev) => (prev === name ? null : name))}
          >
            {name}
          </button>
        ))}
      </div>
      <Row
        items={rowOne.items}
        real={rowOne.real}
        duration={75}
        priority
        label="Photos, first row"
      />
      <Row
        items={rowTwo.items}
        real={rowTwo.real}
        duration={85}
        reverse
        label="Photos, second row"
      />
    </section>
  );
}
