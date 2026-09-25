import { useEffect, useRef, useState } from "react";
import { FiArrowUpRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Project, projects } from "../../content/projects";
import useIsMobile from "../../hooks/useIsMobile";
import { formatRelative, useGitHub, useLocalData } from "../../lib/data";
import {
  Counter,
  usePageVisible,
  useReducedMotion,
  useVisible,
  WidgetState,
} from "../../lib/motion";
import { toggleTerminalWindow } from "../../utils/terminalWindow";

const AUTOPLAY_MS = 6000;

const toNumber = (value: string) => Number(value.replace(/[^\d.]/g, "")) || 0;

function MediaCarousel({ project, paused }: { project: Project; paused: boolean }) {
  const available = project.gallery ?? [];
  const count = available.length;
  const [idx, setIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  // Below 900px the thumbnails would pull every photo of the gallery for a 34x24 box,
  // so the picker falls back to dots and only two photos are ever in the DOM.
  const compact = useIsMobile(900);
  const inView = useVisible(wrapRef);
  const pageVisible = usePageVisible();
  const reduced = useReducedMotion();

  // Autoplay only while the carousel is on screen, the tab is visible and nobody is
  // hovering or tabbing through it.
  useEffect(() => {
    if (count <= 1 || !inView || !pageVisible || paused || reduced) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, inView, pageVisible, paused, reduced, idx]);

  if (count === 0) return null;

  const active = idx % count;
  const current = available[active];
  const src = `/work/${project.slug}/${current}`;
  const prev = () => setIdx((i) => (i - 1 + count) % count);
  const next = () => setIdx((i) => (i + 1) % count);
  const nextFile = count > 1 ? available[(active + 1) % count] : null;

  return (
    <div className="media-carousel" ref={wrapRef}>
      {current.endsWith(".mp4") ? (
        <video key={src} src={src} controls playsInline width={640} height={400} />
      ) : (
        <img
          key={src}
          src={src}
          alt={project.captions?.[current] ?? project.title}
          width={640}
          height={400}
          loading="lazy"
          decoding="async"
        />
      )}
      {nextFile && !nextFile.endsWith(".mp4") && (
        <img
          className="media-carousel__preload"
          src={`/work/${project.slug}/${nextFile}`}
          alt=""
          aria-hidden="true"
          width={640}
          height={400}
          decoding="async"
        />
      )}
      {count > 1 && (
        <>
          <button className="carousel-arrow left" onClick={prev} aria-label="Previous photo">
            <FiChevronLeft />
          </button>
          <button className="carousel-arrow right" onClick={next} aria-label="Next photo">
            <FiChevronRight />
          </button>
          <div className={`carousel-thumbs${compact ? " carousel-thumbs--dots" : ""}`}>
            {available.map((file, i) => (
              <button
                key={file}
                type="button"
                className={i === active ? "carousel-thumb is-active" : "carousel-thumb"}
                onClick={() => setIdx(i)}
                aria-label={`Photo ${i + 1} of ${count}`}
                aria-current={i === active ? "true" : undefined}
              >
                {compact ? null : file.endsWith(".mp4") ? (
                  <span className="carousel-thumb__video" aria-hidden="true">
                    ▶
                  </span>
                ) : (
                  <img
                    src={`/work/${project.slug}/${file}`}
                    alt=""
                    width={44}
                    height={28}
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// "last shipped" comes from changelog.json; the commit link from the GitHub summary.
function HibeexLive() {
  const { changelog } = useLocalData();
  const github = useGitHub();
  const latest = changelog.find((entry) => entry.project === "hibeex");
  const commit = github.data?.lastCommit;

  return (
    <div className="project-live">
      <WidgetState
        state={latest ? "ready" : "empty"}
        empty={<p className="project-live__line">no shipping log yet.</p>}
      >
        {latest && (
          <p className="project-live__line">
            <span className="project-live__key">last shipped</span> {latest.title}
            <span className="project-live__rel"> · {formatRelative(latest.date)}</span>
          </p>
        )}
      </WidgetState>
      {commit && (
        <a
          className="project-live__link"
          href={commit.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          latest commit: {commit.repo.split("/").pop()} <FiArrowUpRight aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

function CandelaLive({ project }: { project: Project }) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useVisible(ref, { once: true, rootMargin: "0px 0px -10%" });
  const reduced = useReducedMotion();
  const start = shown || reduced;
  const students = toNumber(project.stats[0]?.value ?? "0");
  const schools = toNumber(project.stats[1]?.value ?? "0");

  return (
    <div className="project-live" ref={ref}>
      <p className="project-live__counts">
        <strong>
          <Counter value={students} start={start} />
        </strong>{" "}
        students
        <span aria-hidden="true"> · </span>
        <strong>
          <Counter value={schools} start={start} />
        </strong>{" "}
        schools
      </p>
      <p className="project-live__line">
        physics failure rate <strong>30% → 10%</strong>
      </p>
      {/* Decorative: the two numbers above carry the information. */}
      <span className="failure-bar" aria-hidden="true">
        <span
          className="failure-bar__fill"
          style={{ transform: `scaleX(${start ? 1 / 3 : 1})` }}
        />
      </span>
    </div>
  );
}

function MedalsLive({ project }: { project: Project }) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useVisible(ref, { once: true, rootMargin: "0px 0px -10%" });
  const reduced = useReducedMotion();
  const medals = toNumber(project.stats[0]?.value ?? "0");

  return (
    <div className="project-live" ref={ref}>
      <p className="project-live__counts">
        <strong>
          <Counter value={medals} start={shown || reduced} />
        </strong>{" "}
        medals in 49 competitions
      </p>
    </div>
  );
}

function ProjectLive({ project }: { project: Project }) {
  switch (project.slug) {
    case "hibeex":
      return <HibeexLive />;
    case "candela":
      return <CandelaLive project={project} />;
    case "medals":
      return <MedalsLive project={project} />;
    default:
      return null;
  }
}

// The whole card is one link target: the title anchor stretches over the card, so
// the carousel controls stay clickable by sitting above it.
function FeaturedCard({ project }: { project: Project }) {
  const hasMedia = (project.gallery?.length ?? 0) > 0;
  const litChips = project.slug === "medals";
  // The card's stretched link sits over the photo, so the pause lives on the card.
  const [paused, setPaused] = useState(false);

  return (
    <div
      className={`featured-card${hasMedia ? " featured-card--wide" : ""}${
        litChips ? " featured-card--chips" : ""
      }`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <MediaCarousel project={project} paused={paused} />
      <div className="featured-card__body">
        <h2>
          <Link to={`/work/${project.slug}`} className="featured-card__link">
            {project.title}
          </Link>
        </h2>
        <p>{project.cardDesc}</p>
        <ProjectLive project={project} />
        {/* Candela's tags are the same three numbers the live row already shows. */}
        {project.slug !== "candela" && (
          <div className="featured-tags">
            {project.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
        <span className="featured-cta" aria-hidden="true">
          View project <FiArrowUpRight />
        </span>
      </div>
    </div>
  );
}

function FindMyWork() {
  return (
    <div className="find-my-work" id="work">
      <h2 className="heading" data-color-inverted={"true"}>
        Cool Things
      </h2>
      <p className="work-sub">
        What I've built and what I've won.
      </p>
      <button className="terminal-launch" onClick={toggleTerminalWindow}>
        {"> Open terminal"} <kbd>Ctrl+K</kbd>
      </button>
      <div className="featured-grid">
        {projects.map((project) => (
          <FeaturedCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  );
}

export default FindMyWork;
