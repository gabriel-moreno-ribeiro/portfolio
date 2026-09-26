import { useEffect, useRef, useState } from "react";
import { FiArrowUpRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Project, projects } from "../../content/projects";
import useIsMobile from "../../hooks/useIsMobile";
import { Counter, usePageVisible, useReducedMotion, useVisible } from "../../lib/motion";

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

// The final number is the default; the count only runs once the card enters the
// viewport, so a card still below the fold never reads "0 medals".
function MedalsLive({ project }: { project: Project }) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useVisible(ref, { once: true });
  const reduced = useReducedMotion();
  const medals = toNumber(project.stats[0]?.value ?? "0");

  return (
    <div className="project-live" ref={ref}>
      <p className="project-live__counts">
        <strong>
          {shown && !reduced ? <Counter value={medals} /> : medals}
        </strong>{" "}
        medals in 49 competitions
      </p>
    </div>
  );
}

function ProjectLive({ project }: { project: Project }) {
  return project.slug === "medals" ? <MedalsLive project={project} /> : null;
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
        <h3>
          <Link to={`/work/${project.slug}`} className="featured-card__link">
            {project.title}
          </Link>
        </h3>
        <p>{project.cardDesc}</p>
        <ProjectLive project={project} />
        <div className="featured-tags">
          {project.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
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
      <h2 className="heading section-title" data-color-inverted={"true"}>
        Cool <em>Things</em>
      </h2>
      <p className="work-sub">
        What I've built and what I've won.
      </p>
      <div className="featured-grid">
        {projects.map((project) => (
          <FeaturedCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  );
}

export default FindMyWork;
