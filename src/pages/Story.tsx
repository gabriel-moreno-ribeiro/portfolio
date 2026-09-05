import { motion } from 'motion/react';
import { useMemo } from 'react';
import { FiDownload } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Shared/Footer';
import { story } from '../content/story';
import { useDocumentHead } from '../hooks/useDocumentHead';
import '../styles/components/pages/story.scss';

const EASE = [0.22, 1, 0.36, 1] as const;

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Inline Markdown: **bold**, *italic*, [text](url)
const inline = (s: string) =>
  escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text, url) => {
      const ext = /^https?:/.test(url);
      return `<a href="${url}"${ext ? ' target="_blank" rel="noreferrer"' : ''}>${text}</a>`;
    });

// Block Markdown: the handful of constructs an essay needs
function render(md: string): string {
  return md
    .replace(/\r\n/g, '\n')
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const b = block.trim();
      if (/^---+$/.test(b)) return '<hr />';
      if (b.startsWith('### ')) return `<h3>${inline(b.slice(4))}</h3>`;
      if (b.startsWith('## ')) return `<h2>${inline(b.slice(3))}</h2>`;
      if (b.startsWith('# ')) return `<h2>${inline(b.slice(2))}</h2>`;
      if (b.startsWith('> ')) return `<blockquote><p>${inline(b.replace(/^> ?/gm, '').replace(/\n/g, ' '))}</p></blockquote>`;
      return `<p>${inline(b.replace(/\n/g, ' '))}</p>`;
    })
    .join('\n');
}

function Story() {
  useDocumentHead({
    title: `${story.title.replace(/\.$/, '')} — Gabriel Moreno Ribeiro`,
    description: story.subtitle,
    canonical: 'https://gabrielmr.com/story',
  });

  const html = useMemo(() => render(story.body), []);
  const words = useMemo(() => story.body.split(/\s+/).filter(Boolean).length, []);
  const minutes = Math.max(1, Math.round(words / 220));

  return (
    <div className="story">
      <div className="page-nav"><Navbar /></div>

      <motion.header
        className="story__header"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE, delay: 0.08 }}
      >
        <p className="story__eyebrow"><Link to="/">Home</Link><i />{story.eyebrow}</p>
        <h1 className="story__title">{story.title}</h1>
        <p className="story__subtitle">{story.subtitle}</p>
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

      <motion.article
        className="story__body"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.25 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <Footer />
    </div>
  );
}

export default Story;
