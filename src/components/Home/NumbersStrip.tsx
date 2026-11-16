import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Counter, usePageVisible, useReducedMotion, useVisible } from "../../lib/motion";
import "../../styles/components/home/numbersStrip.scss";

// The numbers the rest of the section doesn't already show, each drawn one unit
// at a time: a dot per student, a medal hook per olympiad, a laptop per laptop.
const STUDENTS = 3392;
const SCHOOLS = 28;
const OLYMPIADS = 38;
const MEDALS = 28;
const GOLD = 19;
const INTERNATIONAL = 5; // the five Mathématiques sans Frontières golds (content/medals.ts)
const LAPTOPS = 121;
const STATES = 21;
const ALL_STATES = 26; // "21 of Brazil's 26 states" (content/story.ts)

const i = (n: number) => ({ "--i": n }) as CSSProperties;

// ── 3,392 dots in 28 discs ──────────────────────────────────────────────────
// Which school had how many students isn't stated anywhere, so every disc gets
// the same share (121, and 122 in the first four). One path per disc: the dots
// are zero-length strokes with round caps, so 3,392 students cost 28 DOM nodes.
const PER_SCHOOL = Math.floor(STUDENTS / SCHOOLS);
const sunflower = (n: number) =>
  Array.from({ length: n }, (_, k) => {
    const r = 1.72 * Math.sqrt(k + 0.5);
    const a = k * 2.39996; // golden angle
    return `M${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}h.01`;
  }).join("");
const DISC = [sunflower(PER_SCHOOL), sunflower(PER_SCHOOL + 1)];
const DISC_SIZES = Array.from({ length: SCHOOLS }, (_, k) => PER_SCHOOL + (k < STUDENTS % SCHOOLS ? 1 : 0));
if (import.meta.env.DEV) {
  console.assert(DISC_SIZES.reduce((a, b) => a + b, 0) === STUDENTS, "NumbersStrip: the discs must add up to every student");
}

function Schools() {
  return (
    <div className="ns-schools">
      {DISC_SIZES.map((size, k) => (
        <svg
          key={k}
          viewBox="-21 -21 42 42"
          // Each disc pours in from its own spot above the field.
          style={{ ...i(k), "--dx": `${((k * 37) % 11) * 8 - 40}px`, "--dy": `${-34 - ((k * 53) % 7) * 9}px` } as CSSProperties}
        >
          <path d={DISC[size - PER_SCHOOL]} transform={`rotate(${k * 47})`} />
        </svg>
      ))}
    </div>
  );
}

// ── 38 hooks on two rails, 28 with a medal ──────────────────────────────────
type MedalKind = "gold" | "intl" | "medal" | "none";
const kindsOf = (k: number): MedalKind[] =>
  k < INTERNATIONAL ? ["gold", "intl"] : k < GOLD ? ["gold"] : k < MEDALS ? ["medal"] : ["none"];
const PER_RAIL = OLYMPIADS / 2;
const RAILS = [22, 104];

function Medals() {
  return (
    <svg className="ns-medals" viewBox="0 0 300 176">
      {RAILS.map((y) => <path key={y} className="ns-medals__rail" d={`M6 ${y}H294`} />)}
      {Array.from({ length: OLYMPIADS }, (_, k) => {
        const x = 15 + (k % PER_RAIL) * 15;
        const y = RAILS[Math.floor(k / PER_RAIL)];
        const kinds = kindsOf(k);
        return (
          <g key={k} className={`ns-medal ${kinds.map((kind) => `is-${kind}`).join(" ")}`} style={i(k)}>
            <path d={`M${x - 3.4} ${y}L${x} ${y + 38}L${x + 3.4} ${y}`} />
            <circle cx={x} cy={y + 44} r={6.2} />
            {kinds.includes("intl") && <circle className="ns-medal__ring" cx={x} cy={y + 44} r={2.7} />}
          </g>
        );
      })}
    </svg>
  );
}

const MEDAL_KEYS: { kind: MedalKind; text: string }[] = [
  { kind: "gold", text: `${GOLD} gold` },
  { kind: "intl", text: `${INTERNATIONAL} international` },
  { kind: "medal", text: `${MEDALS - GOLD} more medals` },
  { kind: "none", text: `${OLYMPIADS - MEDALS} without` },
];

