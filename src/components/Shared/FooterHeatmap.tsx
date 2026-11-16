// Loaded lazily by the Footer: keeps the bklit chart (d3 + chart code) out of the main bundle.
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { HeatmapCells, HeatmapChart, HeatmapTooltip, type HeatmapColumn } from "../charts/heatmap";
import { useGitHubCalendar } from "../../lib/data";
import { useReducedMotion } from "../../lib/motion";

const CELL = 10;
const MAX_WEEKS = 53;
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

type Day = { date: string; count: number };

/** One column per week (Sunday first), ending in the week of the last day. */
function toColumns(days: Day[], weeks: number): HeatmapColumn[] {
  const byDate = new Map(days.map((d) => [d.date, d.count]));
  // bklit colours by fixed counts (1, 2, 3, 4+), so cells carry a 0-4 level relative to a busy day.
  const busy = days.map((d) => d.count).filter(Boolean).sort((a, b) => a - b);
  const ref = busy[Math.floor(busy.length * 0.9)] ?? 1;
  const [y, m, d] = days[days.length - 1].date.split("-").map(Number);
  const last = new Date(y, m - 1, d);
  const start = new Date(y, m - 1, d - last.getDay() - (weeks - 1) * 7);
  return Array.from({ length: weeks }, (_, week) => ({
    bin: week,
    bins: Array.from({ length: 7 }, (_, row) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + week * 7 + row);
      const count = byDate.get(iso(date)) ?? 0;
      return { bin: row, date, count: count === 0 ? 0 : Math.min(4, Math.ceil((count / ref) * 4)) };
    }),
  }));
}

interface Props {
  /** The strip is on screen: the badge only pulses then. */
  visible: boolean;
  /** Static placeholder, shown while the data loads. */
  fallback: ReactNode;
}

export default function FooterHeatmap({ visible, fallback }: Props) {
  const gh = useGitHubCalendar();
  const reduced = useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(MAX_WEEKS);

  const source = gh.data?.calendarSource;
  const days = gh.data?.calendar;
  const estimated = source === "events";
  const weeks = estimated ? Math.min(fit, 13) : fit;
  const columns = useMemo(() => (days?.length ? toColumns(days, weeks) : null), [days, weeks]);
  const counts = useMemo(() => new Map(days?.map((d) => [d.date, d.count])), [days]);

  // Narrow screens show fewer (the most recent) weeks instead of scrolling. The box only
  // exists once there is data, hence the dependency.
  const hasChart = columns !== null;
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setFit(Math.max(8, Math.min(MAX_WEEKS, Math.floor(el.clientWidth / CELL))));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasChart]);

  if (!columns) {
    if (gh.status === "idle" || gh.status === "loading") return <>{fallback}</>;
    return (
      <>
        <p className="footer__activity-head" role="status">
          GitHub activity is unavailable right now.
          <button type="button" className="footer__activity-retry" onClick={gh.refresh}>
            Retry
          </button>
        </p>
        <div className="footer__activity-grid footer__activity-grid--empty" aria-hidden="true" />
      </>
    );
  }

  const total = (gh.data?.calendarTotal ?? 0).toLocaleString("en-US");
  const live = source === "graphql";
  return (
    <>
      <p className="footer__activity-head" aria-live="polite">
        <span>
          <strong>{estimated ? `~${total}` : total}</strong>{" "}
          {estimated ? "public commits in the last 90 days" : "contributions in the last year"}
        </span>
        <span
          className="hl-live"
          data-source={live ? "live" : "local"}
          data-pulse={live && visible && !reduced && !gh.stale ? "true" : undefined}
        >
          <span className="hl-live__dot" aria-hidden="true" />
          <span className="hl-live__text">{live ? "live" : estimated ? "estimated" : "demo"}</span>
        </span>
      </p>
      <div className="footer__activity-grid" ref={boxRef}>
        <div className="bk" style={{ width: weeks * CELL }}>
          <HeatmapChart
            // bklit's own reduced-motion check is partial: switch the enter wave off here too.
            animate={!reduced}
            binSize={CELL}
            data={columns}
            gap={2}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <HeatmapCells />
            <HeatmapTooltip
              formatLabel={(_level, date) => {
                const n = counts.get(iso(date)) ?? 0;
                return `${n} ${estimated ? "commit" : "contribution"}${n === 1 ? "" : "s"}`;
              }}
              instant={reduced}
            />
          </HeatmapChart>
        </div>
      </div>
    </>
  );
}
