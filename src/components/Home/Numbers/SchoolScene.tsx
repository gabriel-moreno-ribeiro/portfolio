import type { CSSProperties } from "react";

// One public school out of the 28, in the yard on a sunny morning: the painted
// school with a banner, a mango tree, a low wall with a gate, and the Candela kit
// (the wooden box, the inclined plane and its car) with the class gathered round
// it and the teacher timing the run. Ink lines, one orange, soft neutrals.
const delay = (n: number) => ({ "--i": n }) as CSSProperties;

// ── The children ────────────────────────────────────────────────────────────
// Drawn at feet (0,0), about 30 units tall. Legs hang from the hip; the upper
// body is drawn from the hip up and leans by `tilt`. Hands are in upper-body units.
type Pt = [number, number];
type Pose = { hip: number; legs: [Pt[], Pt[]]; tilt: number; hands: [Pt, Pt] };
const STAND: Pose["legs"] = [[[-1.6, -9], [-2, 0]], [[1.6, -9], [2, 0]]];
const POSES = {
  stand: { hip: 9, legs: STAND, tilt: 0, hands: [[-5.4, -1.2], [5.4, -1.2]] },
  wave: { hip: 9, legs: STAND, tilt: -3, hands: [[-5.4, -1.2], [7.2, -16.5]] },
  point: { hip: 9, legs: [[[-1.6, -9], [-2.6, 0]], [[1.6, -9], [2.6, 0]]], tilt: 5, hands: [[-5.2, -1], [11, -7.5]] },
  launch: { hip: 8.4, legs: [[[-1.6, -8.4], [-3.6, 0]], [[1.6, -8.4], [2.8, 0]]], tilt: 26, hands: [[8.4, -3], [10.4, -5]] },
  lean: { hip: 9, legs: [[[-1.6, -9], [-3.2, 0]], [[1.6, -9], [2.6, 0]]], tilt: 17, hands: [[-6, -3.4], [8.4, -2.4]] },
  crouch: { hip: 5, legs: [[[-1.6, -5], [-6, -4.6], [-4.4, 0]], [[1.6, -5], [6, -4.6], [4.4, 0]]], tilt: 10, hands: [[-5.4, 1.4], [7.4, -1]] },
  kneel: { hip: 6, legs: [[[-1.6, -6], [-2.6, -0.6], [-7.4, 0]], [[1.6, -6], [6.4, -6], [6.4, 0]]], tilt: 9, hands: [[-5, 0], [9.4, -4]] },
  run: { hip: 8.6, legs: [[[1.6, -8.6], [5.6, -4.6], [8.8, -2.2]], [[-1.6, -8.6], [-3, -3.6], [-5.2, 0]]], tilt: 15, hands: [[7.4, -7], [-6.2, 1]] },
  sit: { hip: 3, legs: [[[-1.6, -3], [-6.6, -1.2], [1, 0]], [[1.6, -3], [6.6, -1.2], [-1, 0]]], tilt: 0, hands: [[-2.6, -3.4], [2.8, -3.4]] },
  watch: { hip: 9, legs: STAND, tilt: -2, hands: [[-5.4, -1.2], [7.4, -13]] },
} satisfies Record<string, Pose>;
type PoseName = keyof typeof POSES;

const SKIN = ["#f2cba8", "#c58a5c", "#8a5636", "#e3ad84"];
const HAIR = ["#2a1d16", "#3a261a", "#5b3a24"];
const pts = (p: Pt[]) => "M" + p.map(([x, y]) => `${x} ${y}`).join("L");
const blob = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
// Hair over the head (front) and behind it (back), per style; the head is centred at (0,-14.2).
const CAP = "M-4.8 -14.2a4.8 4.8 0 0 1 9.6 0q-1.8-2.6-4.8-2.8q-3 .2-4.8 2.8z";
const HAIRDO: [back: string, front: string][] = [
  ["", CAP],
  [blob(0, -15.6, 6.2), ""],
  ["M3.4 -16.8q4.8 1 3.2 7.6q-1.6-2.6-4-5z", CAP],
  [blob(-5.4, -15.2, 1.9) + blob(5.4, -15.2, 1.9), CAP],
  ["M-5.3 -16.4V-9.6q0 1 1 1H4.3q1 0 1-1V-16.4z", CAP],
  [blob(0, -20, 2.1), CAP],
];
const TORSO = "M-4.2 0L-4.6 -7.8Q-4.6 -9.8 -2.6 -10.2H2.6Q4.6 -9.8 4.6 -7.8L4.2 0z";
const SHOULDER: Pt[] = [[-4, -8.6], [4, -8.6]];

