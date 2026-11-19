// The medals on the home page: Gabriel's portrait in a gilded frame over a brass
// plate with the numbers and, beside it, every photographed medal in a tray,
// each group starting under a small label. Anything here opens large in the viewer.
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate } from "motion/react";
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

// The three ways to sort the wall. Each reads one field of the medal data; a
// medal that doesn't state it goes to a last group that says so.
// The colour is the first word of the tier ("Gold medal, national champion").
const colourOf = (m: Medal) => m.tier?.match(/^(gold|silver|bronze)/i)?.[1].toLowerCase();
type Mode = "subject" | "year" | "colour";
const MODES = ([
  { id: "subject", label: "Subject" },
  { id: "year", label: "Year" },
  { id: "colour", label: "Color" },
// Only 6 of the 28 medals state a colour in medals.ts, which would contradict the "19 gold" count; the button returns once every medal has one.
] as { id: Mode; label: string }[]).filter((m) => m.id !== "colour" || medals.every((x) => colourOf(x)));
const KEY: Record<Mode, (m: Medal) => string | undefined> = {
  subject: (m) => m.subject,
  year: (m) => m.year,
  colour: colourOf,
};
const UNKNOWN: Record<Mode, string> = {
  subject: "",
  year: "Year not on the medal",
  colour: "Color not on the medal",
};
const HEADS: Record<Mode, { id: string; label: string }[]> = {
  subject: SUBJECTS,
  year: [...new Set(medals.map((m) => m.year).filter(Boolean) as string[])].sort().map((y) => ({ id: y, label: y })),
  colour: (["gold", "silver", "bronze"] as const)
    .filter((c) => medals.some((m) => colourOf(m) === c))
    .map((c) => ({ id: c, label: c[0].toUpperCase() + c.slice(1) })),
};
const groupsFor = (mode: Mode) =>
  [...HEADS[mode], { id: "unknown", label: UNKNOWN[mode] }]
    .map((h) => ({
      ...h,
      // i is the medal's place in the viewer (after the photo).
      items: medals
        .map((m, i) => ({ m, i }))
        .filter(({ m }) => (KEY[mode](m) ?? "unknown") === h.id)
        .sort((a, b) => (a.m.year ?? "").localeCompare(b.m.year ?? "")),
    }))
    .filter((g) => g.items.length);
const GROUPS: Record<Mode, ReturnType<typeof groupsFor>> = {
  subject: groupsFor("subject"),
  year: groupsFor("year"),
  colour: groupsFor("colour"),
};
const label = (m: Medal) => [m.name, m.year].filter(Boolean).join(" · ");
const EASE = [0.16, 1, 0.3, 1] as const;
const hooks = (stage: HTMLElement) => [...stage.querySelectorAll<HTMLElement>("li[data-num]")];

