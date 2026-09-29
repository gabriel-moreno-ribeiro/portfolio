import { useEffect } from 'react';
import { FiArrowLeft, FiArrowUpRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import PostEmbed from '../components/News/PostEmbed';
import Footer from '../components/Shared/Footer';
import { mentions, type Mention } from '../data/news';
import newsMedia from '../data/news-media.json';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { Reveal } from '../lib/motion';
import '../styles/components/pages/news.scss';

type Media = { image: string; w: number; h: number; alt: string; caption: string };
const MEDIA: Record<string, Media> = newsMedia;

// Where the crop sits when a portrait cover goes into a wider frame (default: centre)
const FOCUS: Record<string, string> = {
  DcBlbZOh5hx: '50% 20%', // head and badge inside the square frame
  DRhNb1vgH3p: '50% 22%',
  C0mIBI9MMmB: '50% 28%',
};

// Photo beside the lead story: the team of five, chosen by Gabriel.
const FEATURED_PHOTO = {
  src: '/work/hibeex/01.webp',
  w: 1200,
  h: 800,
  alt: 'The HIBEEX team of five by a window at night, two seated in white HIBEEX sweatshirts and three standing behind them, with the São Paulo skyline outside.',
};

const postId = (url: string) => url.match(/instagram\.com\/(?:p|reel)\/([^/?#]+)/)?.[1] ?? '';
const mediaFor = (m: Mention) => (m.instagram ? MEDIA[postId(m.instagram)] : undefined);

// Text link with an underline that grows on hover (transform only). With `stretch`
// the link also covers its card, so the photo and title are clickable too.
function TextLink({ href, label, context, stretch }: { href: string; label: string; context?: string; stretch?: boolean }) {
  return (
    <a
      className={stretch ? 'news__link news__link--stretch' : 'news__link'}
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={context ? `${label}, ${context}` : undefined}
    >
      <span className="news__link-text">{label}</span>
      <FiArrowUpRight aria-hidden="true" />
    </a>
  );
}

function Meta({ m }: { m: Mention }) {
  return (
    <p className="news__meta">
      <span className="news__outlet">{m.outlet}</span>
      <span className="news__date">{m.date}</span>
    </p>
  );
}

function Entry({ m, eager, solo }: { m: Mention; eager: boolean; solo: boolean }) {
  const media = mediaFor(m);

  if (m.instagram && media) {
    const id = postId(m.instagram);
    // The only photo of its year runs the full width: square photo on the left, text on the right
    return (
      <Reveal as="li" className={solo ? 'news__entry news__card news__card--solo' : 'news__entry news__card'}>
        <div className="news__photo">
          <img
            src={media.image}
            width={media.w}
            height={media.h}
            alt={media.alt}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            style={FOCUS[id] ? { objectPosition: FOCUS[id] } : undefined}
          />
        </div>
        <div className="news__card-text">
          <Meta m={m} />
          <h4 className="news__entry-title">{m.title}</h4>
          {m.summary && <p className="news__summary">{m.summary}</p>}
          <TextLink href={m.instagram} label="Open on Instagram" context={m.title} stretch />
        </div>
      </Reveal>
    );
  }

  // Programs, press, and any post without a saved photo: a text block across the full width,
  // so it never leaves half a row empty next to a photo.
  return (
    <Reveal as="li" className="news__entry news__entry--text news__entry--wide">
      <Meta m={m} />
      <h4 className="news__entry-title">{m.title}</h4>
      {m.summary && <p className="news__summary">{m.summary}</p>}
      {m.url && <TextLink href={m.url} label="Read" context={m.title} />}
      {m.instagram && (
        <>
          <PostEmbed url={m.instagram} />
          <TextLink href={m.instagram} label="Open on Instagram" context={m.title} />
        </>
      )}
    </Reveal>
  );
}

function News() {
  useDocumentHead({
    title: 'News · Gabriel Moreno Ribeiro',
    description: 'Press, programs and posts about HIBEEX, Projeto Candela and Gabriel Moreno Ribeiro, newest first.',
    canonical: 'https://gabrielmr.com/news',
  });

  const featured = mentions.find((m) => m.featured);
  const timeline = mentions.filter((m) => m !== featured);
  const years = [...new Set(timeline.map((m) => m.year))];
  const firstPhoto = timeline.find((m) => mediaFor(m));
  const needsEmbed = timeline.some((m) => m.instagram && !mediaFor(m));

  // Only a post without a saved photo falls back to the Instagram embed; warm that connection early.
  useEffect(() => {
    if (!needsEmbed) return;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = 'https://www.instagram.com';
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, [needsEmbed]);

  return (
    <main className="news" id="main-content">
      <div className="page-nav"><Navbar /></div>

      <Reveal className="news__header">
        <p className="news__back">
          <Link to="/" className="page-back"><FiArrowLeft aria-hidden="true" /> Home</Link>
        </p>
        <h1 className="news__title">In the news.</h1>
        <p className="news__lede">
          Press, programs and posts about HIBEEX, Projeto Candela and Gabriel, newest first.
        </p>
      </Reveal>

      {mentions.length === 0 ? (
        <p className="news__empty">Nothing here yet.</p>
      ) : (
        <>
          {featured && (
            <Reveal as="article" className="news__featured" delay={0.06}>
              <div className="news__featured-text">
                <p className="news__meta">
                  <span className="news__outlet">{featured.outlet}</span>
                  <span className="news__date">{featured.year}</span>
                </p>
                <h2 className="news__featured-title">{featured.title}</h2>
                {featured.summary && <p className="news__summary">{featured.summary}</p>}
                {featured.url && <TextLink href={featured.url} label="Read more" context={featured.title} />}
              </div>
              <div className="news__photo news__featured-photo">
                <img
                  src={FEATURED_PHOTO.src}
                  width={FEATURED_PHOTO.w}
                  height={FEATURED_PHOTO.h}
                  alt={FEATURED_PHOTO.alt}
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
            </Reveal>
          )}

          {timeline.length > 0 && (
            <section className="news__section" aria-label="Timeline">
              <ol className="news__timeline">
                {years.map((year) => {
                  const entries = timeline.filter((m) => m.year === year);
                  const photos = entries.filter((m) => mediaFor(m)).length;
                  return (
                    <li key={year} className="news__year">
                      <h3 className="news__year-label">{year}</h3>
                      <ol className="news__entries">
                        {entries.map((m) => (
                          <Entry key={m.title} m={m} eager={m === firstPhoto} solo={photos === 1} />
                        ))}
                      </ol>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </>
      )}

      <Footer />
    </main>
  );
}

export default News;
