// Loaded lazily by Research: keeps the bklit charts (d3 + chart code) out of the main bundle.
import { curveLinear } from 'd3-shape';
import { Band } from '../charts/band';
import { Bar } from '../charts/bar';
import { BarChart } from '../charts/bar-chart';
import { BarDepthBack, BarDepthFront } from '../charts/bar-depth';
import { BarXAxis } from '../charts/bar-x-axis';
import { Grid } from '../charts/grid';
import { Line, LineChart } from '../charts/line-chart';
import { ReferenceArea } from '../charts/reference-area';
import { ChartTooltip } from '../charts/tooltip';
import { XAxis } from '../charts/x-axis';
import { YAxis } from '../charts/y-axis';
import { useReducedMotion } from '../../lib/motion';
import { KINETICS_RATIOS, KINETICS_SERIES, KIT_EXPERIMENTS, RCT_ARMS, RCT_MONTHS } from './researchFigures';

const MARGIN = { top: 16, right: 20, bottom: 36, left: 46 };
const percent = (v: number) => `${v}%`;
type Row = Record<string, unknown>;

// bklit's x axis is a time scale: a row's position stands in for the date (in "milliseconds"),
// and the labels name the rows.
const RCT_ROWS: Row[] = RCT_MONTHS.map((_, i) => ({
  i,
  x: i * 1000,
  ...Object.fromEntries(RCT_ARMS.map((arm) => [arm.key, arm.mean[i]])),
}));
// Control first: the orange lines paint over it.
const RCT_LINES = [...RCT_ARMS].reverse();

// A → I → B with k1 = 1 and [A]0 = 100%, on the time span of the paper's Figure 18.
// [B] by the approximation is Equation 3.16; [I] and the exact [B] are Equation 3.17.
const STEP = 0.05;
const T_MAX = 5;
const TIMES = Array.from({ length: Math.round(T_MAX / STEP) + 1 }, (_, n) => n * STEP);
const TIME_LABELS = TIMES.map((t) => String(Number(t.toFixed(2))));
const TIME_PILLS = TIME_LABELS.map((t) => `k₁t = ${t}`);
const KINETICS_ROWS = new Map(
  KINETICS_RATIOS.map(({ ratio: r, maxError }) => {
    const rows = TIMES.map((t, n) => {
      const eA = Math.exp(-t);
      const eI = Math.exp(-r * t);
      return {
        x: n,
        zero: 0,
        a: 100 * eA,
        i: (100 * (eA - eI)) / (r - 1),
        b: 100 * (1 - (r * eA - eI) / (r - 1)),
        bSsh: 100 * (1 - eA),
      };
    });
    // The computed peak of [I] has to land on the paper's Table 6.
    if (import.meta.env.DEV) {
      console.assert(Math.abs(Math.max(...rows.map((d) => d.i)) - parseFloat(maxError)) < 0.06, `A→I→B at ${r}× is off Table 6`);
    }
    return [r, rows as Row[]];
  }),
);

/** Tooltip body in the site's own type: bklit's default prints the stand-in date as a title. */
function Tip({ rows }: { rows: { color: string; label: string; value: string; note?: string }[] }) {
  return (
    <ul className="research-tip">
      {rows.map((row) => (
        <li key={row.label}>
          <i style={{ background: row.color }} />
          <span>{row.label}</span>
          <b>
            {row.value}
            {row.note && <small>{row.note}</small>}
          </b>
        </li>
      ))}
    </ul>
  );
}

interface Props {
  kind: 'rct' | 'kinetics' | 'candela';
  /** Kinetics only: k2/k1. */
  ratio: number;
}

