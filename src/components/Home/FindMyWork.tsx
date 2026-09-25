import { useEffect, useRef, useState } from "react";
import { FiArrowUpRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Project, projects } from "../../content/projects";
import { toggleTerminalWindow } from "../../utils/terminalWindow";

function MediaCarousel({ project }: { project: Project }) {
  const available = project.gallery ?? [];
  const [idx, setIdx] = useState(0);
  const [inView, setInView] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const restartTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (available.length <= 1 || !inView) return;
    timerRef.current = setInterval(() => setIdx((i) => (i + 1) % available.length), 4000);
  };

  // Off-screen the rotation is invisible, and every tick pulls down another photo
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    restartTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [available.length, inView]);

  if (available.length === 0) return null;

  const current = available[idx % available.length];
  const src = `/work/${project.slug}/${current}`;
  const prev = () => { setIdx((i) => (i - 1 + available.length) % available.length); restartTimer(); };
  const next = () => { setIdx((i) => (i + 1) % available.length); restartTimer(); };

  return (
    <div className="media-carousel" ref={wrapRef}>
      {current.endsWith(".mp4") ? (
        <video key={src} src={src} controls playsInline />
      ) : (
        <img key={src} src={src} alt={project.captions?.[current] ?? project.title} loading="lazy" />
      )}
      {available.length > 1 && (
        <>
          <button className="carousel-arrow left" onClick={prev} aria-label="Previous">
            <FiChevronLeft />
          </button>
          <button className="carousel-arrow right" onClick={next} aria-label="Next">
            <FiChevronRight />
          </button>
          <div className="carousel-dots">
            {available.map((f, i) => (
              <button
                key={f}
                type="button"
                className={i === idx % available.length ? "dot active" : "dot"}
                onClick={() => { setIdx(i); restartTimer(); }}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// The whole card is one link target: the title anchor stretches over the card, so
// the carousel controls stay clickable by sitting above it.
function FeaturedCard({ project }: { project: Project }) {
  const hasMedia = (project.gallery?.length ?? 0) > 0;

  return (
    <div className={`featured-card${hasMedia ? " featured-card--wide" : ""}`}>
      <MediaCarousel project={project} />
      <div className="featured-card__body">
        <h2>
          <Link to={`/work/${project.slug}`} className="featured-card__link">
            {project.title}
          </Link>
        </h2>
        <p>{project.cardDesc}</p>
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
