// Loaded lazily by Research: keeps the bklit bar chart (d3 + chart code) out of the main bundle.
import { Bar } from '../charts/bar';
import { BarChart } from '../charts/bar-chart';
import { useReducedMotion } from '../../lib/motion';

const NO_MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };

interface Props {
  bars: { label: string; value: number }[];
  /** scaleBand padding; Research aligns its text labels with it. */
  barGap: number;
}

export default function ResearchChart({ bars, barGap }: Props) {
  const reduced = useReducedMotion();
  return (
    <div className="bk">
      <BarChart data={bars} xDataKey="label" aspectRatio="auto" barGap={barGap} margin={NO_MARGIN}>
        {/* bklit does not gate the bar grow on reduced motion: switch it off here. */}
        <Bar dataKey="value" fill="var(--chart-1)" lineCap={3} animate={!reduced} />
      </BarChart>
    </div>
  );
}
