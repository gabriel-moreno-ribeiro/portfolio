import { useMemo, useRef } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import {
  config,
  formatRelative,
  renderEmphasis,
  useBuildYear,
  useClock,
  useGitHub,
  useLocalData,
  useWeather,
  type DataResult,
  type GitHubSummary,
  type NumberStat,
  type Weather,
} from "../../lib/data";
import {
  Counter,
  LivePulse,
  Reveal,
  useVisible,
  WidgetState,
  type WidgetStatus,
} from "../../lib/motion";

// The dark rounded square is the site's icon language; only the size changes with hierarchy.
const ICON_PX: Record<NumberStat["size"], number> = { hero: 72, lg: 56, md: 44 };

function widgetStatus(result: DataResult<unknown>): WidgetStatus {
  if (result.data) return "ready";
  if (result.status === "error") return "error";
  if (result.status === "loading" || result.status === "idle") return "loading";
  return "empty";
}

function StatTile({ stat, start }: { stat: NumberStat; start: boolean }) {
  const px = ICON_PX[stat.size];
  return (
    <>
      <span className="stat-tile__icon" aria-hidden="true">
        <img src={stat.icon} alt="" width={px} height={px} loading="lazy" decoding="async" />
      </span>
      <span className="stat-tile__value">
        <Counter
          value={stat.value}
          start={start}
          decimals={stat.decimals ?? 0}
          prefix={stat.prefix ?? ""}
          suffix={stat.suffix ?? ""}
          grouping={stat.grouping ?? true}
        />
      </span>
      <span className="stat-tile__label">{stat.label}</span>
      {stat.sub && <span className="stat-tile__sub">{renderEmphasis(stat.sub)}</span>}
    </>
  );
}

// 28 days of the contribution calendar. Static heights: nothing animates here.
function Sparkline({ days }: { days: { date: string; count: number }[] }) {
  const last = days.slice(-28);
  const max = Math.max(1, ...last.map((d) => d.count));
  return (
    <span className="now-tile__spark" aria-hidden="true">
      {last.map((d) => (
        <span key={d.date} style={{ height: `${Math.max(8, Math.round((d.count / max) * 100))}%` }} />
      ))}
    </span>
  );
}

// The clock is the only thing here that ticks every second, so it lives in its own
// component: the rest of the panel does not re-render with it, and it stays out of the
// aria-live announcement.
function ClockTile({ weather }: { weather: Weather | null }) {
  const { hhmm } = useClock(config.location.tz);
  return (
    <>
      <p className="now-tile__value">
        {hhmm}
        {weather ? ` · ${Math.round(weather.tempC)} °C` : ""}
      </p>
      <p className="now-tile__label">{config.location.city}</p>
      <p className="now-tile__sub">{weather ? weather.label : "weather unavailable"}</p>
    </>
  );
}

