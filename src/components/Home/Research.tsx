import { lazy, Suspense, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiFileText } from 'react-icons/fi';
import { Reveal, useVisible } from '../../lib/motion';

const BAR_GAP = 0.45;
// If the chunk fails to load, the labels below the plot still carry every number.
const ResearchChart = lazy(() => import('./ResearchChart').catch(() => ({ default: () => <></> })));

/** One small bar chart per paper. Every value is quoted from the paper or from the card copy. */
interface ResearchFigure {
  caption: string;
  /** `text` is the value as the source prints it. */
  bars: { label: string; value: number; text: string }[];
}

interface ResearchItem {
  slug: string;
  title: string;
  field: string;
  year: string;
  advisor?: string;
  abstract: string;
  tags: string[];
  pdf?: string;
  figure?: ResearchFigure;
}

// Only probe for actually-uploaded media. Add slugs to this map when files exist.
const RESEARCH_MEDIA_MANIFEST: Record<string, string[]> = {
  'fintech-rct': ['01.webp'],
  'chemical-kinetics': ['01.webp'],
  'projeto-candela': ['01.webp'],
};

const researchItems: ResearchItem[] = [
  {
    slug: 'fintech-rct',
    title: 'Do Budgeting Tools Help Low-Income Students Save?',
    field: 'Behavioral Economics',
    year: '2025-2026',
    advisor: 'Aaron Litvin, Ph.D. (Harvard)',
    abstract:
      'A 175-page monograph. RCT with 208 OBMEP scholarship students and three budgeting tools. Any tool raised reported saving by 52 pp, and the result survives every check. But the data cannot say how much of that is money actually saved, so I propose a follow-up with bank balances and a placebo arm.',
    tags: ['RCT', 'Budgeting Tools', 'Behavioral Economics', 'Python', 'Statistics'],
    pdf: '/research/fintech-rct/paper.pdf',
    // Table 6.1 (p. 67), October row; labels as rounded in Figure 6.1.
    figure: {
      caption: 'Reported saving in October, % of residual income (Table 6.1)',
      bars: [
        { label: 'Control', value: 44.25, text: '44%' },
        { label: 'Spreadsheet', value: 91.4, text: '91%' },
        { label: 'App', value: 97.82, text: '98%' },
        { label: 'Hybrid', value: 101.07, text: '101%' },
      ],
    },
  },
  {
    slug: 'chemical-kinetics',
    title: 'The Steady-State Hypothesis: when it holds and how much it misses',
    field: 'Chemical Kinetics',
    year: '2023-2026',
    advisor: 'Prof. Juliano Alves Bonacin, Ph.D.',
    abstract:
      'A 150-page monograph on the approximation chemical kinetics uses for intermediates that appear and vanish too fast to measure: when it holds, how much it misses, and whether data can tell. Exact solutions of textbook mechanisms, the Chapman ozone cycle, the start-up of an ammonia reactor, 1,968 enzyme assays from the SABIO-RK database, and a bench test with invertase and a glucose meter, proposed and not yet run. Written at the Escola de Talentos of Instituto Principia and revised in October 2026.',
    tags: ['Chemical Kinetics', 'Numerical Simulation', 'Python', 'LaTeX', '150 pages'],
    pdf: '/research/chemical-kinetics/paper.pdf',
    // Table 6 (p. 41), column 2, as a percentage of [A]0.
    figure: {
      caption: 'Largest error of the approximation in A → I → B, as % of the initial [A], by how many times faster the second step is (Table 6)',
      bars: [
        { label: '1×', value: 36.8, text: '36.8%' },
        { label: '2×', value: 25.0, text: '25.0%' },
        { label: '5×', value: 13.4, text: '13.4%' },
        { label: '10×', value: 7.7, text: '7.7%' },
        { label: '50×', value: 1.85, text: '1.85%' },
        { label: '100×', value: 0.95, text: '0.95%' },
        { label: '1000×', value: 0.1, text: '0.10%' },
      ],
    },
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
    // From the abstract above; the PDF does not report these two numbers.
    figure: {
      caption: 'Physics failure rate in the classrooms that used the kits',
      bars: [
        { label: 'Before', value: 30, text: '30%' },
        { label: 'With the kits', value: 10, text: '10%' },
      ],
    },
  },
];

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

function ResearchFigureView({ figure }: { figure: ResearchFigure }) {
  const ref = useRef<HTMLElement>(null);
  // Mounted on arrival, so the bars never grow off-screen.
  const seen = useVisible(ref, { once: true });
  const n = figure.bars.length;
  // The labels sit under the band centres of the chart's scale (d3 scaleBand, padding BAR_GAP).
  const pad = `${(100 * BAR_GAP) / (2 * (n + BAR_GAP))}%`;

  return (
    <figure className="research-figure" ref={ref}>
      <div className="research-figure__chart" style={{ maxWidth: Math.min(76, 336 / n) * n }}>
        <div className="research-figure__plot" aria-hidden="true">
          {seen && (
            <Suspense fallback={null}>
              <ResearchChart bars={figure.bars} barGap={BAR_GAP} />
            </Suspense>
          )}
        </div>
        <ul className="research-figure__labels" style={{ paddingInline: pad }}>
          {figure.bars.map((bar) => (
            <li key={bar.label}>
              <strong>{bar.text}</strong>
              <span>{bar.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="research-figure__caption">{figure.caption}</figcaption>
    </figure>
  );
}

function ResearchCard({ item, index }: { item: ResearchItem; index: number }) {
  const media = RESEARCH_MEDIA_MANIFEST[item.slug] ?? [];
  const hasMedia = media.length > 0;
  // First page preview, shown on hover/focus over a card that links to a PDF.
  // A 520px copy: the popover is 248px wide
  const preview = item.pdf && hasMedia ? `/research/${item.slug}/${media[0].replace(/\.webp$/, '-preview.webp')}` : null;

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
        {item.figure && <ResearchFigureView figure={item.figure} />}
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
          <ResearchCard key={item.slug} item={item} index={i} />
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
