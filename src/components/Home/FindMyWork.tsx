import { useEffect, useRef, useState } from "react";
import { FiArrowUpRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Project, projects } from "../../content/projects";
import useIsMobile from "../../hooks/useIsMobile";
import { Counter, usePageVisible, useReducedMotion, useVisible } from "../../lib/motion";
import CandelaMark from "./CandelaMark";
import DesmosSketches from "./DesmosSketches";
import MedalsShowcase from "./MedalsShowcase";

const AUTOPLAY_MS = 6000;

function MediaCarousel({ project, paused, offset = 0 }: { project: Project; paused: boolean; offset?: number }) {
  const available = project.gallery ?? [];
  const count = available.length;
  // `under` is the photo being left: it stays beneath while the new one fades in.
  const [{ idx, under }, setState] = useState<{ idx: number; under: number | null }>({ idx: 0, under: null });
  const setIdx = (fn: (i: number) => number) => setState((s) => ({ idx: fn(s.idx), under: s.idx }));
  // Only the first step waits the extra offset, so rows one above the other
  // don't change photos on the same beat.
  const firstStep = useRef(true);
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
    const delay = AUTOPLAY_MS + (firstStep.current ? offset : 0);
    const timer = setTimeout(() => {
      firstStep.current = false;
      setIdx((i) => (i + 1) % count);
    }, delay);
    return () => clearTimeout(timer);
  }, [count, inView, pageVisible, paused, reduced, idx, offset]);

  if (count === 0) return null;

  const active = idx % count;
  const current = available[active];
  const src = `/work/${project.slug}/${current}`;
  const prev = () => setIdx((i) => (i - 1 + count) % count);
  const next = () => setIdx((i) => (i + 1) % count);
  const nextFile = count > 1 ? available[(active + 1) % count] : null;
  const underFile = under !== null && under !== active && !reduced ? available[under % count] : null;
  // 640px copy for the 640px box; a 2x screen takes the original.
  const pic = (f: string) => ({
    src: `/work/${project.slug}/sm/${f}`,
    srcSet: `/work/${project.slug}/sm/${f} 640w, /work/${project.slug}/${f} 1600w`,
    sizes: "(max-width: 900px) 100vw, 640px",
  });

  return (
    <div className="media-carousel" ref={wrapRef}>
      {underFile && !underFile.endsWith(".mp4") && (
        <img
          className="media-carousel__under"
          {...pic(underFile)}
          alt=""
          aria-hidden="true"
          width={640}
          height={400}
          style={project.focus?.[underFile] ? { objectPosition: project.focus[underFile] } : undefined}
        />
      )}
      {current.endsWith(".mp4") ? (
        <video key={src} src={src} controls playsInline width={640} height={400} />
      ) : (
        <img
          key={src}
          className={underFile ? "media-carousel__in" : undefined}
          {...pic(current)}
          alt={project.captions?.[current] ?? project.title}
          width={640}
          height={400}
          loading="lazy"
          decoding="async"
          style={project.focus?.[current] ? { objectPosition: project.focus[current] } : undefined}
        />
      )}
      {nextFile && !nextFile.endsWith(".mp4") && (
        <img
          className="media-carousel__preload"
          {...pic(nextFile)}
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
                onClick={() => setIdx(() => i)}
                aria-label={`Photo ${i + 1} of ${count}`}
                aria-current={i === active ? "true" : undefined}
              >
                {compact ? null : file.endsWith(".mp4") ? (
                  <span className="carousel-thumb__video" aria-hidden="true">
                    ▶
                  </span>
                ) : (
                  <img
                    src={`/work/${project.slug}/thumbs/${file.replace(/\.\w+$/, ".webp")}`}
                    alt=""
                    width={44}
                    height={28}
                    loading="lazy"
                    decoding="async"
                    style={project.focus?.[file] ? { objectPosition: project.focus[file] } : undefined}
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

// One project: its photos on one side, the words on the other, no box around
// it. Rows alternate sides. The tags are the site's dotted meta line.
function ProjectRow({ project, index }: { project: Project; index: number }) {
  const hasMedia = (project.gallery?.length ?? 0) > 0;
  const [paused, setPaused] = useState(false);

  return (
    <article
      className={`work-row${index % 2 ? " work-row--flip" : ""}${hasMedia ? "" : " work-row--text"}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {hasMedia && (
        <div className="work-row__media">
          <MediaCarousel project={project} paused={paused} offset={(index % 2) * (AUTOPLAY_MS / 2)} />
        </div>
      )}
      <div className="work-row__body">
        <p className="work-row__meta">
          {project.tags.map((tag, i) => <span key={tag}>{i > 0 && <i />}{tag}</span>)}
        </p>
        <h3>
          <Link to={`/work/${project.slug}`} className="work-row__title">{project.title}</Link>
        </h3>
        <p className="work-row__desc">{project.cardDesc}</p>
        <Link to={`/work/${project.slug}`} className="work-row__cta">
          View project <FiArrowUpRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

// The numbers the rest of the section doesn't already show, each beside the
// mark of where it comes from. Each counts up once.
const STATS = [
  {
    logo: (
      <span className="candela-lockup">
        <CandelaMark />
        <span>Projeto<br />Candela</span>
      </span>
    ),
    value: 3392, label: "students reached", note: "28 public schools",
  },
  {
    logo: <img className="sat-logo" src="/stats/sat-logo.webp" alt="" width={200} height={127} loading="lazy" decoding="async" />,
    value: 1570, grouping: false, label: "SAT score", note: "of 1600, top <1% in the world", href: "/files/sat-score-report.pdf",
  },
  {
    logo: (
      <>
        <img className="only-light" src="/stats/fundacao-estudar.webp" alt="" width={260} height={108} loading="lazy" decoding="async" />
        <img className="only-dark" src="/stats/fundacao-estudar-dark.webp" alt="" width={260} height={108} loading="lazy" decoding="async" />
      </>
    ),
    value: 0.7, decimals: 1, suffix: "%", label: "acceptance rate", note: "about 70 of 10,000+ applicants",
  },
];

function NumbersStrip() {
  const ref = useRef<HTMLUListElement>(null);
  const shown = useVisible(ref, { once: true, rootMargin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion();
  const print = (s: (typeof STATS)[number]) =>
    `${s.value.toLocaleString("en-US", { minimumFractionDigits: s.decimals ?? 0, useGrouping: s.grouping ?? true })}${s.suffix ?? ""}`;

  return (
    <ul className="numbers-strip" ref={ref} aria-label="By the numbers">
      {STATS.map((s) => (
        <li key={s.label}>
          <span className="numbers-strip__logo" aria-hidden="true">{s.logo}</span>
          <span className="numbers-strip__figure">
            {shown && !reduced ? (
              <Counter value={s.value} decimals={s.decimals} grouping={s.grouping} suffix={s.suffix} />
            ) : (
              print(s)
            )}
          </span>
          {"href" in s ? (
            <a className="numbers-strip__label numbers-strip__link" href={s.href} target="_blank" rel="noopener noreferrer">
              {s.label} <FiArrowUpRight aria-hidden="true" />
              <span className="sr-only"> (score report, opens in a new tab)</span>
            </a>
          ) : (
            <span className="numbers-strip__label">{s.label}</span>
          )}
          <span className="numbers-strip__note">{s.note}</span>
        </li>
      ))}
    </ul>
  );
}

function FindMyWork() {
  return (
    <div className="find-my-work" id="work">
      <h2 className="heading section-title" data-color-inverted={"true"}>
        Cool <em>Things</em>
      </h2>
      <p className="work-sub">
        What I've built and what I've won.
      </p>
      <div className="work-list">
        <MedalsShowcase />
        {projects.map((project, i) => (
          <ProjectRow key={project.slug} project={project} index={i} />
        ))}
        <NumbersStrip />
        <DesmosSketches />
      </div>
    </div>
  );
}

export default FindMyWork;
