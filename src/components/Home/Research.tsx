import { motion, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiFileText } from 'react-icons/fi';

interface ResearchItem {
  slug: string;
  title: string;
  field: string;
  year: string;
  advisor?: string;
  abstract: string;
  tags: string[];
  pdf?: string;
}

// Only probe for actually-uploaded media. Add slugs to this map when files exist.
const RESEARCH_MEDIA_MANIFEST: Record<string, string[]> = {
  'projeto-candela': ['01.jpg'],
};

const researchItems: ResearchItem[] = [
  {
    slug: 'fintech-rct',
    title: 'Impact of Fintech Tools on Adolescent Savings Behavior',
    field: 'Behavioral Economics',
    year: '2025',
    advisor: 'Aaron Litvin, Ph.D. (Harvard)',
    abstract:
      'RCT with 208 public-school students on whether fintech apps change savings behavior. The treatment group saved 130% more than control over the study period.',
    tags: ['RCT', 'Fintech', 'Behavioral Economics', 'Python', 'Statistics'],
    // pdf: '/research/fintech-rct/paper.pdf', // TODO: upload PDF to enable badge
  },
  {
    slug: 'chemical-kinetics',
    title: 'Modeling Reaction Mechanisms in Chemical Kinetics',
    field: 'Physical Chemistry',
    year: '2023-2025',
    advisor: 'Prof. Juliano Bonacin, Ph.D.',
    abstract:
      '59-page thesis modeling reaction rate mechanisms — 97% accuracy using numerical methods. Covers steady-state approximation, Michaelis-Menten kinetics, and oscillating reactions.',
    tags: ['MATLAB', 'Mathematica', 'LaTeX', 'Numerical Methods', 'Kinetics'],
    // pdf: '/research/chemical-kinetics/paper.pdf', // TODO: upload PDF to enable badge
  },
  {
    slug: 'projeto-candela',
    title: 'Low-Cost Physics Lab Kits for Public Schools',
    field: 'Physics Education',
    year: '2023-2024',
    abstract:
      'Built and distributed low-cost physics experiment kits to 28 public schools. 3,392 students. Physics failure rates went from 30% to 10% in participating classrooms.',
    tags: ['Physics Education', 'Experimental Design', '3,392 students', '28 schools'],
    pdf: '/research/projeto-candela/paper.pdf',
  },
];

function ResearchMediaCarousel({ slug, onHasMedia }: { slug: string; onHasMedia?: (has: boolean) => void }) {
  // Use static manifest — no speculative 404 probing
  const knownFiles = RESEARCH_MEDIA_MANIFEST[slug] ?? [];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (knownFiles.length > 0) onHasMedia?.(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const available = knownFiles;

  if (available.length === 0) {
    return null;
  }

  const current = available[idx % available.length];
  const src = `/research/${slug}/${current}`;
  const prev = () => setIdx((i) => (i - 1 + available.length) % available.length);
  const next = () => setIdx((i) => (i + 1) % available.length);

  return (
    <div className="research-media">
      {current.endsWith('.mp4') ? (
        <video key={src} src={src} controls playsInline />
      ) : (
        <img key={src} src={src} alt={slug} loading="lazy" />
      )}
      {available.length > 1 && (
        <>
          <button className="carousel-arrow left" onClick={prev} aria-label="Previous">
            <FiChevronLeft />
          </button>
          <button className="carousel-arrow right" onClick={next} aria-label="Next">
            <FiChevronRight />
          </button>
        </>
      )}
    </div>
  );
}

function ResearchCard({ item, index }: { item: ResearchItem; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px -80px 0px' });
  const [hasMedia, setHasMedia] = useState(false);

  const handleClick = () => {
    if (item.pdf) window.open(item.pdf, '_blank', 'noopener');
  };

  const interactive = !!item.pdf;

  return (
    <motion.div
      ref={ref}
      className={`research-card ${interactive ? 'research-card--clickable' : ''} ${!hasMedia ? 'research-card--no-media' : ''}`}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={interactive ? handleClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } } : undefined}
    >
      <ResearchMediaCarousel slug={item.slug} onHasMedia={setHasMedia} />
      <div className="research-card__content">
        <div className="research-card__header">
          <span className="research-card__field">{item.field}</span>
          <span className="research-card__year">{item.year}</span>
          {item.pdf && (
            <span className="research-card__pdf">
              <FiFileText /> Read Paper
            </span>
          )}
        </div>
        <h3 className="research-card__title">{item.title}</h3>
        {item.advisor && (
          <p className="research-card__advisor">Advisor: {item.advisor}</p>
        )}
        <p className="research-card__abstract">{item.abstract}</p>
        <div className="research-card__tags">
          {item.tags.map((tag) => (
            <span key={tag} className="research-tag">{tag}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Research() {
  return (
    <section className="research-section" id="research">
      <h2 className="heading" data-color-inverted="true">
        Research
      </h2>
      <p className="research-section__subtitle">
        Three fields. Real data. Papers attached.
      </p>
      <div className="research-grid">
        {researchItems.map((item, i) => (
          <ResearchCard key={item.slug} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}

export default Research;
