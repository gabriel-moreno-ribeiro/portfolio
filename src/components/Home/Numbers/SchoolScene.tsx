import type { CSSProperties } from "react";

// One public school out of the 28: a mango tree, the painted lower band, grilles
// on the windows, a cobogó panel, children in uniform, and the Candela kit open
// on a desk with a ball on its ramp. Light lines, one orange.
const f = (n: number) => Math.round(n * 10) / 10;
const rand = (n: number) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};
const delay = (n: number) => ({ "--i": n }) as CSSProperties;

// Feet at (x, y), scale s; arms: 0 down, 1 waving, 2 pointing right, 3 pointing left, 4 holding the next one's hand.
type Kid = [x: number, y: number, s: number, arms?: number];
const ARMS = ["L4.3 9.5", "L5.6 22", "L8.4 14.6", "L4.3 9.5", "L8 10.5"];
const LEFT_ARMS = ["L-4.3 9.5", "L-4.3 9.5", "L-4.3 9.5", "L-8.4 14.6", "L-4.3 9.5"];

// A child with feet at (x, y), scale s; v picks the hair (short, puff, ponytail, bun, long).
function Child({ at: [x, y, s, arms = 0], v, pack, i }: { at: Kid; v: number; pack: boolean; i: number }) {
  const X = (d: number) => f(x + d * s);
  const Y = (d: number) => f(y - d * s);
  const S = (d: number) => f(d * s);
  const cy = Y(19.6);
  const dot = (cx: number, cyy: number, r: number) => `M${f(cx - r)} ${cyy}a${r} ${r} 0 1 0 ${f(2 * r)} 0a${r} ${r} 0 1 0 ${f(-2 * r)} 0z`;
  const hair = v % 5;
  const arm = (side: number, to: string) => {
    const [ax, ay] = to.slice(1).split(" ").map(Number);
    return `M${X(3 * side)} ${Y(15)}L${X(ax)} ${Y(ay)}`;
  };
  const back =
    hair === 1 ? dot(x, f(cy - S(0.8)), S(4.6))
    : hair === 2 ? `M${X(2.4)} ${f(cy - S(1.4))}q${S(3.6)} ${S(0.4)} ${S(2.4)} ${S(5)}q${S(-1.8)} ${S(-1.6)} ${S(-2.4)} ${S(-5)}z`
    : hair === 4 ? `M${X(-3.8)} ${f(cy - S(1))}V${f(cy + S(4.4))}H${X(3.8)}V${f(cy - S(1))}z`
    : "";
  const cap = `M${X(-3.4)} ${f(cy + S(0.4))}a${S(3.4)} ${S(3.4)} 0 0 1 ${S(6.8)} 0q${S(-3.4)} ${S(-2)} ${S(-6.8)} 0z`;
  const front = hair === 1 ? "" : cap + (hair === 3 ? dot(x, f(cy - S(4)), S(1.6)) : "");
  return (
    <g className="ns-school__kid" style={delay(i)}>
      {pack && <path className="ns-orange" d={`M${X(-4.4)} ${Y(15.2)}h${S(2)}v${S(6)}h${S(-2)}z`} />}
      {back && <path className="ns-ink" d={back} />}
      <path className="ns-thin" d={`M${X(-1.4)} ${f(y)}V${Y(6)}M${X(1.4)} ${f(y)}V${Y(6)}${arm(-1, LEFT_ARMS[arms])}${arm(1, ARMS[arms])}`} />
      <path className="ns-school__uniform" d={v % 2 ? `M${X(-2.6)} ${Y(9)}L${X(-3.8)} ${Y(4.6)}H${X(3.8)}L${X(2.6)} ${Y(9)}z` : `M${X(-2.8)} ${Y(9)}V${Y(5)}H${X(2.8)}V${Y(9)}z`} />
      <path
        className="ns-paper"
        d={`M${X(-3)} ${Y(9)}V${Y(14.4)}Q${X(-3)} ${Y(16)} ${X(-1.4)} ${Y(16)}H${X(1.4)}Q${X(3)} ${Y(16)} ${X(3)} ${Y(14.4)}V${Y(9)}z${dot(x, cy, S(3.2))}`}
      />
      {front && <path className="ns-ink" d={front} />}
    </g>
  );
}

