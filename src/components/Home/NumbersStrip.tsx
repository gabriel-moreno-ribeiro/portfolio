import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { medals } from "../../content/medals";
import useIsMobile from "../../hooks/useIsMobile";
import { Counter, usePageVisible, useReducedMotion, useVisible } from "../../lib/motion";
import { MAP_H, MAP_W, SALVADOR, STATES } from "./Numbers/brazilMap";
import "../../styles/components/home/numbersStrip.scss";

// The numbers the rest of the section doesn't already show, each as a drawing:
// a town of the 28 schools, the real medals on a rail, a map of where the laptops went.
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
// A steady pseudo-random number per index, so the drawing is the same on every render.
const rand = (n: number) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

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

// ── 28 schoolhouses ─────────────────────────────────────────────────────────
// Rows are [first x, pitch, how many, ground y]; Bahia's come first.
type Row = [number, number, number, number];
type Tag = { text: string; x: number; y: number; bracket?: [number, number] };
type Plan = { w: number; h: number; rows: Row[]; kit: [number, number]; arc?: string; tags: Tag[] };
const TOWN: Plan = {
  w: 600, h: 152,
  rows: [[92, 32, 9, 58], [108, 32, 8, 113], [402, 32, 6, 58], [418, 32, 5, 113]],
  kit: [12, 72],
  arc: "M36 64C110 2 430 -6 574 26",
  tags: [
    { text: `BAHIA · ${BAHIA}`, x: 220, y: 147, bracket: [78, 362] },
    { text: `CEARÁ · ${CEARA}`, x: 482, y: 147, bracket: [388, 576] },
  ],
};
const TOWN_PHONE: Plan = {
  w: 340, h: 192,
  rows: [[66, 32, 9, 46], [82, 32, 8, 97], [20, 30, 11, 172]],
  kit: [4, 62],
  tags: [{ text: `BAHIA · ${BAHIA}`, x: 4, y: 11 }, { text: `CEARÁ · ${CEARA}`, x: 4, y: 128 }],
};
const spots = (plan: Plan) => plan.rows.flatMap(([x0, pitch, count, y]) => Array.from({ length: count }, (_, k) => [x0 + k * pitch, y]));
if (import.meta.env.DEV) {
  console.assert(spots(TOWN).length === BAHIA + CEARA && spots(TOWN_PHONE).length === BAHIA + CEARA, "NumbersStrip: the town must have every school");
  console.assert(medals.length + 10 === OLYMPIADS && INTERNATIONAL === 5 && REACHED.length === 21, "NumbersStrip: the drawings must match the stated numbers");
}

// Three kinds of schoolhouse: gabled, long and low, two floors.
const WALL = [[22, 15, 9], [26, 12, 6], [20, 20, 7]];
function House({ x, y, n }: { x: number; y: number; n: number }) {
  const v = n % 3;
  const [w, h, roof] = WALL[v];
  const top = y - h;
  const win = (wx: number, wy: number) => `M${wx - 1.5} ${wy}h3v3h-3z`;
  const side = v === 1 ? 8 : 6.5;
  return (
    <g className="ns-town__house" style={delay(Math.round(x / 22))}>
      <rect className="ns-paper" x={x - w / 2} y={top} width={w} height={h} rx={1} />
      <path className="ns-ink" d={v === 1 ? `M${x - w / 2 - 2} ${top}l4 ${-roof}h${w - 4}l4 ${roof}z` : `M${x - w / 2 - 2} ${top}L${x} ${top - roof}L${x + w / 2 + 2} ${top}z`} />
      <path className="ns-orange" d={`M${x - 2} ${y - 0.6}v-4.4a2 2 0 0 1 4 0v4.4z`} />
      <path className="ns-ink" d={win(x - side, top + 3.5) + win(x + side, top + 3.5) + (v === 2 ? win(x - side, top + 11.5) + win(x + side, top + 11.5) : "")} />
      {n % 2 === 0 && (
        <>
          <path className="ns-line" d={`M${x} ${top - roof}v-7`} />
          <path className="ns-orange" d={`M${x} ${top - roof - 7}l5 1.8l-5 1.8z`} />
        </>
      )}
    </g>
  );
}

// A few pupils at each door: a head and a body, some with an orange backpack.
function Pupils({ x, y, n }: { x: number; y: number; n: number }) {
  let ink = "";
  let packs = "";
  const count = 3 + (rand(n) > 0.55 ? 1 : 0);
  for (let k = 0; k < count; k++) {
    const px = Math.round((x - 3.4 * (count - 1) + k * 6.8 + rand(n * 7 + k) * 1.4) * 10) / 10;
    const py = Math.round((y + 14 + rand(n * 13 + k) * 3) * 10) / 10;
    ink += `M${px - 2.2} ${py - 8}a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0M${px - 2.6} ${py}v-3.4a2.6 2.6 0 0 1 5.2 0v3.4z`;
    if (rand(n * 3 + k) < 0.3) packs += `M${px - 4.1} ${py - 5}h2.1v3.4h-2.1z`;
  }
  return (
    <g className="ns-town__pupils" style={delay(Math.round(x / 22))}>
      <path className="ns-ink" d={ink} />
      {packs && <path className="ns-orange" d={packs} />}
    </g>
  );
}

function Town({ phone }: { phone: boolean }) {
  const plan = phone ? TOWN_PHONE : TOWN;
  const [kx, ky] = plan.kit;
  return (
    <div className="numbers-strip__art" aria-hidden="true" style={{ aspectRatio: `${plan.w} / ${plan.h}` }}>
      <svg className="ns-town" viewBox={`0 0 ${plan.w} ${plan.h}`}>
        {plan.rows.map(([x0, pitch, count, y], r) => <path key={r} className="ns-ground" d={`M${x0 - 20} ${y}H${x0 + (count - 1) * pitch + 20}`} />)}
        {plan.arc && (
          <g className="ns-town__arc">
            <path className="ns-dash" d={plan.arc} />
            <path className="ns-ink" d="M576 27l-7.4-0.4l3.4-5.4z" />
          </g>
        )}
        {/* The kit box everything starts from, as in the clay story above. */}
        <rect className="ns-paper" x={kx} y={ky} width={44} height={22} rx={2} />
        <path className="ns-line" d={`M${kx} ${ky + 7}h44`} />
        <rect className="ns-orange" x={kx + 10} y={ky + 11} width={24} height={6} rx={1} />
        {!phone && <text className="ns-tag" x={kx + 22} y={ky + 35} textAnchor="middle">THE KIT</text>}
        {spots(plan).map(([x, y], n) => <House key={n} x={x} y={y} n={n} />)}
        {spots(plan).map(([x, y], n) => <Pupils key={n} x={x} y={y} n={n} />)}
        {plan.tags.map((t) => (
          <g key={t.text}>
            {t.bracket && <path className="ns-bracket" d={`M${t.bracket[0]} ${t.y - 15}v4H${t.bracket[1]}v-4`} />}
            <text className="ns-tag" x={t.x} y={t.y} textAnchor={t.bracket ? "middle" : "start"}>{t.text}</text>
          </g>
        ))}
      </svg>
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
        art={<Town phone={phone} />}
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
