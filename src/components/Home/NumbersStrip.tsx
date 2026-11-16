import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { medals } from "../../content/medals";
import useIsMobile from "../../hooks/useIsMobile";
import { Counter, usePageVisible, useReducedMotion, useVisible } from "../../lib/motion";
import { MAP_H, MAP_W, SALVADOR, STATES } from "./Numbers/brazilMap";
import SchoolScene from "./Numbers/SchoolScene";
import "../../styles/components/home/numbersStrip.scss";

// The numbers the rest of the section doesn't already show, each as a drawing:
// one of the 28 schools, the real medals in a case, a map of where the laptops went.
const STUDENTS = 3392;
const BAHIA = 17; // schools, as in the Candela story above (Bahia 17, Ceará 11)
const CEARA = 11;
const OLYMPIADS = 38;
const GOLD = 19;
const LAPTOPS = 121;
// The five states no laptop went to (the owner's list). The Federal District
// is not a state and is not counted either way.
const NOT_REACHED = ["AC", "AM", "RR", "AP", "MS"];
const stateKind = (uf: string) => (uf === "DF" ? "df" : NOT_REACHED.includes(uf) ? "out" : "lit");
const REACHED = STATES.filter((s) => stateKind(s.uf) === "lit");
// The international ones are the Mathématiques sans Frontières golds.
const isInternational = (k: number) => medals[k].fullName?.includes("Internacional") ?? false;
const INTERNATIONAL = medals.filter((_, k) => isInternational(k)).length;

const delay = (n: number) => ({ "--i": n }) as CSSProperties;

// Pointer and arrow keys pick one mark of a drawing; Escape or leaving clears it.
const pick = (set: (k: number | null) => void) => (e: PointerEvent) => {
  const k = (e.target as Element).closest("[data-k]")?.getAttribute("data-k");
  set(k == null ? null : Number(k));
};
// A finger lifts with a pointerleave right after the tap: only a mouse leaving clears the pick.
const leave = (set: (k: number | null) => void) => (e: PointerEvent) => {
  if (e.pointerType === "mouse") set(null);
};
const stepper = (at: number | null, n: number, set: (k: number | null) => void) => (e: KeyboardEvent) => {
  const by = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
  if (e.key === "Escape") set(null);
  if (!by) return;
  e.preventDefault();
  set(at === null ? (by > 0 ? 0 : n - 1) : (at + by + n) % n);
};

if (import.meta.env.DEV) {
  console.assert(medals.length + 10 === OLYMPIADS && INTERNATIONAL === 5 && REACHED.length === 21, "NumbersStrip: the drawings must match the stated numbers");
}

// ── One school of the 28 ────────────────────────────────────────────────────
function Schools({ phone }: { phone: boolean }) {
  return (
    <div className="numbers-strip__art ns-school-box" aria-hidden="true">
      <SchoolScene phone={phone} />
      <p className="ns-school-count">
        <span><em>× {BAHIA + CEARA}</em> schools</span>
        <span>{BAHIA} Bahia · {CEARA} Ceará</span>
      </p>
    </div>
  );
}

