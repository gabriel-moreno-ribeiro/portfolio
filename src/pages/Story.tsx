import { motion } from 'motion/react';
import { useMemo } from 'react';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Shared/Footer';
import {
  ChatFigure,
  EndFigure,
  LaptopsFigure,
  LedgerFigure,
  MISSAO_VELHA_PHOTOS,
  PhotoStrip,
  PorcaFigure,
  ReposFigure,
  SALVADOR_PHOTOS,
  ScaleFigure,
  TownFigure,
} from '../components/Story/figures';
import { EASE, Reveal } from '../components/Story/shared';
import { TruckFigure } from '../components/Story/TruckFigure';
import { blocks, FigureId, story } from '../content/story';
import { useDocumentHead } from '../hooks/useDocumentHead';
import '../styles/components/pages/story.scss';

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Only *italic* is supported inside the essay text.
const inline = (s: string) => escapeHtml(s).replace(/\*(.+?)\*/g, '<em>$1</em>');

function Figure({ id }: { id: FigureId }) {
  switch (id) {
    case 'town': return <TownFigure />;
    case 'porca': return <PorcaFigure />;
    case 'ledger': return <LedgerFigure />;
    case 'truck': return <TruckFigure />;
    case 'missao-velha': return <PhotoStrip photos={MISSAO_VELHA_PHOTOS} eyebrow="Missão Velha · every summer" />;
    case 'laptops': return <LaptopsFigure />;
    case 'salvador': return <PhotoStrip photos={SALVADOR_PHOTOS} eyebrow="Salvador · the years in between" />;
    case 'chat': return <ChatFigure />;
    case 'repos': return <ReposFigure />;
    case 'scale': return <ScaleFigure />;
    case 'end': return <EndFigure />;
  }
}

function Story() {
  useDocumentHead({
    title: `${story.title.replace(/\.$/, '')} — Gabriel Moreno Ribeiro`,
    description: story.subtitle,
    canonical: 'https://gabrielmr.com/story',
  });

  const words = useMemo(
    () => blocks.reduce((n, b) => (b.type === 'figure' ? n : n + b.text.split(/\s+/).filter(Boolean).length), 0),
    [],
  );
  const minutes = Math.max(1, Math.round(words / 220));

  let paragraphs = 0;

  return (
    <div className="story">
      <div className="page-nav"><Navbar /></div>

      <motion.header
        className="story__header"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE, delay: 0.08 }}
      >
        <p className="story__eyebrow"><Link to="/" className="page-back"><FiArrowLeft aria-hidden="true" /> Home</Link></p>
        <h1 className="story__title">{story.title}</h1>
        <div className="story__meta">
          <span>{minutes} min read</span>
          <i />
          <span>{words.toLocaleString('en-US')} words</span>
          {story.pdf && (
            <a className="story__pdf" href={story.pdf} target="_blank" rel="noreferrer">
              <FiDownload aria-hidden="true" /> PDF
            </a>
          )}
        </div>
      </motion.header>

      <article className="story__body">
        {blocks.map((b, i) => {
          if (b.type === 'figure') return <Figure id={b.id} key={`fig-${b.id}`} />;
          if (b.type === 'quote') {
            return (
              <Reveal as="div" className="story__quote" key={`q-${i}`}>
                <blockquote><p dangerouslySetInnerHTML={{ __html: inline(b.text) }} /></blockquote>
              </Reveal>
            );
          }
          paragraphs += 1;
          const first = paragraphs === 1;
          return first ? (
            <motion.p
              className="story__p story__p--first"
              key={`p-${i}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.25 }}
              dangerouslySetInnerHTML={{ __html: inline(b.text) }}
            />
          ) : (
            <Reveal as="div" className="story__p" key={`p-${i}`}>
              <p dangerouslySetInnerHTML={{ __html: inline(b.text) }} />
            </Reveal>
          );
        })}
      </article>

      <Footer />
    </div>
  );
}

export default Story;