export default function ResearchChart({ kind, ratio }: Props) {
  const reduced = useReducedMotion();
  // bklit does not gate its enter animations on reduced motion: switch them off here.
  const motion = { animationDuration: reduced ? 0 : 1100, aspectRatio: 'auto' };
  const animate = !reduced;
  const damping = reduced ? 0 : 20;

  if (kind === 'rct') {
    return (
      <LineChart data={RCT_ROWS} xDataKey="x" margin={MARGIN} {...motion}>
        {/* The solid row is 100%: saving all of the initial residual income (the paper marks it too). */}
        <Grid horizontal rowTickValues={[0, 20, 40, 60, 80, 100, 120]} highlightRowValues={[100]} />
        <ReferenceArea x1={500} fill="var(--chart-1)" fillOpacity={0.07} strokeWidth={0} fadeEdges={false} />
        {RCT_LINES.map((arm) => (
          <Line
            key={arm.key}
            dataKey={arm.key}
            stroke={arm.color}
            strokeWidth={arm.key === 'control' ? 2 : 2.5}
            curve={curveLinear}
            fadeEdges={false}
            showMarkers
            markers={{ radius: 3.5, ringGap: 0, strokeWidth: 0, outlineWidth: 2, outlineColor: 'var(--bg)' }}
            dashFromIndex={arm.key === 'control' ? 0 : undefined}
            dashArray="5,5"
            animate={animate}
          />
        ))}
        <YAxis formatValue={percent} />
        <XAxis labels={RCT_MONTHS} numTicks={RCT_MONTHS.length} />
        <ChartTooltip
          className="research-tipbox"
          damping={damping}
          dateLabels={RCT_MONTHS}
          content={({ point }) => (
            <Tip
              rows={RCT_ARMS.map((arm) => ({
                color: arm.color,
                label: arm.label,
                value: `${(point[arm.key] as number).toFixed(2)}%`,
                note: `SD ${arm.sd[point.i as number]}`,
              }))}
            />
          )}
        />
      </LineChart>
    );
  }

  if (kind === 'kinetics') {
    return (
      // yScaleDomainMax: bklit adds 10% of headroom; nothing here can pass 100% of [A]0.
      <LineChart data={KINETICS_ROWS.get(ratio) ?? []} xDataKey="x" yScaleDomainMax={90.9} margin={MARGIN} {...motion}>
        <Grid horizontal rowTickValues={[0, 20, 40, 60, 80, 100]} />
        {/* What the approximation counts as product too early, and the intermediate that holds it. */}
        <Band upperKey="bSsh" lowerKey="b" fill="var(--chart-1)" fillOpacity={0.16} strokeWidth={0} showInTooltip={false} />
        <Band upperKey="i" lowerKey="zero" fill="var(--chart-1)" fillType="gradient" fillOpacity={0.45} gradientToOpacity={0.05} strokeWidth={0} showInTooltip={false} />
        {KINETICS_SERIES.map((s) => (
          <Line
            key={s.key}
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={s.key === 'a' ? 1.5 : 2}
            fadeEdges={false}
            dashFromIndex={s.dashed ? 0 : undefined}
            dashArray="5,5"
            animate={animate}
          />
        ))}
        <YAxis formatValue={percent} />
        <XAxis labels={TIME_LABELS} numTicks={6} />
        <ChartTooltip
          className="research-tipbox"
          damping={damping}
          dateLabels={TIME_PILLS}
          content={({ point }) => (
            <Tip
              rows={KINETICS_SERIES.map((s) => ({
                color: s.color,
                label: s.short,
                value: `${(point[s.key] as number).toFixed(1)}%`,
              }))}
            />
          )}
        />
      </LineChart>
    );
  }

  return (
    <BarChart data={KIT_EXPERIMENTS} xDataKey="name" margin={{ ...MARGIN, top: 24, left: 8, right: 8 }} barGap={0.2} {...motion}>
      <Grid horizontal numTicksRows={3} />
      <BarDepthBack dataKey="cost" color="var(--chart-1)" />
      <Bar dataKey="cost" fill="var(--chart-1)" perspective showValue valueLabelFormatter={(v) => `R$${v}`} animate={animate} />
      <BarDepthFront dataKey="cost" />
      <BarXAxis showAllLabels />
      <ChartTooltip
        className="research-tipbox"
        damping={damping}
        showCrosshair={false}
        showDots={false}
        showDatePill={false}
        content={({ point }) => (
          <Tip rows={[{ color: 'var(--chart-1)', label: `${point.name} · ${point.domain}`, value: `R$${point.cost}` }]} />
        )}
      />
    </BarChart>
  );
}
