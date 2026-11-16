// Loaded lazily by Research: keeps the bklit charts (d3 + chart code) out of the main bundle.
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { curveLinear } from 'd3-shape';
import { Band } from '../charts/band';
import { Bar } from '../charts/bar';
import { BarChart } from '../charts/bar-chart';
import { BarDepthBack, BarDepthFront } from '../charts/bar-depth';
import { BarXAxis } from '../charts/bar-x-axis';
import { useChartHoverSelector, useChartPortalContainer, useChartStable, useYScale } from '../charts/chart-context';
import { Grid } from '../charts/grid';
import { Line, LineChart } from '../charts/line-chart';
import { ReferenceArea } from '../charts/reference-area';
import { ChartTooltip } from '../charts/tooltip';
import { XAxis } from '../charts/x-axis';
import { YAxis } from '../charts/y-axis';
import { useReducedMotion } from '../../lib/motion';
import { KINETICS_RATIOS, KINETICS_SERIES, KIT_EXPERIMENTS, RCT_ARMS, RCT_GAP, RCT_MONTHS } from './researchFigures';

const MARGIN = { top: 16, right: 20, bottom: 36, left: 46 };
const percent = (v: number) => `${v}%`;
type Row = Record<string, unknown>;

// bklit's x axis is a time scale: a row's position stands in for the date (in "milliseconds"),
// and the labels name the rows.
const RCT_ROWS: Row[] = RCT_MONTHS.map((_, i) => ({
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
function Tip({ rows }: { rows: { color: string; label: string; value: string }[] }) {
  return (
    <ul className="research-tip">
      {rows.map((row) => (
        <li key={row.label}>
          <i style={{ background: row.color }} />
          <span>{row.label}</span>
          <b>{row.value}</b>
        </li>
      ))}
    </ul>
  );
}

const RCT_GUTTER = 112;
const RCT_LABEL_GAP = 16;
const OCT = RCT_MONTHS.length - 1;
const RCT_TOOLS = RCT_ARMS.filter((arm) => arm.key !== 'control');
const RCT_CONTROL = RCT_ARMS.find((arm) => arm.key === 'control')!;

/** RCT: each line named where it ends, and the October gap drawn as a bracket. HTML over the plot, like bklit's own axes. */
function RctEnds() {
  const { margin, innerWidth, containerRef } = useChartStable();
  const yScale = useYScale();
  const container = useChartPortalContainer(containerRef);
  if (!container) return null;
  const y = (value: number) => margin.top + yScale(value);
  // The three tools end within 10 points of each other: their names sit one row apart, centred on those ends.
  const middle = (y(RCT_TOOLS[0].mean[OCT]) + y(RCT_TOOLS[RCT_TOOLS.length - 1].mean[OCT])) / 2;
  const rows = [
    ...RCT_TOOLS.map((arm, i) => ({ arm, top: middle + (i - (RCT_TOOLS.length - 1) / 2) * RCT_LABEL_GAP })),
    { arm: RCT_CONTROL, top: y(RCT_CONTROL.mean[OCT]) },
  ];
  // From the control group's October mean up by the gap the paper reports.
  const gapTop = y(RCT_CONTROL.mean[OCT] + RCT_GAP);
  return createPortal(
    <div className="research-ends" style={{ left: margin.left + innerWidth, width: margin.right }}>
      {rows.map(({ arm, top }) => (
        <span key={arm.key} style={{ top }}>
          <i style={{ background: arm.color }} />
          {arm.label}
        </span>
      ))}
      <b style={{ top: gapTop, height: y(RCT_CONTROL.mean[OCT]) - gapTop }}>
        <em>+{RCT_GAP} pp</em>
      </b>
    </div>,
    container,
  );
}

/** Tells Research which row is under the pointer (null: none). */
function HoverRow({ onChange }: { onChange: (row: number | null) => void }) {
  const row = useChartHoverSelector((hover) => hover.tooltipData?.index ?? null);
  useEffect(() => onChange(row), [row, onChange]);
  return null;
}

interface Props {
  kind: 'rct' | 'kinetics' | 'candela';
  /** Kinetics only: k2/k1. */
  ratio: number;
  /** RCT only. */
  onHoverRow: (row: number | null) => void;
}

export default function ResearchChart({ kind, ratio, onHoverRow }: Props) {
  const reduced = useReducedMotion();
  // bklit does not gate its enter animations on reduced motion: switch them off here
  // (the duration stops the reveal, the transition stops the fade-ins).
  const motion = { animationDuration: reduced ? 0 : 1100, enterTransition: reduced ? { duration: 0 } : undefined, aspectRatio: 'auto' };
  const animate = !reduced;
  const damping = reduced ? 0 : 20;

  if (kind === 'rct') {
    return (
      <LineChart data={RCT_ROWS} xDataKey="x" margin={{ ...MARGIN, left: 42, right: RCT_GUTTER }} {...motion}>
        {/* The solid row is 100%: saving all of the initial residual income (the paper marks it too). */}
        <Grid horizontal rowTickValues={[0, 20, 40, 60, 80, 100]} highlightRowValues={[100]} />
        {/* August to October: the three months with the tools. */}
        <ReferenceArea x1={1000} fill="var(--chart-1)" fillOpacity={0.07} strokeWidth={0} fadeEdges={false} />
        {RCT_LINES.map((arm) => (
          <Line
            key={arm.key}
            dataKey={arm.key}
            stroke={arm.color}
            strokeWidth={arm.key === 'control' ? 2 : 2.5}
            curve={curveLinear}
            fadeEdges={false}
            // bklit dims the line and redraws a bright piece around the pointer; between four
            // points that piece is half the chart, and the rest looks washed out and doubled.
            showHighlight={false}
            showMarkers
            markers={{ radius: 3.5, ringGap: 0, strokeWidth: 0, outlineWidth: 2, outlineColor: 'var(--bg)', fadeOnHover: false, showActiveHighlight: false }}
            dashFromIndex={arm.key === 'control' ? 0 : undefined}
            dashArray="5,5"
            // Static markers ride the same left-to-right reveal as their line; animated ones
            // pop in on a clock of their own, after the line has passed them.
            animate={false}
          />
        ))}
        {/* bklit rounds the scale up to 120% (the highest mean is 101.07%): that last tick is headroom, not a value. */}
        <YAxis formatValue={(v) => (v > 100 ? '' : percent(v))} />
        <XAxis labels={RCT_MONTHS} numTicks={RCT_MONTHS.length} />
        <RctEnds />
        <HoverRow onChange={onHoverRow} />
        {/* Crosshair and dots only: the numbers of the month go to the legend, which covers nothing. */}
        <ChartTooltip className="research-tipbox--none" damping={damping} showDatePill={false} content={() => null} />
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
            // Same as the RCT lines: no dimming of the curves while they are being read.
            showHighlight={false}
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
