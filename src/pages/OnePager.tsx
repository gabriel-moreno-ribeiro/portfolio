// /one-pager: Gabriel first, Hibeex second, for the Behring Founders phase 3
// and any intro. A page of this site like /story and /files: the name in serif
// italic, one hairline, DM Sans, and the ask as an ink card drawn the way the
// site draws its cards. The only thing that says Hibeex is the bee. Below the
// rule, two columns: the left one is Gabriel and the people around Hibeex,
// the right one is the business and the ask. The same
// markup prints to one A4 sheet; scripts/one-pager-pdf.mjs makes the PDF
// behind the download button.
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { FiArrowLeft, FiDownload, FiMapPin } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import HibeexMark from '../components/OnePager/HibeexMark';
import Footer from '../components/Shared/Footer';
import {
  ask, base, build, footer, head, mrr, now, origin, PDF, results, singles, team, validators, year,
} from '../content/onePager';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { usePageVisible, useReducedMotion, useVisible } from '../lib/motion';
import '../styles/components/pages/onePager.scss';

const EASE = [0.22, 1, 0.36, 1] as const;

// Links that leave the page say so, like the site's social icons do.
const NEW_TAB = <span className="sr-only"> (opens in a new tab)</span>;

const Out = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">{children}{NEW_TAB}</a>
);

// mailto does nothing on a computer with no mail app set up (most people who
// use Gmail in the browser), so the address is also copied, and says so.
function Mail({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(id);
  }, [copied]);

  return (
    <a
      className={className}
      href="mailto:me@gabrielmr.com"
      onClick={() => {
        navigator.clipboard?.writeText('me@gabrielmr.com').then(() => setCopied(true), () => {});
      }}
    >
      me@gabrielmr.com
      <span className={`op__copied${copied ? ' is-on' : ''}`} aria-live="polite">{copied ? 'copied' : ''}</span>
    </a>
  );
}

// "São Paulo · 14:32": a pin and the time where Gabriel is. The time ticks only
// while the tab is visible; without JS (and on paper) it is just the city.
const clock = () =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date());

function Here() {
  const visible = usePageVisible();
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setTime(clock());
    const id = window.setInterval(() => setTime(clock()), 20_000);
    return () => window.clearInterval(id);
  }, [visible]);

  return (
    <span className="op__here">
      <span className="op__pin" aria-hidden="true"><FiMapPin /></span>
      {head.city}
      {time && <span className="op__time">{time}<span className="sr-only"> now in {head.city}</span></span>}
    </span>
  );
}

// A bar drawn to scale. It grows in once when the block comes into view; the
// final length is the default, so print, reduced motion and no-JS match.
const Bar = ({ ratio, tone }: { ratio: number; tone: 'ink' | 'accent' | 'muted' }) => (
  <span className={`op__bar-track`} aria-hidden="true">
    <span className={`op__bar-fill is-${tone}`} style={{ '--r': ratio } as React.CSSProperties} />
  </span>
);

