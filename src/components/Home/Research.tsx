import { motion, useInView } from 'motion/react';
import { useRef, useState } from 'react';
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

const MEDIA_FILES = ['01.jpg', '02.jpg', '03.jpg', '01.mp4'];

const researchItems: ResearchItem[] = [
  {
    slug: 'fintech-rct',
    title: 'Impact of Fintech Tools on Adolescent Savings Behavior',
    field: 'Behavioral Economics',
    year: '2025',
    advisor: 'Aaron Litvin, Ph.D. (Harvard)',
    abstract:
      'Randomized controlled trial with 208 public-school students measuring how access to fintech apps changes savings behavior. Treatment group saved 130% more than control over the study period.',
    tags: ['RCT', 'Fintech', 'Behavioral Economics', 'Python', 'Statistics'],
    pdf: '/research/fintech-rct/paper.pdf',
  },
  {
    slug: 'chemical-kinetics',
    title: 'Modeling Reaction Mechanisms in Chemical Kinetics',
    field: 'Physical Chemistry',
    year: '2023-2025',
    advisor: 'Prof. Juliano Bonacin, Ph.D.',
    abstract:
      '59-page thesis modeling reaction rate mechanisms with 97% accuracy using numerical methods. Covered steady-state approximation, Michaelis-Menten kinetics, and oscillating reactions.',
    tags: ['MATLAB', 'Mathematica', 'LaTeX', 'Numerical Methods', 'Kinetics'],
    pdf: '/research/chemical-kinetics/paper.pdf',
  },
  {
    slug: 'projeto-candela',
    title: 'Low-Cost Physics Lab Kits for Public Schools',
    field: 'Physics Education',
    year: '2023-2024',
    abstract:
      'Designed and distributed low-cost experimental physics kits to 28 public schools, reaching 3,392 students. Measured a drop in physics failure rates from 30% to 10% in participating classrooms.',
    tags: ['Physics Education', 'Experimental Design', '3,392 students', '28 schools'],
    pdf: '/research/projeto-candela/paper.pdf',
  },
];

function ResearchMediaCarousel({ slug }: { slug: string }) {
  const [loaded, setLoaded] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const checkedRef = useRef(false);

  if (!checkedRef.current) {
    checkedRef.current = true;
    MEDIA_FILES.forEach((file) => {
      const url = `/research/${slug}/${file}`;
      if (file.endsWith('.mp4')) {
        const probe = document.createElement('video');
        probe.preload = 'metadata';
        probe.onloadedmetadata = () => setLoaded((prev) => [...prev, file]);
        probe.src = url;
      } else {
        const probe = new Image();
        probe.onload = () => setLoaded((prev) => [...prev, file]);
        probe.src = url;
      }
    });
  }

  const available = MEDIA_FILES.filter((f) => loaded.includes(f));

  if (available.length === 0) {
    return (
      <div className="research-media-placeholder">
        <span>📄</span>
        <small>Add media to <code>/research/{slug}/</code></small>
      </div>
    );
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

  const handleClick = () => {
    if (item.pdf) {
      window.open(item.pdf, '_blank');
    }
  };

  return (
    <motion.div
      ref={ref}
      className={`research-card ${item.pdf ? 'research-card--clickable' : ''}`}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={handleClick}
    >
      <ResearchMediaCarousel slug={item.slug} />
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
      <h1 className="heading" data-color-inverted="true">
        Research
      </h1>
      <p className="research-section__subtitle">
        From behavioral economics to physical chemistry — here's what I've investigated.
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
