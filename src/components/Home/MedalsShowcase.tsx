// The medals on the home page: Gabriel's portrait in a gilded frame and, beside
// it, every photographed medal on the wall, grouped by subject under a small
// label. Anything on the wall opens large in the viewer.
import { lazy, Suspense, useCallback, useRef, useState } from "react";
import { medals, type Medal, type Subject } from "../../content/medals";
import { Counter, useReducedMotion, useVisible } from "../../lib/motion";
import "../../styles/components/home/medalsShowcase.scss";

const MedalViewer = lazy(() => import("../Medals/MedalViewer"));

const PHOTO_ALT = "Gabriel in uniform, wearing the medals";
// Viewer order: the photo, then every medal in wall order.
const COUNT = medals.length + 1;

// Wall order: one subject after another, oldest first within each.
const SUBJECTS: { id: Subject; label: string }[] = [
  { id: "math", label: "Math" },
  { id: "chemistry", label: "Chemistry" },
  { id: "physics", label: "Physics" },
  { id: "science", label: "Science" },
  { id: "energy", label: "Energy" },
  { id: "astronomy", label: "Astronomy" },
  { id: "biology", label: "Biology" },
];
const GROUPS = SUBJECTS.map((s) => ({
  ...s,
  // i is the medal's place in the viewer (after the photo).
  items: medals
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.subject === s.id)
    .sort((a, b) => (a.m.year ?? "").localeCompare(b.m.year ?? "")),
}));
const label = (m: Medal) => [m.name, m.year].filter(Boolean).join(" · ");

export default function MedalsShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useVisible(ref, { once: true });
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<number | null>(null);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + COUNT) % COUNT)), []);
  const close = useCallback(() => setOpen(null), []);

  return (
    <div ref={ref} className="featured-card medals-showcase">
      <div className="medals-showcase__portrait">
        <button type="button" className="gold-frame" onClick={() => setOpen(0)} aria-label="Open the photo large">
          <span className="gold-frame__beads">
            <span className="gold-frame__mat">
              <span className="gold-frame__lip">
                <img
                  src="/work/medals/framed-480.webp"
                  srcSet="/work/medals/framed-480.webp 480w, /work/medals/framed-960.webp 960w"
                  sizes="(max-width: 600px) 190px, 240px"
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

      <div className="medals-showcase__body">
        <h3>28 Olympiad Medals</h3>
        <p>
          Math, physics, chemistry, biology and astronomy. 5 golds at Mathématiques sans Frontières, an
          international olympiad. Gold at ONNEQ, 1st at OBAQ.
        </p>
        <dl className="medals-showcase__stats">
          <div>
            <dd>{shown && !reduced ? <Counter value={28} /> : 28}</dd>
            <dt>medals</dt>
          </div>
          <div>
            <dd>39</dd>
            <dt>olympiads</dt>
          </div>
          <div>
            <dd>19</dd>
            <dt>gold</dt>
          </div>
          <div>
            <dd>5</dd>
            <dt>international</dt>
          </div>
        </dl>

        <div className="medal-wall">
          {GROUPS.map((g) => (
            <section key={g.id} className={`medal-group is-${g.id}`} aria-label={g.label}>
              <h4>{g.label}</h4>
              <ul>
                {g.items.map(({ m, i }) => (
                  <li key={m.num}>
                    <button type="button" onClick={() => setOpen(i + 1)} aria-label={`${label(m)}. Open large`} data-tip={label(m)}>
                      <img
                        src={`/work/medals/wall/xs/${m.num}.webp`}
                        srcSet={`/work/medals/wall/xs/${m.num}.webp 144w, /work/medals/wall/sm/${m.num}.webp 280w`}
                        sizes="72px"
                        alt=""
                        width={144}
                        height={144}
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
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
