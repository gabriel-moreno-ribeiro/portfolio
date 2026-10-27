import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { FiArrowLeft, FiArrowUpRight, FiCheck, FiLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Shared/Footer';
import GlassFolder, { type ArtPreset } from '../components/ui/glass-folder-cards';
import { fileGroups, filePath, fileUrl, type FileEntry } from '../content/files';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { useThemeStore } from '../store/themeStore';
import '../styles/components/pages/files.scss';

const EASE = [0.22, 1, 0.36, 1] as const;

// One folder per group, each with its own print on the back panel.
const FOLDER_ART: Record<string, ArtPreset> = {
  Resume: 'ember',
  Tests: 'glacier',
  'School profiles': 'verdant',
  Research: 'dusk',
};

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE, delay },
});

function FilesPage() {
  // Which row was just copied, so only that row shows the confirmation.
  const [copied, setCopied] = useState<string | null>(null);
  const { darkMode } = useThemeStore();

  useDocumentHead({
    title: 'Documents · Gabriel Moreno Ribeiro',
    description: 'Every document on the site in one place: resume, one-pager, test scores, school profiles and research.',
    canonical: 'https://gabrielmr.com/files',
    noindex: true,
  });

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = useCallback(async (item: FileEntry) => {
    try {
      await navigator.clipboard.writeText(fileUrl(item));
      setCopied(item.file);
    } catch {
      // Clipboard is blocked outside a secure context, so fall back to a prompt
      // the person can copy from by hand.
      window.prompt('Copy the link', fileUrl(item));
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
          Every document on this site in one place: resume, one-pager, test scores, school
          profiles and research. Open a folder to see what is inside; the list below has a
          link for each file.
        </p>
      </motion.header>

      {/* The folders are the quick way in; the list below stays the full,
          keyboard-plain version with a copyable link per file. */}
      <motion.div className="files__shelf" {...rise(0.14)}>
        {fileGroups.map((group, gi) => (
          <GlassFolder
            key={group.heading}
            label={group.heading}
            tone={darkMode ? 'dark' : 'light'}
            art={FOLDER_ART[group.heading] ?? 'aurora'}
            seed={gi * 7 + 3}
            action="none"
            width={260}
            appearDelay={gi * 120}
            files={group.items.map((item) => ({ name: item.title, meta: item.meta, href: filePath(item) }))}
          />
        ))}
      </motion.div>

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
                      href={filePath(item)}
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
                    onClick={() => copy(item)}
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