export default function MedalsShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useVisible(ref, { once: true });
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<number | null>(null);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + COUNT) % COUNT)), []);
  const close = useCallback(() => setOpen(null), []);

  const [mode, setMode] = useState<Mode>("subject");
  const [said, setSaid] = useState(""); // polite announcement, empty until the first regroup
  // The name tag: which medal, and where under it (px inside the stage).
  const [tip, setTip] = useState<{ m: Medal; x: number; y: number } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const touch = useRef(false);
  const showTip = (m: Medal, el: HTMLElement) => {
    const s = stage.current!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setTip({ m, x: r.left + r.width / 2 - s.left, y: r.bottom - s.top });
  };
  // FLIP: where each medal hangs now, read just before the regroup...
  const from = useRef<Map<string, DOMRect> | null>(null);
  const regroup = (next: Mode) => {
    if (next === mode) return;
    if (!reduced) from.current = new Map(hooks(stage.current!).map((li) => [li.dataset.num!, li.getBoundingClientRect()]));
    setTip(null);
    setMode(next);
    setSaid(`Grouped by ${next}`);
  };
  // ...and after it, each one glides from the old hook to the new (transform only).
  useLayoutEffect(() => {
    const was = from.current;
    from.current = null;
    if (!was) return;
    const runs = hooks(stage.current!).map((li, n) => {
      const a = was.get(li.dataset.num!)!;
      const b = li.getBoundingClientRect();
      return animate(li, { x: [a.left - b.left, 0], y: [a.top - b.top, 0] }, { duration: 0.7, ease: EASE, delay: n * 0.012 });
    });
    return () => runs.forEach((r) => r.stop());
  }, [mode]);

  // A tap anywhere else puts the name tag away (touch has no blur to rely on).
  useEffect(() => {
    if (!tip) return;
    const away = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.(".medal-tray button")) setTip(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [tip]);

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
                  sizes="(max-width: 600px) 190px, 264px"
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
        {/* The brass plate under the frame. */}
        <dl className="medals-showcase__stats">
          <div>
            <dd>{shown && !reduced ? <Counter value={28} /> : 28}</dd>
            <dt>medals</dt>
          </div>
          <div>
            <dd>38</dd>
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
      </div>

      <div className="medals-showcase__body">
        <h3>28 Olympiad Medals</h3>
        <div className="medal-sort" role="group" aria-label="Group the medals by">
          <span aria-hidden="true">Group by</span>
          {MODES.map((o) => (
            <button key={o.id} type="button" aria-pressed={mode === o.id} onClick={() => regroup(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">{said}</p>

        {/* One tray for all 28 (7 x 4, or 4 x 7 on a phone): every grouping fills
            the same cells, so regrouping never moves the page. */}
        <div
          ref={stage}
          className="medal-stage"
          onKeyDown={(e) => {
            if (e.key === "Escape" && tip) {
              e.stopPropagation();
              setTip(null);
            }
          }}
        >
          <ul className={`medal-tray${said ? " is-regrouped" : ""}`}>
            {GROUPS[mode].flatMap((g) =>
              g.items.map(({ m, i }, n) => (
                // Keyed by mode: a regroup hangs fresh medals, so the glide never starts from a stale transform.
                <li key={`${mode}-${m.num}`} data-num={m.num}>
                  {n === 0 && <h4 className={`is-${g.id}`}>{g.label}</h4>}
                  <button
                    type="button"
                    aria-label={`${label(m)}. Open large`}
                    aria-describedby={tip?.m === m ? "medal-tip" : undefined}
                    onPointerDown={(e) => { touch.current = e.pointerType === "touch"; }}
                    onPointerEnter={(e) => { if (e.pointerType === "mouse") showTip(m, e.currentTarget); }}
                    onPointerLeave={(e) => { if (e.pointerType === "mouse") setTip(null); }}
                    onFocus={(e) => { if (e.currentTarget.matches(":focus-visible")) showTip(m, e.currentTarget); }}
                    onBlur={() => setTip(null)}
                    onClick={(e) => {
                      // Touch: the first tap names the medal, the second opens it. (detail 0 is the keyboard.)
                      if (touch.current && e.detail !== 0 && tip?.m !== m) return showTip(m, e.currentTarget);
                      setTip(null);
                      setOpen(i + 1);
                    }}
                  >
                    <img
                      src={`/work/medals/wall/xs/${m.num}.webp`}
                      srcSet={`/work/medals/wall/xs/${m.num}.webp 144w, /work/medals/wall/sm/${m.num}.webp 280w`}
                      sizes="72px" // the 144w file is sharp enough in an ~80px cell at 2x; 280w is for 3x phones
                      alt=""
                      width={144}
                      height={144}
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                </li>
              )),
            )}
          </ul>

          {tip && (
            <div
              id="medal-tip"
              role="tooltip"
              className="medal-tip"
              style={{ "--x": `${tip.x}px`, "--y": `${tip.y}px` } as React.CSSProperties}
            >
              <strong>{tip.m.name}</strong>
              {tip.m.fullName && tip.m.fullName !== tip.m.name && <span>{tip.m.fullName}</span>}
              <span>{[tip.m.year ?? "Year not on the medal", tip.m.tier].filter(Boolean).join(" · ")}</span>
              {touch.current && <em>Tap again to open</em>}
            </div>
          )}
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