// Under the tree, around the desk, and a line coming in
// from the right, some in pairs. Taller and shorter ones: not every pupil is the same age.
const TREE: Kid[] = [[38, 198, 1.2], [58, 196, 1], [82, 199, 1.3, 1], [108, 197, 1.1], [132, 199, 1.24]];
const DESK: Kid[] = [[180, 199, 1.24, 2], [197, 196, 1.08, 2], [344, 199, 1.22, 3], [360, 196, 1.1, 3]];
const LINE: Kid[] = [
  [388, 199, 1.14, 4], [402, 198, 1.06], [428, 195, 1.28], [452, 199, 1.2, 4], [467, 198, 1.1],
  [492, 196, 1.26, 1], [516, 199, 1.12, 4], [530, 198, 1.04], [554, 195, 1.24], [578, 199, 1.18],
];
const KIDS = [...TREE, ...DESK, ...LINE];

const WINDOWS = [166, 198, 230, 330, 362];
const COBOGO = Array.from({ length: 12 }, (_, k) => `M${f(410.2 + (k % 4) * 6)} ${f(116 + Math.floor(k / 4) * 6)}a2.2 2.2 0 1 0-4.4 0a2.2 2.2 0 1 0 4.4 0`).join("");
const MANGOES = [[58, 110], [104, 116], [118, 96], [70, 88], [90, 104]].map(([x, y]) => `M${x} ${y}a3 4 0 1 0 .1 0z`).join("");

const SCENE_W = 610;
const SCENE_H = 146;
// The phone keeps the flag, the school, the desk and the line, and leaves the tree out.
const PHONE: [number, number] = [145, 598];

export default function SchoolScene({ phone }: { phone: boolean }) {
  const [x0, x1] = phone ? PHONE : [0, SCENE_W];
  return (
    <svg className="ns-school" viewBox={`${x0} 58 ${x1 - x0} ${SCENE_H}`}>
      <path className="ns-ground" d="M0 170H590" />
      {/* The tree and the school stand on the back line (y 170); the children on the front one. */}
      <ellipse className="ns-school__shade" cx="86" cy="198" rx="54" ry="5" />
      <path className="ns-line" d="M84 170c2-16-1-30 3-44M94 170c-1-16 2-28-2-44M88 144l-12-12M91 140l12-10" />
      <path className="ns-school__leaves" d="M38 106c-8-18 8-36 26-32c4-17 30-22 42-9c16-6 34 6 30 23c13 8 8 30-8 31c-5 13-25 14-33 6c-11 8-31 5-35-6c-15 1-27-6-22-13z" />
      <path className="ns-orange" d={MANGOES} />

      <path className="ns-paper" d="M150 170V104H440V170" />
      <path className="ns-school__band" d="M150 144H440V170H150z" />
      <path className="ns-line" d="M150 144H440" />
      <path className="ns-paper" d="M142 105L160 88H430L448 105z" />
      <path className="ns-thin" d="M152 96.5H438" />
      {WINDOWS.map((x) => (
        <g key={x}>
          <rect className="ns-paper" x={x} y={114} width={22} height={19} rx={1} />
          <path className="ns-thin" d={`M${x + 5.5} 114v19M${x + 11} 114v19M${x + 16.5} 114v19M${x} 123.5h22`} />
        </g>
      ))}
      <path className="ns-thin" d={COBOGO} />
      <rect className="ns-paper" x={276} y={98} width={38} height={72} />
      <path className="ns-paper" d="M270 100L295 82L320 100z" />
      <rect className="ns-school__plate" x={281} y={105} width={28} height={7} rx={1} />
      <rect className="ns-paper" x={283} y={126} width={24} height={44} />
      <path className="ns-thin" d="M287 126v44M291 126v44M295 126v44M299 126v44M303 126v44" />
      <path className="ns-line" d="M147 170V74" />
      <path className="ns-orange" d="M147 74h14l-3 5 3 5h-14z" />

      {/* The kit on a desk: a pendulum, the open box, a ball at the foot of its ramp. */}
      <path className="ns-paper" d="M206 177H324V181H206z" />
      <path className="ns-line" d="M212 181V199M318 181V199M214 177V148H233" />
      <g className="ns-school__pendulum">
        <path className="ns-thin" d="M230 148V167" />
        <circle className="ns-orange" cx={230} cy={169.5} r={3} />
      </g>
      <path className="ns-paper" d="M243 166V157H277V166" />
      <path className="ns-orange" d="M248 162h7v4h-7z" />
      <path className="ns-line" d="M262 166L266 154" />
      <path className="ns-paper" d="M240 165H280V177H240z" />
      <path className="ns-line" d="M281 166L322 177" />
      <path className="ns-thin" d="M318 176v-4" />
      <circle className="ns-orange ns-school__ball" cx={316} cy={173} r={3} />

      {KIDS.map((k, i) => (
        <Child key={i} at={k} v={Math.floor(rand(i * 3 + 1) * 5) + i} pack={rand(i * 7 + 2) < 0.3} i={i} />
      ))}
    </svg>
  );
}
