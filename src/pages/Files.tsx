import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { FiArrowLeft, FiArrowUpRight, FiCheck, FiLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Shared/Footer';
import { fileGroups, fileUrl } from '../content/files';
import { useDocumentHead } from '../hooks/useDocumentHead';
import '../styles/components/pages/files.scss';

const EASE = [0.22, 1, 0.36, 1] as const;

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE, delay },
});

function FilesPage() {
  // Which row was just copied, so only that row shows the confirmation.
  const [copied, setCopied] = useState<string | null>(null);

  useDocumentHead({
    title: 'Documents · Gabriel Moreno Ribeiro',
    description: 'Score reports and school profiles, as direct links.',
    canonical: 'https://gabrielmr.com/files',
    noindex: true,
  });

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = useCallback(async (file: string) => {
    try {
      await navigator.clipboard.writeText(fileUrl(file));
      setCopied(file);
    } catch {
      // Clipboard is blocked outside a secure context, so fall back to a prompt
      // the person can copy from by hand.
      window.prompt('Copy the link', fileUrl(file));
    }
  }, []);

  return (
    <main className="files" id="main-content">
      <div className="page-nav"><Navbar /></div>

      <motion.header className="files__header" {...rise(0.08)}>
        <p className="files__eyebrow">
          <Link to="/" className="page-back"><FiArrowLeft aria-hidden="true" /> Home</Link>
          <i />
          <span>Documents</span>
        </p>
        <h1 className="files__title">Documents</h1>
        <p className="files__summary">
          Score reports and school profiles, kept here so they have a link that does not
          expire. Every file opens straight in the browser.
        </p>
      </motion.header>

      <div className="files__body">
        {fileGroups.map((group, gi) => (
          <motion.section key={group.heading} className="files__group" {...rise(0.16 + gi * 0.06)}>
            <h2>{group.heading}</h2>
            <ul>
              {group.items.map((item) => (
                <li key={item.file}>
                  <div className="files__info">
                    <a
                      className="files__name"
                      href={`/files/${item.file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.title} <FiArrowUpRight aria-hidden="true" />
                    </a>
                    <p>{item.note}</p>
                    <span className="files__meta">PDF<i />{item.meta}</span>
                  </div>
                  <button
                    type="button"
                    className={`files__copy ${copied === item.file ? 'is-copied' : ''}`}
                    onClick={() => copy(item.file)}
                  >
                    {copied === item.file ? <FiCheck aria-hidden="true" /> : <FiLink aria-hidden="true" />}
                    {copied === item.file ? 'Copied' : 'Copy link'}
                  </button>
                </li>
              ))}
            </ul>
          </motion.section>
        ))}
      </div>

      <p className="files__status" role="status" aria-live="polite">
        {copied ? 'Link copied to the clipboard' : ''}
      </p>

      <Footer />
    </main>
  );
}

export default FilesPage;
