import { motion } from 'motion/react';
import { FiArrowUpRight, FiInstagram, FiRadio } from 'react-icons/fi';
import Navbar from '../components/Navbar/Navbar';
import InstagramEmbed from '../components/News/InstagramEmbed';
import Footer from '../components/Shared/Footer';
import { instagram, press } from '../data/news';
import { useDocumentHead } from '../hooks/useDocumentHead';
import '../styles/components/pages/news.scss';

const EASE = [0.22, 1, 0.36, 1] as const;
const rise = (i: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE, delay: 0.08 + i * 0.06 },
});

function News() {
  useDocumentHead({
    title: 'News — Gabriel Moreno Ribeiro',
    description: 'Press, media mentions and posts about Gabriel Moreno Ribeiro, HIBEEX and Projeto Candela.',
    canonical: 'https://gabrielmr.com/news',
  });

  return (
    <div className="news">
      <div className="page-nav"><Navbar /></div>

      <header className="news__header">
        <motion.p className="news__eyebrow" {...rise(0)}>News</motion.p>
        <motion.h1 className="news__title" {...rise(1)}>In the news.</motion.h1>
        <motion.p className="news__lede" {...rise(2)}>
          Press, mentions and posts about what I&apos;m building.
        </motion.p>
      </header>

      <section className="news__section" aria-labelledby="news-press">
        <h2 id="news-press" className="news__section-title">
          <FiRadio aria-hidden="true" /> Press &amp; mentions
        </h2>
        {press.length === 0 ? (
          <p className="news__empty">Nothing here yet.</p>
        ) : (
          <div className="news__cards">
            {press.map((item, i) => (
              <motion.a
                key={item.url + item.title}
                className="news__card"
                href={item.url}
                target="_blank"
                rel="noreferrer"
                {...rise(3 + i)}
              >
                <p className="news__card-meta">
                  <span>{item.outlet}</span>
                  <i />
                  <span>{item.date}</span>
                </p>
                <h3 className="news__card-title">{item.title}</h3>
                {item.excerpt && <p className="news__card-excerpt">{item.excerpt}</p>}
                <span className="news__card-link">
                  Read <FiArrowUpRight aria-hidden="true" />
                </span>
              </motion.a>
            ))}
          </div>
        )}
      </section>

      <section className="news__section" aria-labelledby="news-instagram">
        <h2 id="news-instagram" className="news__section-title">
          <FiInstagram aria-hidden="true" /> Instagram
        </h2>
        {instagram.length === 0 ? (
          <p className="news__empty">Posts coming soon.</p>
        ) : (
          <motion.div className="news__grid" {...rise(4)}>
            {instagram.map((item) => (
              <InstagramEmbed key={item.url} url={item.url} caption={item.caption} />
            ))}
          </motion.div>
        )}
      </section>

      <Footer />
    </div>
  );
}

export default News;