// ── 121 laptops on one thread ───────────────────────────────────────────────
// "All by referral": the laptops sit on a single line that snakes down the
// card. They are in chain order in the DOM, so CSS can light the chain up to
// the one under the pointer.
const COLS = 11;
const ROW_H = 15.2;
const rowY = (r: number) => 15.5 + r * ROW_H;
const LAPTOP_ROWS = Math.ceil(LAPTOPS / COLS);
const THREAD = Array.from({ length: LAPTOP_ROWS }, (_, r) => {
  const toRight = r % 2 === 0;
  const turn = r < LAPTOP_ROWS - 1 ? `a${ROW_H / 2} ${ROW_H / 2} 0 0 ${toRight ? 1 : 0} 0 ${ROW_H}` : "";
  return `H${toRight ? 290 : 10}${turn}`;
}).join("");

function Laptops() {
  return (
    <svg className="ns-laptops" viewBox="0 0 300 176">
      <defs>
        <g id="ns-laptop">
          <rect x="-5.5" y="-9.5" width="11" height="7.6" rx="1.3" />
          <path d="M-8 0H8" />
        </g>
      </defs>
      <path className="ns-laptops__thread" d={`M10 ${rowY(0)}${THREAD}`} />
      {Array.from({ length: LAPTOPS }, (_, k) => {
        const r = Math.floor(k / COLS);
        const c = r % 2 === 0 ? k % COLS : COLS - 1 - (k % COLS);
        return <use key={k} href="#ns-laptop" x={20 + c * 26} y={rowY(r)} style={i(k)} />;
      })}
    </svg>
  );
}

// One fact: its drawing, then the number and its words. Each one arrives on its
// own, the first time it is on screen in a visible tab (on a phone they stack).
function Fact({ art, value, label, note, children, hl }: {
  art: ReactNode; value: number; label: string; note: string; children: ReactNode; hl?: string;
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
    <li ref={ref} className={reduced ? undefined : started ? "is-in" : "is-armed"} data-hl={hl}>
      <div className="numbers-strip__art" aria-hidden="true">{art}</div>
      <span className="numbers-strip__figure">
        {started && !reduced ? <Counter value={value} duration={1500} /> : value.toLocaleString("en-US")}
      </span>
      <span className="numbers-strip__label">{label}</span>
      <span className="numbers-strip__note">{note}</span>
      {children}
    </li>
  );
}

export default function NumbersStrip() {
  // The medal key: hover or focus previews a group, a click or tap keeps it.
  const [pinned, setPinned] = useState<MedalKind | null>(null);
  const [peek, setPeek] = useState<MedalKind | null>(null);

  return (
    <ul className="numbers-strip" aria-label="By the numbers">
      <Fact art={<Schools />} value={STUDENTS} label="students reached" note={`in ${SCHOOLS} public schools, with Projeto Candela`}>
        <p className="ns-key" aria-hidden="true">
          <span><i className="ns-key__dot" />1 student</span>
          <span><i className="ns-key__disc" />1 school, all drawn the same size</span>
        </p>
      </Fact>

      <Fact art={<Medals />} value={OLYMPIADS} label="olympiads" note={`${MEDALS} of them ended in a medal`} hl={peek ?? pinned ?? undefined}>
        <p className="ns-key" role="group" aria-label="Highlight in the drawing">
          {MEDAL_KEYS.map(({ kind, text }) => (
            <button
              key={kind}
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
          ))}
        </p>
      </Fact>

      <Fact art={<Laptops />} value={LAPTOPS} label="laptops repaired" note={`sent to ${STATES} states, all by referral`}>
        <p className="ns-key">
          <span aria-hidden="true"><i className="ns-key__thread" />word of mouth</span>
          <span className="ns-key__states">
            <span className="ns-states" aria-hidden="true">
              {Array.from({ length: ALL_STATES }, (_, k) => <i key={k} className={k < STATES ? "is-on" : undefined} style={i(k)} />)}
            </span>
            {STATES} of {ALL_STATES} states
          </span>
        </p>
      </Fact>
    </ul>
  );
}