// x, y (feet), scale, pose, facing (1 right, -1 left), look (skin, hair, backpack)
type Child = [number, number, number, PoseName, 1 | -1, number];

function Kid({ c: [x, y, s, pose, dir, look], i, adult }: { c: Child; i: number; adult?: boolean }) {
  const p: Pose = POSES[pose];
  const skin = SKIN[look % SKIN.length];
  const [back, front] = HAIRDO[adult ? 5 : look % HAIRDO.length];
  const hair = HAIR[look % HAIR.length];
  const shirt = adult ? "#f4c6a3" : "#fbf8f4";
  return (
    <g className="ns-school__kid" style={delay(i)}>
      <g transform={`translate(${x} ${y}) scale(${s * dir} ${s})`}>
        <ellipse className="ns-school__shadow" cx={1.6} cy={0.3} rx={adult ? 5 : 6} ry={1.3} />
        <path className="ns-school__limb" stroke={adult ? "#4b5260" : skin} d={p.legs.map(pts).join("")} />
        <path className="ns-school__shoe" d={p.legs.map((l) => { const [fx, fy] = l[l.length - 1]; return blob(fx, fy - 0.5, 1.3); }).join("")} />
        <rect className="ns-school__shorts" x={-4.1} y={-p.hip - 0.2} width={8.2} height={adult ? 2 : 3.6} rx={1} />
        <g transform={`translate(0 ${-p.hip}) rotate(${p.tilt})`}>
          {!adult && look % 4 === 1 && <rect className="ns-orange" x={-6.6} y={-9.8} width={4.2} height={7.6} rx={1.4} />}
          {back && <path fill={hair} d={back} />}
          <path className="ns-school__shirt" fill={shirt} d={TORSO} />
          {p.hands.map(([hx, hy], k) => {
            const [sx, sy] = SHOULDER[k];
            return (
              <g key={k}>
                <path className="ns-school__limb" stroke={skin} d={`M${sx} ${sy}L${hx} ${hy}`} />
                <path className="ns-school__sleeve" stroke={shirt} d={`M${sx} ${sy}L${sx + (hx - sx) * 0.32} ${sy + (hy - sy) * 0.32}`} />
              </g>
            );
          })}
          {/* The teacher's stopwatch. */}
          {adult && <circle className="ns-orange" cx={p.hands[1][0] + 0.4} cy={p.hands[1][1] - 1.8} r={1.9} />}
          <circle className="ns-school__head" fill={skin} cx={0} cy={-14.2} r={4.6} />
          {front && <path fill={hair} d={front} />}
          <path className="ns-school__eyes" d="M0.4 -13.4h.01M3 -13.4h.01" />
        </g>
      </g>
    </g>
  );
}

// Round the kit, the teacher with the stopwatch, three running in from the gate, two under the tree.
const KIDS: Child[] = [
  [200, 183, 0.88, "stand", 1, 2],
  [226, 181, 0.86, "point", 1, 5],
  [254, 182, 0.9, "launch", 1, 1],
  [288, 186, 0.92, "kneel", -1, 6],
  [184, 201, 1.08, "lean", 1, 3],
  [206, 203, 1.1, "crouch", 1, 4],
  [344, 203, 1.02, "point", -1, 7],
  [394, 201, 1.08, "run", -1, 9],
  [436, 195, 0.98, "run", -1, 10],
  [500, 188, 0.88, "run", -1, 13],
  [557, 184, 0.8, "wave", -1, 8],
  [52, 192, 1, "sit", 1, 11],
  [104, 190, 1, "wave", -1, 0],
  [130, 196, 1.04, "stand", 1, 12],
];
const TEACHER: Child = [322, 201, 1.42, "watch", -1, 3];

// ── The place ───────────────────────────────────────────────────────────────
const WINDOWS = [166, 200, 234, 328, 360, 392];
// Roof tiles: rows along the slope, each with staggered joints.
const TILES = [88, 94].map((y, r) => {
  const l = 142 + ((101 - y) * 22) / 19, rr = 428 - ((101 - y) * 16) / 19;
  let d = `M${l.toFixed(1)} ${y}H${rr.toFixed(1)}`;
  for (let x = l + 6 + r * 4; x < rr - 4; x += 9) d += `M${x.toFixed(1)} ${y}v${r ? 7 : 6}`;
  return d;
}).join("");
// The low wall runs from the school's corner towards us, with the gate in it.
const wallY = (x: number) => 166 + ((x - 452) * 14) / 158;
const wall = (a: number, b: number) =>
  `M${a} ${wallY(a) + 4}L${b} ${wallY(b) + 4}V${wallY(b) + 14}L${a} ${wallY(a) + 14}z`;
