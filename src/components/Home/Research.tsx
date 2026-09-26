import { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiFileText } from 'react-icons/fi';
import { Reveal } from '../../lib/motion';

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
  'projeto-candela': ['01.webp'],
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
      'A 59-page thesis modeling reaction rate mechanisms with numerical methods, at 97% accuracy. Covers the steady-state approximation, Michaelis-Menten kinetics and oscillating reactions.',
    tags: ['MATLAB', 'Mathematica', 'LaTeX', 'Numerical Methods', 'Kinetics'],
    // pdf: '/research/chemical-kinetics/paper.pdf', // TODO: upload PDF to enable badge
  },
  {
    slug: 'projeto-candela',
    title: 'Low-Cost Physics Lab Kits for Public Schools',
    field: 'Physics Education',
    year: '2023-2024',
    advisor: 'Coronel Iran Domingues Machado',
    abstract:
      'Low-cost physics kits, built and delivered to 28 public schools. 3,392 students. Physics failure rates went from 30% to 10% in the classrooms that used them.',
    tags: ['Physics Education', 'Experimental Design', '3,392 students', '28 schools'],
    pdf: '/research/projeto-candela/paper.pdf',
  },
];

/** Index of the most recent paper (last year mentioned in `year` wins; ties go to the first). */
const latestIndex = researchItems.reduce((best, item, i, all) => {
  const yearOf = (v: string) => Number(v.slice(-4));
  return yearOf(item.year) > yearOf(all[best].year) ? i : best;
}, 0);

function ResearchMediaCarousel({ slug, title }: { slug: string; title: string }) {
  const available = RESEARCH_MEDIA_MANIFEST[slug] ?? [];
  const [idx, setIdx] = useState(0);

  if (available.length === 0) return null;

  const current = available[idx % available.length];
  const src = `/research/${slug}/${current}`;
  const prev = () => setIdx((i) => (i - 1 + available.length) % available.length);
  const next = () => setIdx((i) => (i + 1) % available.length);

  return (
    <div className="research-media">
      {current.endsWith('.mp4') ? (
        <video key={src} src={src} controls playsInline width={210} height={297} />
      ) : (
        <img
          key={src}
          src={src}
          alt={`First page of the paper: ${title}`}
          width={210}
          height={297}
          loading="lazy"
          decoding="async"
        />
      )}
      {available.length > 1 && (
        <>
          <button className="carousel-arrow left" onClick={prev} aria-label="Previous page">
            <FiChevronLeft />
          </button>
          <button className="carousel-arrow right" onClick={next} aria-label="Next page">
            <FiChevronRight />
          </button>
        </>
      )}
    </div>
  );
}

function ResearchCard({ item, index, isLatest }: { item: ResearchItem; index: number; isLatest: boolean }) {
  const media = RESEARCH_MEDIA_MANIFEST[item.slug] ?? [];
  const hasMedia = media.length > 0;
  // First page preview, shown on hover/focus over a card that links to a PDF.
  const preview = item.pdf && hasMedia ? `/research/${item.slug}/${media[0]}` : null;

  return (
    <Reveal
      as="article"
      delay={index * 0.06}
      className={`research-card ${item.pdf ? 'research-card--clickable' : ''} ${!hasMedia ? 'research-card--no-media' : ''}`}
    >
      <ResearchMediaCarousel slug={item.slug} title={item.title} />
      <div className="research-card__content">
        <div className="research-card__header">
          <span className="research-card__field">{item.field}</span>
          <span className="research-card__year">{item.year}</span>
          {isLatest && <span className="research-card__latest">latest</span>}
          {item.pdf && (
            <span className="research-card__pdf" aria-hidden="true">
              <FiFileText /> Read Paper
            </span>
          )}
        </div>
        <h3 className="research-card__title">
          {item.pdf ? (
            <a
              className="research-card__link"
              href={item.pdf}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </h3>
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
      {preview && (
        <img
          className="research-card__preview"
          src={preview}
          alt=""
          aria-hidden="true"
          width={248}
          height={350}
          loading="lazy"
          decoding="async"
        />
      )}
    </Reveal>
  );
}

function Research() {
  return (
    <section className="research-section" id="research">
      <h2 className="heading section-title" data-color-inverted="true">
        Research <em>Papers</em>
      </h2>
      <div className="research-grid">
        {researchItems.map((item, i) => (
          <ResearchCard key={item.slug} item={item} index={i} isLatest={i === latestIndex} />
        ))}
      </div>
      <p className="research-section__orcid">
        <a href="https://orcid.org/0009-0009-2574-6646" target="_blank" rel="noopener noreferrer">
          ORCID 0009-0009-2574-6646
        </a>
      </p>
    </section>
  );
}

export default Research;
