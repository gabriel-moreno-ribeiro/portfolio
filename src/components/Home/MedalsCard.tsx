// The medals live on the home page, small: Gabriel's photo in a gilded frame,
// a few of the medals beside it, and everything opens large in the viewer.
import { lazy, Suspense, useCallback, useRef, useState } from "react";
import { medals } from "../../content/medals";
import { Counter, useReducedMotion, useVisible } from "../../lib/motion";
import "../../styles/components/home/medalsCard.scss";

const MedalViewer = lazy(() => import("../Medals/MedalViewer"));

const PHOTO_ALT = "Gabriel in uniform, wearing the medals";
// Viewer order: the photo, then every medal.
const COUNT = medals.length + 1;
// One of each kind, so the strip doesn't repeat itself.
const STRIP = ["02", "10", "07", "13", "09", "27"].map((n) => medals.findIndex((m) => m.num === n));

// The final number is the default; the count only runs once the card enters the
// viewport, so a card still below the fold never reads "0 medals".
function MedalsCount() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useVisible(ref, { once: true });
  const reduced = useReducedMotion();

  return (
    <div className="project-live" ref={ref}>
      <p className="project-live__counts">
        <strong>{shown && !reduced ? <Counter value={39} /> : 39}</strong> medals in 49 competitions
      </p>
    </div>
  );
}

export default function MedalsCard() {
  const [open, setOpen] = useState<number | null>(null);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + COUNT) % COUNT)), []);
  const close = useCallback(() => setOpen(null), []);

  return (
    <div className="featured-card featured-card--wide featured-card--chips medals-card">
      <div className="medals-card__wall">
        <button type="button" className="gold-frame" onClick={() => setOpen(0)} aria-label="Open the photo large">
          <span className="gold-frame__beads">
            <span className="gold-frame__mat">
              <span className="gold-frame__lip">
                <img
                  src="/work/medals/framed-480.webp"
                  srcSet="/work/medals/framed-480.webp 480w, /work/medals/framed-960.webp 960w"
                  sizes="(max-width: 600px) 156px, 172px"
                  alt={PHOTO_ALT}
                  width={480}
                  height={640}
                  loading="lazy"
                  decoding="async"
                />
              </span>
            </span>
          </span>
        </button>
      </div>
      <div className="featured-card__body">
        <h3>39 Olympiad Medals</h3>
        <p>
          49 competitions in math, physics, chemistry, biology and astronomy. 5 golds at Mathématiques sans
          Frontières, an international olympiad. Gold at ONNEQ. 1st at OBAQ.
        </p>
        <MedalsCount />
        <ul className="medals-card__strip">
          {STRIP.map((i) => {
            const m = medals[i];
            const label = [m.name, m.year].filter(Boolean).join(" · ");
            return (
              <li key={m.num}>
                <button type="button" onClick={() => setOpen(i + 1)} aria-label={`${label}. Open large`} data-tip={label}>
                  <img src={`/work/medals/wall/sm/${m.num}.webp`} alt="" width={280} height={280} loading="lazy" decoding="async" />
                </button>
              </li>
            );
          })}
          <li>
            <button type="button" className="medals-card__more" onClick={() => setOpen(1)} aria-label={`See all ${medals.length} photographed medals`}>
              +{medals.length - STRIP.length}
            </button>
          </li>
        </ul>
        <div className="featured-tags">
          <span>19 gold</span>
          <span>5 international gold</span>
        </div>
      </div>
      {open !== null && (
        <Suspense fallback={null}>
          <MedalViewer index={open} onClose={close} onStep={step} />
        </Suspense>
      )}
    </div>
  );
}