const cap = (a: number, b: number) => `M${a} ${wallY(a)}L${b} ${wallY(b)}V${wallY(b) + 4}L${a} ${wallY(a) + 4}z`;
const MANGOES = [[52, 116], [98, 122], [122, 102], [70, 94], [88, 108], [110, 88]];

const VIEW = { x: 0, w: 610, y: 56, h: 150 };
// The phone frames just the school, its banner and the class round the kit, so the
// banner stays 11px or more down to 320px wide and the children are bigger.
const PHONE = { x: 148, w: 300 };
// The car on the incline: it rests near the foot of the ramp; on arrival it rolls down from the top.
const RAMP: [Pt, Pt] = [[246, 179.2], [304, 195.2]];
const CAR_T = 0.8;
const CAR: Pt = [RAMP[0][0] + (RAMP[1][0] - RAMP[0][0]) * CAR_T, RAMP[0][1] + (RAMP[1][1] - RAMP[0][1]) * CAR_T];
const SLOPE = (Math.atan2(RAMP[1][1] - RAMP[0][1], RAMP[1][0] - RAMP[0][0]) * 180) / Math.PI;

export default function SchoolScene({ phone }: { phone: boolean }) {
  const v = phone ? { ...VIEW, ...PHONE } : VIEW;
  return (
    <svg className="ns-school" viewBox={`${v.x} ${v.y} ${v.w} ${v.h}`}>
      {/* The yard, the path to the door, and the shadow the school casts. */}
      {/* The yard fades out at both ends instead of stopping at an edge. */}
      <linearGradient id="ns-yard">
        <stop offset="0" className="ns-school__yard-stop" stopOpacity="0" />
        <stop offset="0.08" className="ns-school__yard-stop" />
        <stop offset="0.92" className="ns-school__yard-stop" />
        <stop offset="1" className="ns-school__yard-stop" stopOpacity="0" />
      </linearGradient>
      <path fill="url(#ns-yard)" d="M0 168H610V206H0z" />
      <path className="ns-school__path" d="M284 168H306L350 206H240z" />
      <path className="ns-school__shadow" d="M150 168H446L470 172Q300 178 158 173z" />

      {/* The mango tree. */}
      <ellipse className="ns-school__shadow" cx={98} cy={186} rx={54} ry={6} />
      <path className="ns-school__trunk" d="M73 172c3-14 3-28-1-40l6-2c3 10 4 21 6 26c3-8 8-16 14-22l4 4c-7 7-11 18-12 34z" />
      <path className="ns-school__leaves-dark" d="M28 110c-6-20 12-38 32-34c6-18 34-22 46-8c18-6 36 8 32 26c12 10 6 30-10 32c-6 12-28 14-36 6c-12 8-34 4-38-8c-16 0-28-8-26-14z" />
      <path className="ns-school__leaves" d="M34 102c-4-15 10-28 26-25c6-14 28-17 38-6c14-4 26 6 24 18c-8 4-20 2-26-4c-10 6-24 6-30-2c-10 6-24 8-32 19z" />
      {MANGOES.map(([x, y]) => (
        <g key={x}>
          <ellipse className="ns-orange" cx={x} cy={y} rx={2.8} ry={3.6} />
          <path className="ns-school__twig" d={`M${x} ${y - 3.6}v-2`} />
        </g>
      ))}

      {/* The school: the side in shade, the painted front, the tiled roof. */}
      <path className="ns-school__wall-shade" d="M420 100L446 93V162L420 168z" />
      <path className="ns-school__band-shade" d="M420 146L446 141V162L420 168z" />
      <path className="ns-school__wall" d="M150 168V100H420V168z" />
      <path className="ns-school__band" d="M150 146H420V168H150z" />
      <path className="ns-school__edge" d="M150 146H420M420 100V168" />
      <path className="ns-school__eave" d="M150 101H420V105H150z" />
      <path className="ns-school__roof-shade" d="M428 101L412 82L436 79L454 94z" />
      <path className="ns-school__roof" d="M142 101L164 82H412L428 101z" />
      <path className="ns-school__tiles" d={TILES} />
      {WINDOWS.map((x) => (
        <g key={x}>
          <rect className="ns-school__window" x={x} y={124} width={24} height={19} rx={1} />
          <path className="ns-school__grille" d={`M${x + 6} 124v19M${x + 12} 124v19M${x + 18} 124v19M${x} 133.5h24`} />
          <path className="ns-school__sill" d={`M${x - 1.5} 143.5h27`} />
        </g>
      ))}
      <path className="ns-school__wall" d="M276 168V102H314V168z" />
      <path className="ns-school__roof" d="M270 104L295 88L320 104z" />
      <path className="ns-school__window" d="M284 168V132H306V168z" />
      <path className="ns-school__wall-shade" d="M284 132L279 134.5V168H284zM306 132L311 134.5V168H306z" />
      <path className="ns-school__grille" d="M295 132V168" />
      <path className="ns-school__sill" d="M280 168h30" />

      {/* The banner over the door: how many schools, and where. */}
      <path className="ns-school__twig" d="M160 101.5L163 106M410 101.5L407 106" />
      <rect className="ns-school__banner" x={158} y={106} width={254} height={15} rx={1.5} />
      <text className="ns-school__banner-text" x={285} y={117.2} textAnchor="middle">
        <tspan className="ns-school__banner-num">× 28</tspan> SCHOOLS · 17 BAHIA · 11 CEARÁ
      </text>

      {/* The flag and the low wall with its gate. */}
      <path className="ns-school__edge" d="M464 174V72" />
      <path className="ns-orange" d="M464 72h16l-3.5 5 3.5 5h-16z" />
      <path className="ns-school__band" d={wall(452, 538) + wall(576, 610)} />
      <path className="ns-school__wall" d={cap(452, 538) + cap(576, 610)} />
      <path className="ns-school__edge" d={`M452 ${wallY(452) + 4}L538 ${wallY(538) + 4}M576 ${wallY(576) + 4}L610 ${wallY(610) + 4}`} />
      {[536, 574].map((x) => <rect key={x} className="ns-school__wall" x={x} y={wallY(x) - 7} width={6} height={22} rx={0.8} />)}

      {/* The children behind the kit, then the kit, then everyone in front of it. */}
      {KIDS.slice(0, 4).map((c, i) => <Kid key={i} c={c} i={i} />)}

      {/* The kit: the wooden box with its label and the lid up, the inclined plane, the car. */}
      <ellipse className="ns-school__shadow" cx={238} cy={195} rx={24} ry={2.2} />
      <path className="ns-school__wood" d="M216 178L219 165H249L246 178z" />
      <path className="ns-school__wood-dark" d="M212 182L216 178H246L242 182z" />
      <path className="ns-school__wood-shade" d="M242 194V182L246 178V190z" />
      <path className="ns-school__wood" d="M212 194V182H242V194z" />
      {/* A plank seam and the finger joints at the corners: it is a wooden box. */}
      <path className="ns-school__edge" d="M212 188H242M212.5 184.5h2.4M212.5 191h2.4M239.1 184.5h2.4M239.1 191h2.4" />
      <rect className="ns-orange" x={219} y={184.6} width={16} height={4.8} rx={0.6} />
      <path className="ns-school__wood" d={`M${RAMP[0][0]} ${RAMP[0][1]}L${RAMP[1][0]} ${RAMP[1][1]}V${RAMP[1][1] + 2.4}L${RAMP[0][0]} ${RAMP[0][1] + 2.4}z`} />
      <path className="ns-school__edge" d={`M248 181.6V194`} />
      <g className="ns-school__car">
        <g transform={`translate(${CAR[0].toFixed(1)} ${CAR[1].toFixed(1)}) rotate(${SLOPE.toFixed(1)})`}>
          <path className="ns-orange" d="M-5 -1.4h10v-2.8l-2-2.2h-5l-3 2.2z" />
          <path className="ns-school__window" d="M-2.6 -4.4l1.4-1.6h3l1.2 1.6z" />
          <path className="ns-school__wheel" d={blob(-3, -1.2, 1.3) + blob(3, -1.2, 1.3)} />
        </g>
      </g>

      <Kid c={TEACHER} i={4} adult />
      {KIDS.slice(4).map((c, i) => <Kid key={i + 4} c={c} i={i + 5} />)}
    </svg>
  );
}