function ReposTile({ gh }: { gh: GitHubSummary | null }) {
  if (!gh) return null;
  return (
    <>
      <p className="now-tile__value">
        {gh.publicRepos} <span className="now-tile__unit">repos</span>
      </p>
      <p className="now-tile__label">
        {gh.lastCommit ? `last commit ${formatRelative(gh.lastCommit.at)}` : "public repositories"}
      </p>
      {gh.lastCommit && (
        <a
          className="now-tile__link"
          href={gh.lastCommit.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {gh.lastCommit.repo.split("/").pop()} <FiArrowUpRight aria-hidden="true" />
        </a>
      )}
    </>
  );
}

function CommitsTile({ gh, start }: { gh: GitHubSummary | null; start: boolean }) {
  if (!gh || gh.commitsThisYear === null) return null;
  return (
    <>
      <p className="now-tile__value">
        {gh.estimated && <span className="now-tile__approx">≈ </span>}
        <Counter value={gh.commitsThisYear} start={start} />
      </p>
      <p className="now-tile__label">commits this year</p>
      {gh.calendar ? (
        <Sparkline days={gh.calendar} />
      ) : (
        <p className="now-tile__sub">{gh.estimated ? "estimated from public events" : ""}</p>
      )}
    </>
  );
}

const NumbersAndStats = () => {
  const { numbers } = useLocalData();
  const panelRef = useRef<HTMLDivElement>(null);
  // One choreographed moment: the counters run once, when the panel comes into view.
  const started = useVisible(panelRef, { once: true, rootMargin: "0px 0px -10%" });
  const github = useGitHub();
  const weather = useWeather();
  const buildYear = useBuildYear();
  const gh = github.data;
  const w = weather.data;

  // Announced only when a live value actually changes. The clock is deliberately absent.
  const liveText = useMemo(() => {
    const parts: string[] = [];
    if (gh) {
      parts.push(`${gh.publicRepos} public repositories`);
      if (gh.lastCommit) parts.push(`last commit ${formatRelative(gh.lastCommit.at)}`);
      if (gh.commitsThisYear !== null) parts.push(`${gh.commitsThisYear} commits this year`);
    }
    if (w) parts.push(`${Math.round(w.tempC)} degrees and ${w.label} in ${config.location.city}`);
    return parts.length ? `${parts.join(". ")}.` : "";
  }, [gh, w]);

  return (
    <div className="numbers-and-stats" id="numbers" ref={panelRef}>
      <div className="numbers-head">
        <h2 className="heading" id="numbers-heading" data-color-inverted="true">
          By the Numbers
        </h2>
        <LivePulse
          source={github.source}
          updatedAt={github.updatedAt}
          stale={github.stale}
          className="numbers-head__pulse"
        />
      </div>

      <ul className="numbers-panel" aria-labelledby="numbers-heading">
        {numbers.map((stat, i) => (
          <Reveal
            as="li"
            key={stat.id}
            delay={i * 0.04}
            className={`stat-tile stat-tile--${stat.size}`}
          >
            <StatTile stat={stat} start={started} />
          </Reveal>
        ))}
      </ul>

      <div className="numbers-now">
        <h3 className="numbers-now__title">now</h3>
        <ul className="numbers-now__grid">
          <Reveal as="li" className="now-tile" delay={0.36}>
            <WidgetState
              state={widgetStatus(github)}
              loading={<p className="now-tile__muted">loading GitHub…</p>}
              error={<p className="now-tile__muted">GitHub unavailable</p>}
              empty={<p className="now-tile__muted">no GitHub data</p>}
            >
              <ReposTile gh={gh} />
            </WidgetState>
          </Reveal>

          <Reveal as="li" className="now-tile" delay={0.4}>
            <WidgetState
              state={gh && gh.commitsThisYear === null ? "empty" : widgetStatus(github)}
              loading={<p className="now-tile__muted">loading commits…</p>}
              error={<p className="now-tile__muted">GitHub unavailable</p>}
              empty={<p className="now-tile__muted">commit count unavailable</p>}
            >
              <CommitsTile gh={gh} start={started} />
            </WidgetState>
          </Reveal>

          <Reveal as="li" className="now-tile" delay={0.44}>
            <p className="now-tile__value">
              day <Counter value={buildYear.day} start={started} />
            </p>
            <p className="now-tile__label">of {buildYear.total}, build year</p>
            <span className="now-tile__bar" aria-hidden="true">
              <span style={{ width: `${Math.round((buildYear.day / buildYear.total) * 100)}%` }} />
            </span>
          </Reveal>

          <Reveal as="li" className="now-tile" delay={0.48}>
            <WidgetState
              state={widgetStatus(weather)}
              loading={<ClockTile weather={null} />}
              error={<ClockTile weather={null} />}
              empty={<ClockTile weather={null} />}
            >
              <ClockTile weather={w} />
            </WidgetState>
          </Reveal>
        </ul>
      </div>

      <p className="sr-only" aria-live="polite">
        {liveText}
      </p>
    </div>
  );
};

export default NumbersAndStats;
