import { lazy, Suspense, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiFileText } from 'react-icons/fi';
import { Reveal, useVisible } from '../../lib/motion';
import { KINETICS_RATIOS, KINETICS_SERIES, KIT_EXPERIMENTS, RCT_ARMS, RCT_MONTHS } from './researchFigures';

// If the chunk fails to load, the headline, the legend and the table still carry the numbers.
const ResearchChart = lazy(() =>
  import('./ResearchChart').catch(() => ({
    default: () => <p className="research-figure__error">The chart could not load. Its numbers are in the paper.</p>,
  })),
);

/** One chart per paper. The numbers and their pages are in researchFigures.ts. */
interface ResearchFigure {
  kind: 'rct' | 'kinetics' | 'candela';
  /** Headline number and what it measures. Kinetics has none: its headline follows the chosen ratio. */
  stat?: { value: string; label: string };
  legend: { label: string; value?: string; color: string; dashed?: boolean }[];
  caption: string;
  /** What the plot shows, for screen readers. */
  alt: string;
  /** The plotted values, read by screen readers in place of the plot. */
  table: { head: string[]; rows: string[][] };
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
    figure: {
      kind: 'rct',
      // "The gap between the control group and the treated groups is about 52.0 points" (p. 67).
      stat: { value: '+52 pp', label: 'reported saving with any tool, against the control group, in October' },
      legend: RCT_ARMS.map((arm) => ({
        label: arm.label,
        value: `${arm.mean[3].toFixed(2)}%`,
        color: arm.color,
        dashed: arm.key === 'control',
      })),
      caption:
        'Average reported saving by group and month, as % of initial residual income. Shaded: the three months with the tools. Legend: October. Table 6.1, p. 67.',
      alt: 'Line chart. The three groups with a budgeting tool rise from about 40% at baseline to between 91% and 101% in October; the control group stays near 42%.',
      table: {
        head: ['Month', ...RCT_ARMS.map((arm) => `${arm.label}, mean (standard deviation)`)],
        rows: RCT_MONTHS.map((month, i) => [month, ...RCT_ARMS.map((arm) => `${arm.mean[i].toFixed(2)}% (${arm.sd[i]})`)]),
      },
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
    figure: {
      kind: 'kinetics',
      legend: KINETICS_SERIES,
      caption:
        'A → I → B as % of the initial [A], with time in units of 1/k₁. Curves computed from the exact solution and from the approximation, Equations 3.16 and 3.17 (p. 40); largest error from Table 6 (p. 41).',
      alt: 'Line chart of the mechanism A → I → B over time. The product predicted by the approximation runs ahead of the exact one by what is still held in the intermediate, and the gap shrinks as the second step gets faster.',
      table: {
        head: ['Second step faster by', 'Largest error of the approximation, as % of the initial [A]'],
        rows: KINETICS_RATIOS.map((k) => [`${k.ratio}×`, k.maxError]),
      },
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
    // The 30% → 10% above is the site's own copy; the PDF does not report it. The chart
    // plots what the PDF does: the cost of the kit, experiment by experiment.
    figure: {
      kind: 'candela',
      stat: { value: 'R$83', label: 'in materials for a complete kit of five experiments' },
      legend: [],
      caption: 'Material cost of each experiment in the kit, in reais. Table 1, p. 5.',
      alt: 'Bar chart of the material cost of each of the five experiments in the kit.',
      table: {
        head: ['Experiment', 'Physics domain', 'Material cost'],
        rows: KIT_EXPERIMENTS.map((e) => [e.name, e.domain, `R$${e.cost}`]),
      },
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
  // Mounted on arrival, so nothing draws itself off-screen.
  const seen = useVisible(ref, { once: true });
  const [ratio, setRatio] = useState(KINETICS_RATIOS[0]);
  const kinetics = figure.kind === 'kinetics';
  const stat = figure.stat ?? {
    value: ratio.maxError,
    label: `of the initial reactant: the most the approximation overstates the product when the second step is ${ratio.ratio}× faster`,
  };

  return (
    // .bk carries the chart colours, for the legend as much as for the plot.
    <figure className={`research-figure research-figure--${figure.kind} bk`} ref={ref}>
      <div className="research-figure__head">
        <p className="research-figure__stat" aria-live={kinetics ? 'polite' : undefined}>
          <strong>{stat.value}</strong> <span>{stat.label}</span>
        </p>
        {kinetics && (
          <div className="research-figure__toggle" role="group" aria-label="How many times faster the second step is">
            <span aria-hidden="true">Second step</span>
            {KINETICS_RATIOS.map((k) => (
              <button key={k.ratio} type="button" aria-pressed={k === ratio} onClick={() => setRatio(k)}>
                {k.ratio}×<span className="sr-only"> faster</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {figure.legend.length > 0 && (
        <ul className="research-figure__legend">
          {figure.legend.map((item) => (
            <li key={item.label}>
              <i style={{ borderColor: item.color }} data-dashed={item.dashed || undefined} aria-hidden="true" />
              {item.label}
              {item.value && <b>{item.value}</b>}
            </li>
          ))}
        </ul>
      )}
      <div className="research-figure__plot" role="img" aria-label={figure.alt}>
        {seen && (
          <Suspense fallback={null}>
            <ResearchChart kind={figure.kind} ratio={ratio.ratio} />
          </Suspense>
        )}
      </div>
      {/* A table ignores the 1px box of .sr-only; the wrapper takes it. */}
      <div className="sr-only">
        <table>
          <thead>
            <tr>
              {figure.table.head.map((cell) => (
                <th key={cell} scope="col">{cell}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {figure.table.rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, i) => (i === 0 ? <th key={i} scope="row">{cell}</th> : <td key={i}>{cell}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
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
