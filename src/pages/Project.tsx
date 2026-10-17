import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiArrowLeft, FiArrowUpRight, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import MedalWall from '../components/Medals/MedalWall';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Shared/Footer';
import { Project, projectBySlug, projects } from '../content/projects';
import { useDocumentHead } from '../hooks/useDocumentHead';
import '../styles/components/pages/project.scss';

const NotFound = lazy(() => import('./NotFound'));

const EASE = [0.22, 1, 0.36, 1] as const;

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE, delay },
});

/** Full-bleed viewer for a gallery photo, closed with Escape or a click outside. */
function Lightbox({
  project,
  index,
  onClose,
  onStep,
}: {
  project: Project;
  index: number;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const gallery = project.gallery ?? [];
  const file = gallery[index];
  // Touch has no arrows (they'd cover the photo): a horizontal swipe steps.
  const swipeStart = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus moves to Close, Tab cycles inside the dialog, and whoever opened it
  // gets the focus back when it closes.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onStep(1);
      if (e.key === 'ArrowLeft') onStep(-1);
      if (e.key === 'Tab' && dialogRef.current) {
        const f = [...dialogRef.current.querySelectorAll<HTMLElement>('button')];
        const i = f.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length]?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, [onClose, onStep]);

  // Portalled to the body: .project sets z-index, so a lightbox rendered inside
  // it would stay trapped below the navbar and the floating buttons.
  return createPortal(
    <div ref={dialogRef} className="project-lightbox" role="dialog" aria-modal="true" aria-label={project.title} onClick={onClose}>
      <button ref={closeRef} className="project-lightbox__close" onClick={onClose} aria-label="Close">
        <FiX aria-hidden="true" />
      </button>
      {gallery.length > 1 && (
        <button
          className="project-lightbox__nav left"
          onClick={(e) => { e.stopPropagation(); onStep(-1); }}
          aria-label="Previous photo"
        >
          <FiChevronLeft aria-hidden="true" />
        </button>
      )}
      <figure
        className="project-lightbox__figure"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => { if (e.pointerType !== 'mouse') swipeStart.current = e.clientX; }}
        onPointerUp={(e) => {
          if (swipeStart.current === null) return;
          const dx = e.clientX - swipeStart.current;
          swipeStart.current = null;
          if (gallery.length > 1 && Math.abs(dx) > 40) onStep(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => { swipeStart.current = null; }}
      >
        <img src={`/work/${project.slug}/${file}`} alt={project.captions?.[file] ?? project.title} />
        {project.captions?.[file] && <figcaption>{project.captions[file]}</figcaption>}
      </figure>
      {gallery.length > 1 && (
        <button
          className="project-lightbox__nav right"
          onClick={(e) => { e.stopPropagation(); onStep(1); }}
          aria-label="Next photo"
        >
          <FiChevronRight aria-hidden="true" />
        </button>
      )}
    </div>,
    document.body,
  );
}

function ProjectPage() {
  const { slug } = useParams();
  const project = projectBySlug(slug);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const step = useCallback(
    (delta: number) => {
      const total = project?.gallery?.length ?? 0;
      if (!total) return;
      setLightbox((i) => (i === null ? i : (i + delta + total) % total));
    },
    [project],
  );

  useDocumentHead({
    title: project ? `${project.title} · Gabriel Moreno Ribeiro` : '404 · Gabriel Moreno Ribeiro',
    description: project?.summary ?? 'Page not found.',
    canonical: project ? `https://gabrielmr.com/work/${project.slug}` : undefined,
    noindex: !project,
  });

  // A slug that isn't a project (typo, old link) is a 404, not a quiet trip home.
  if (!project) return <Suspense fallback={null}><NotFound /></Suspense>;

  const gallery = project.gallery ?? [];
  const [hero, ...rest] = gallery;
  const others = projects.filter((p) => p.slug !== project.slug);

  return (
    <main className="project" id="main-content">
      <div className="page-nav"><Navbar /></div>

      <motion.header className="project__header" {...rise(0.08)}>
        <p className="project__eyebrow">
          <Link to="/#work" className="page-back"><FiArrowLeft aria-hidden="true" /> Cool Things</Link>
          <i />
          <span>{project.eyebrow}</span>
        </p>
        <h1 className="project__title">{project.title}</h1>
        <p className="project__summary">{project.summary}</p>
        <div className="project__meta">
          {project.role && <span>{project.role}</span>}
          {project.role && project.period && <i />}
          {project.period && <span>{project.period}</span>}
        </div>
      </motion.header>

      {project.slug === 'medals' && <MedalWall />}

      {hero && project.slug !== 'medals' && (
        <motion.button
          type="button"
          className="project__hero"
          onClick={() => setLightbox(0)}
          aria-label={`Open ${project.captions?.[hero] ?? project.title} full size`}
          {...rise(0.16)}
        >
          <img
            src={`/work/${project.slug}/${hero}`}
            alt={project.captions?.[hero] ?? project.title}
            style={project.focus?.[hero] ? { objectPosition: project.focus[hero] } : undefined}
          />
        </motion.button>
      )}

      {project.stats.length > 0 && (
        <motion.ul className="project__stats" {...rise(0.2)}>
          {project.stats.map((s) => (
            <li key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </li>
          ))}
        </motion.ul>
      )}

      <div className="project__body">
        {project.sections.map((section, i) => (
          <motion.section key={section.heading} className="project__section" {...rise(0.24 + i * 0.04)}>
            <h2>{section.heading}</h2>
            {section.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </motion.section>
        ))}

        {project.links && project.links.length > 0 && (
          <motion.div className="project__links" {...rise(0.3)}>
            {project.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
              >
                {link.label} <FiArrowUpRight aria-hidden="true" />
              </a>
            ))}
          </motion.div>
        )}
      </div>

      {rest.length > 0 && (
        <motion.section className="project__gallery" aria-label="Photos" {...rise(0.32)}>
          <h2>Photos</h2>
          <div className="project__grid">
            {rest.map((file, i) => (
              <button
                key={file}
                type="button"
                className="project__shot"
                onClick={() => setLightbox(i + 1)}
                aria-label={`Open ${project.captions?.[file] ?? `photo ${i + 2}`} full size`}
              >
                <img
                  src={`/work/${project.slug}/sm/${file}`}
                  srcSet={`/work/${project.slug}/sm/${file} 640w, /work/${project.slug}/${file} 1600w`}
                  sizes="(max-width: 600px) 100vw, 360px"
                  alt={project.captions?.[file] ?? `${project.title} photo ${i + 2}`}
                  loading="lazy"
                  style={project.focus?.[file] ? { objectPosition: project.focus[file] } : undefined}
                />
                {project.captions?.[file] && <span>{project.captions[file]}</span>}
              </button>
            ))}
          </div>
        </motion.section>
      )}

      <nav className="project__more" aria-label="Other work">
        <h2>More</h2>
        <ul>
          {others.map((p) => (
            <li key={p.slug}>
              <Link to={`/work/${p.slug}`}>
                <strong>{p.title}</strong>
                <span>{p.summary}</span>
                <FiArrowUpRight aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {lightbox !== null && (
        <Lightbox project={project} index={lightbox} onClose={() => setLightbox(null)} onStep={step} />
      )}

      <Footer />
    </main>
  );
}

export default ProjectPage;