// ── 38 olympiads, 28 medals ─────────────────────────────────────────────────
// A display case with a well per olympiad: the 28 real medals (the same cut-outs
// as the wall above, so already cached), then 10 empty wells.
function Case({ at, setAt }: { at: number | null; setAt: (k: number | null) => void }) {
  return (
    <div
      className="numbers-strip__art ns-pick-box ns-case"
      role="group"
      tabIndex={0}
      aria-label="A case with a place for each olympiad. Use the arrow keys to go through them."
      onKeyDown={stepper(at, OLYMPIADS, setAt)}
      onBlur={() => setAt(null)}
      onPointerOver={pick(setAt)}
      onPointerLeave={leave(setAt)}
    >
      <ol className="ns-case__wells" aria-hidden="true">
        {Array.from({ length: OLYMPIADS }, (_, k) => {
          const medal = medals[k];
          const kind = !medal ? " is-empty" : isInternational(k) ? " is-intl" : "";
          return (
            <li key={k} data-k={k} className={`ns-case__well${kind}${k === at ? " is-at" : ""}`} style={delay(k)}>
              {medal && <img src={`/work/medals/wall/xs/${medal.num}.webp`} alt="" width={144} height={144} loading="lazy" decoding="async" draggable={false} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Where the 121 laptops went ──────────────────────────────────────────────
// A thin arc from Salvador to each state reached, lit nearest first: word of mouth.
const [SX, SY] = SALVADOR;
const arcTo = ([cx, cy]: [number, number]) => {
  const [dx, dy] = [cx - SX, cy - SY];
  const up = dx > 0 ? -0.2 : 0.2; // always bulging towards the top of the map
  return `M${SX} ${SY}Q${((SX + cx) / 2 - dy * up).toFixed(1)} ${((SY + cy) / 2 + dx * up).toFixed(1)} ${cx} ${cy}`;
};

function BrazilMap({ phone, at, setAt }: { phone: boolean; at: number | null; setAt: (k: number | null) => void }) {
  return (
    <div
      className="numbers-strip__art ns-pick-box"
      role="group"
      tabIndex={0}
      aria-label="Map of Brazil. Use the arrow keys to go through the states."
      onKeyDown={stepper(at, STATES.length, setAt)}
      onBlur={() => setAt(null)}
    >
      <svg className="ns-map" viewBox={`0 0 ${MAP_W + (phone ? 0 : 50)} ${MAP_H}`} aria-hidden="true" onPointerOver={pick(setAt)} onPointerLeave={leave(setAt)}>
        {STATES.map((s, k) => <path key={s.uf} data-k={k} className={`ns-map__state is-${stateKind(s.uf)}`} d={s.d} />)}
        {STATES.map((s, k) => stateKind(s.uf) === "lit" && <path key={s.uf} data-k={k} className="ns-map__lit" style={delay(k)} d={s.d} />)}
        {STATES.map((s, k) => stateKind(s.uf) === "lit" && s.uf !== "BA" && (
          <g key={s.uf} className="ns-map__arc" style={delay(k)}>
            <path d={arcTo(s.c)} />
            <circle cx={s.c[0]} cy={s.c[1]} r={1.3} />
          </g>
        ))}
        {at !== null && <path className="ns-map__at" d={STATES[at].d} />}
        {/* Salvador, and the bench the laptops were opened on (on a phone a key entry names it). */}
        {!phone && <g>
        <path className="ns-dash" d={`M${SX + 4} ${SY + 2.5}L${SX + 27} ${SY + 16}`} />
        <g transform={`translate(${SX + 38} ${SY + 30})`}>
          <rect className="ns-paper" x={-9} y={-15} width={18} height={12.4} rx={1.6} />
          <rect className="ns-orange" x={-6.4} y={-12.4} width={12.8} height={7.2} rx={0.8} />
          <path className="ns-paper" d="M-12-1.6h24l-2.2 3h-19.6z" />
          <path className="ns-line" d="M12.5-9.5l4.2-5.6" />
          <path className="ns-map__handle" d="M17.6-16.2l2.6-3.4" />
          <text className="ns-tag" y={12} textAnchor="middle">SALVADOR</text>
        </g>
        </g>}
        <circle className="ns-map__pulse" cx={SX} cy={SY} r={3} />
        <circle className="ns-map__pin" cx={SX} cy={SY} r={2.8} />
      </svg>
    </div>
  );
}

// One fact: its drawing, then the number and its words. Each one arrives on its
// own, the first time it is on screen in a visible tab.
function Fact({ kind, art, value, label, note, children, hl }: {
  kind: string; art: ReactNode; value: number; label: string; note: ReactNode; children?: ReactNode; hl?: string;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const shown = useVisible(ref, { once: true, rootMargin: "0px 0px -25% 0px" });
  const pageVisible = usePageVisible();
  const reduced = useReducedMotion();
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (shown && pageVisible) setStarted(true);
  }, [shown, pageVisible]);

  return (
    <li ref={ref} className={`numbers-strip__cell numbers-strip__cell--${kind}${reduced ? "" : started ? " is-in" : " is-armed"}`} data-hl={hl}>
      {art}
      <span className="numbers-strip__figure">
        {started && !reduced ? <Counter value={value} duration={1500} /> : value.toLocaleString("en-US")}
      </span>
      <span className="numbers-strip__label">{label}</span>
      <span className="numbers-strip__note">{note}</span>
      {children && <div className="numbers-strip__extra">{children}</div>}
    </li>
  );
}

const names = (list: typeof STATES) => list.map((s) => s.name).join(", ");

export default function NumbersStrip() {
  const phone = useIsMobile(600);
  // The medal key: hover or focus previews a group, a click or tap keeps it.
  const [pinned, setPinned] = useState<string | null>(null);
  const [peek, setPeek] = useState<string | null>(null);
  const [medal, setMedal] = useState<number | null>(null);
  const [at, setAt] = useState<number | null>(null);

  const key = (kind: string, text: string) => (
    <button
      type="button"
      className={`is-${kind}`}
      aria-pressed={pinned === kind}
      onClick={() => setPinned((p) => (p === kind ? null : kind))}
      onPointerEnter={(e) => e.pointerType === "mouse" && setPeek(kind)}
      onPointerLeave={() => setPeek(null)}
      onFocus={() => setPeek(kind)}
      onBlur={() => setPeek(null)}
    >
      <i className="ns-key__dot" />{text}
    </button>
  );
  const here = at === null ? null : STATES[at];

  return (
    <ul className="numbers-strip" aria-label="By the numbers">
      <Fact
        kind="town"
        art={<Schools phone={phone} />}
        value={STUDENTS}
        label="students reached"
        note={<>in {BAHIA + CEARA} public schools in Bahia and Ceará, with Projeto Candela<span className="sr-only"> ({BAHIA} in Bahia, {CEARA} in Ceará)</span></>}
      />

      <Fact
        kind="medals"
        art={<Case at={medal} setAt={setMedal} />}
        value={OLYMPIADS}
        label="olympiads"
        note={`${medals.length} ended in a medal, ${GOLD} of them gold`}
        hl={peek ?? pinned ?? undefined}
      >
        <p className="ns-key" role="group" aria-label="Highlight in the drawing">
          {key("intl", `${INTERNATIONAL} international`)}
          {key("bare", `${OLYMPIADS - medals.length} without a medal`)}
        </p>
        <p className="ns-caption" aria-live="polite">
          {medal === null
            ? `${phone ? "Tap" : "Point at"} a medal for its name`
            : medals[medal]
              ? [medals[medal].name, medals[medal].year].filter(Boolean).join(" · ")
              : "An olympiad without a medal"}
        </p>
      </Fact>

      <Fact
        kind="map"
        art={<BrazilMap phone={phone} at={at} setAt={setAt} />}
        value={LAPTOPS}
        label="laptops repaired"
        note={`sent to ${REACHED.length} states, all by referral`}
      >
        <p className="ns-key" aria-hidden="true">
          <span className="is-lit"><i className="ns-key__dot" />shipped there</span>
          <span className="is-out"><i className="ns-key__dot" />not reached</span>
          <span className="is-pin"><i className="ns-key__dot" />Salvador</span>
        </p>
        <p className="ns-caption" aria-live="polite">
          {here
            ? `${here.name}: ${{ lit: "shipped there", out: "not reached", df: "not a state, not counted" }[stateKind(here.uf)]}`
            : `Not reached: ${names(STATES.filter((s) => stateKind(s.uf) === "out"))}`}
        </p>
        <p className="sr-only">Shipped to {names([...REACHED].sort((a, b) => a.name.localeCompare(b.name)))}.</p>
      </Fact>
    </ul>
  );
}
