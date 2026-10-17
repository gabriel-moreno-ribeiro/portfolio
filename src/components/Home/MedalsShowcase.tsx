// The medals on the home page: Gabriel's portrait in a gilded frame and, beside
// it, a medal rack. Every photographed medal hangs from a brass hook by a
// ribbon in its subject's colour. Anything on the wall opens large in the viewer.
import { lazy, Suspense, useCallback, useRef, useState, type CSSProperties } from "react";
import { medals, type Subject } from "../../content/medals";
import { Counter, useReducedMotion, useVisible } from "../../lib/motion";
import "../../styles/components/home/medalsShowcase.scss";

const MedalViewer = lazy(() => import("../Medals/MedalViewer"));

const PHOTO_ALT = "Gabriel in uniform, wearing the medals";
// Viewer order: the photo, then every medal in wall order.
const COUNT = medals.length + 1;

// Rack order: one subject after another (ribbons of a colour hang together),
// oldest first within each.
const SUBJECTS: { id: Subject; label: string }[] = [
  { id: "math", label: "Math" },
  { id: "chemistry", label: "Chemistry" },
  { id: "physics", label: "Physics" },
  { id: "science", label: "Science" },
  { id: "energy", label: "Energy" },
  { id: "astronomy", label: "Astronomy" },
  { id: "biology", label: "Biology" },
];
const rank = (s: Subject) => SUBJECTS.findIndex((x) => x.id === s);
const RACK = medals
  .map((m, i) => ({ m, i }))
  .sort((a, b) => rank(a.m.subject) - rank(b.m.subject) || (a.m.year ?? "").localeCompare(b.m.year ?? ""));

// Ribbons cut to slightly different lengths, fixed per hook, like a real rack.
const hang = (k: number) => ({ "--i": k, "--hang": `${30 + (k % 3) * 5}px` }) as CSSProperties;
const label = (k: number) => [RACK[k].m.name, RACK[k].m.year].filter(Boolean).join(" · ");

export default function MedalsShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useVisible(ref, { once: true });
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<number | null>(null);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + COUNT) % COUNT)), []);
  const close = useCallback(() => setOpen(null), []);

  return (
    <div ref={ref} className={`featured-card medals-showcase${shown && !reduced ? " is-in" : ""}`}>
      <figure className="medals-showcase__portrait">
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
        <figcaption className="medals-showcase__plaque">Wearing the medals</figcaption>
      </figure>

      <div className="medals-showcase__body">
        <h3>39 Olympiad Medals</h3>
        <p>
          Math, physics, chemistry, biology and astronomy. 5 golds at Mathématiques sans Frontières, an
          international olympiad. Gold at ONNEQ, 1st at OBAQ.
        </p>
        <dl className="medals-showcase__stats">
          <div>
            <dd>{shown && !reduced ? <Counter value={39} /> : 39}</dd>
            <dt>medals</dt>
          </div>
          <div>
            <dd>49</dd>
            <dt>competitions</dt>
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

        <ul className="medal-rack" aria-label="The medals, hung by subject">
          {RACK.map(({ m, i }, k) => (
            <li key={m.num} style={hang(k)}>
              <button type="button" onClick={() => setOpen(i + 1)} aria-label={`${label(k)}. Open large`} data-tip={label(k)}>
                <span className={`medal-rack__ribbon is-${m.subject}`} aria-hidden="true" />
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

        <ul className="medals-showcase__legend">
          {SUBJECTS.map((s) => (
            <li key={s.id}>
              <i className={`is-${s.id}`} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      </div>

      {open !== null && (
        <Suspense fallback={null}>
          <MedalViewer index={open} onClose={close} onStep={step} />
        </Suspense>
      )}
    </div>
  );
}