function OnePager() {
  useDocumentHead({
    title: 'One-pager · Gabriel Moreno Ribeiro and Hibeex',
    description: head.intro,
    canonical: 'https://gabrielmr.com/one-pager',
  });

  const reduced = useReducedMotion();
  const tractionRef = useRef<HTMLElement>(null);
  const grow = useVisible(tractionRef, { once: true, rootMargin: '0px 0px -15% 0px' });

  return (
    <main className="op" id="main-content">
      <div className="page-nav"><Navbar /></div>

      <article className="op__page">
        <div className="op__top">
          <Link to="/" className="page-back"><FiArrowLeft aria-hidden="true" /> Home</Link>
          <a className="btn op__download" href={PDF} download="gabriel-moreno-ribeiro-hibeex.pdf">
            <p className="text">Download PDF (A4)</p>
            <div className="icon"><FiDownload className="icon-link" aria-hidden="true" /></div>
          </a>
        </div>

        <motion.header
          className="op__head"
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.08 }}
        >
          <div className="op__head-main">
            <div className="op__name">
              <HibeexMark className="op__bee" label="Hibeex" />
              <h1 className="op__title">{head.name}</h1>
            </div>
            <p className="op__line">
              {head.facts.map((f) => <span key={f}>{f}<i /></span>)}
              <Here />
            </p>
            <p className="op__deck">{head.intro}</p>
          </div>

          {/* Contact and the program, as the corner of a letterhead. */}
          <div className="op__head-side">
            <ul className="op__contact">
              {head.contact.map((c) => (
                <li key={c.href}>
                  {c.href.startsWith('mailto') ? <Mail /> : <Out href={c.href}>{c.label}</Out>}
                </li>
              ))}
            </ul>
            <ul className="op__program">
              {head.program.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
        </motion.header>

        <div className="op__body">
          <div className="op__col">
            <section className="op__s op__s--origin">
              <h2>Where I come from</h2>
              {origin.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
            </section>

            <section className="op__s op__s--team">
              <h2>Team</h2>
              <ul className="op__list">
                {team.map((t) => (
                  <li key={t.name}><b><Out href={t.href}>{t.name}</Out></b>, {t.role}. {t.text}</li>
                ))}
              </ul>
            </section>

            <section className="op__s op__s--validators">
              <h2>Who vouches for what we say</h2>
              <ul className="op__list">
                {validators.map((v) => (
                  <li key={v.name}><b><Out href={v.href}>{v.name}</Out></b>, {v.role}. {v.text}</li>
                ))}
              </ul>
            </section>

            <section className="op__s op__s--year">
              <h2>Where Hibeex went in 2026</h2>
              <ul className="op__list">
                {year.map((y) => <li key={y.name}><b>{y.name}</b>: {y.text}</li>)}
              </ul>
            </section>

            <section className="op__s op__s--build">
              <h2>What I want to build</h2>
              {build.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
            </section>
          </div>

          <div className="op__col">
            <section className="op__s op__s--now">
              <h2>What I do <em>now</em></h2>
              {now.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
            </section>

            <section className={`op__s op__s--traction${grow && !reduced ? ' is-growing' : ''}`} ref={tractionRef}>
              <h2>Traction</h2>

              <dl className="op__pair">
                {base.map((b) => (
                  <div key={b.label}><dt>{b.figure}</dt><dd>{b.label}</dd></div>
                ))}
              </dl>

              <h3>MRR (R$)</h3>
              <ul className="op__bars">
                {[mrr.today, mrr.signed].map((m, i) => (
                  <li key={m.label}>
                    <span className="op__bars-label">{m.label}</span>
                    <Bar ratio={m.value / mrr.signed.value} tone={i === 0 ? 'ink' : 'accent'} />
                    <span className="op__bars-value">R$ {m.value}k</span>
                    <span className="op__bars-note">{m.note}</span>
                  </li>
                ))}
              </ul>

              <h3>At one client</h3>
              <ul className="op__bars op__bars--before-after">
                {results.map((r) => (
                  <li key={r.label}>
                    <span className="op__bars-label">{r.label}</span>
                    <span className="op__bars-pair">
                      <Bar ratio={1} tone="muted" />
                      <Bar ratio={r.after / r.before} tone="accent" />
                    </span>
                    <span className="op__bars-value">
                      <span className="op__before">{r.format(r.before)}</span>
                      <span className="op__to" aria-label="to">→</span>
                      {r.format(r.after)}
                    </span>
                    {r.note && <span className="op__bars-note">{r.note}</span>}
                  </li>
                ))}
              </ul>
              <dl className="op__pair">
                {singles.map((b) => (
                  <div key={b.label}><dt>{b.figure}</dt><dd>{b.label}</dd></div>
                ))}
              </dl>
            </section>

            <section className="op__ask" aria-labelledby="op-ask">
              <h2 id="op-ask">What I&rsquo;m looking for in <em>December</em></h2>
              <p className="op__ask-intro">{ask.intro}</p>
              <ol className="op__ask-list">
                {ask.people.map((p) => <li key={p.who}><b>{p.who}</b> {p.examples}</li>)}
              </ol>
              <Mail className="op__mail" />
            </section>
          </div>
        </div>

        <footer className="op__foot">
          <HibeexMark className="op__bee" />
          <span>{footer}</span>
        </footer>
      </article>

      <Footer />
    </main>
  );
}

export default OnePager;
