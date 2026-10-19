// /one-pager: Gabriel first, Hibeex second, for the Behring Founders phase 3
// and any intro. A page of this site like /story and /files: the same header
// column, the name in serif italic, one hairline, DM Sans, and the ask as an
// ink card drawn the way the site draws its cards. The only thing that says
// Hibeex is the bee. The same markup prints to one A4 sheet;
// scripts/one-pager-pdf.mjs makes the PDF behind the download button.
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { FiArrowLeft, FiDownload, FiMapPin } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import HibeexMark from '../components/OnePager/HibeexMark';
import Footer from '../components/Shared/Footer';
import {
  ask, base, build, footer, head, mrr, now, origin, PDF, pipeline, results, singles, team, validators, year,
} from '../content/onePager';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { usePageVisible, useReducedMotion, useVisible } from '../lib/motion';
import '../styles/components/pages/onePager.scss';

const EASE = [0.22, 1, 0.36, 1] as const;

// Links that leave the page say so, like the site's social icons do.
const NEW_TAB = <span className="sr-only"> (abre em nova aba)</span>;

const Out = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">{children}{NEW_TAB}</a>
);

// "São Paulo, 14:32": a pin and the time where Gabriel is. The time ticks only
// while the tab is visible; without JS (and on paper) it is just the city.
const clock = () =>
  new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date());

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
      {time && <span className="op__time">{time}<span className="sr-only"> agora em {head.city}</span></span>}
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
    title: 'One-pager · Gabriel Moreno Ribeiro e a Hibeex',
    description: head.intro,
    canonical: 'https://gabrielmr.com/one-pager',
  });

  const reduced = useReducedMotion();
  const tractionRef = useRef<HTMLElement>(null);
  const grow = useVisible(tractionRef, { once: true, rootMargin: '0px 0px -15% 0px' });

  // The site is English; this page is Portuguese, down to the document itself.
  useEffect(() => {
    const prev = document.documentElement.lang;
    document.documentElement.lang = 'pt-BR';
    return () => { document.documentElement.lang = prev; };
  }, []);

  return (
    <main className="op" id="main-content">
      <div className="page-nav"><Navbar /></div>

      <article className="op__page" lang="pt-BR">
        <div className="op__top">
          <Link to="/" className="page-back"><FiArrowLeft aria-hidden="true" /> Home</Link>
          <a className="btn op__download" href={PDF} download="gabriel-moreno-ribeiro-hibeex.pdf">
            <p className="text">Baixar PDF (A4)</p>
            <div className="icon"><FiDownload className="icon-link" aria-hidden="true" /></div>
          </a>
        </div>

        <motion.header
          className="op__head"
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.08 }}
        >
          <div className="op__name">
            <HibeexMark className="op__bee" label="Hibeex" />
            <h1 className="op__title">{head.name}</h1>
          </div>
          <p className="op__line">
            {head.facts.map((f) => <span key={f}>{f}<i /></span>)}
            <Here />
          </p>
          <p className="op__deck">{head.intro}</p>
          <p className="op__meta op__meta--links">
            {head.contact.map((c, i) => (
              <span key={c.href}>
                {i > 0 && <i />}
                {c.href.startsWith('mailto') ? <a href={c.href}>{c.label}</a> : <Out href={c.href}>{c.label}</Out>}
              </span>
            ))}
          </p>
          <p className="op__meta">
            {head.program.map((p, i) => <span key={p}>{i > 0 && <i />}{p}</span>)}
          </p>
        </motion.header>

        <div className="op__body">
          <section className="op__s op__s--origin">
            <h2>De onde eu venho</h2>
            {origin.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
          </section>

          <section className="op__s op__s--now">
            <h2>O que eu faço <em>agora</em></h2>
            {now.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
          </section>

          <section className={`op__s op__s--traction${grow && !reduced ? ' is-growing' : ''}`} ref={tractionRef}>
            <h2>Tração</h2>

            <dl className="op__pair">
              {base.map((b) => (
                <div key={b.label}><dt>{b.figure}</dt><dd>{b.label}</dd></div>
              ))}
            </dl>

            <h3>MRR</h3>
            <ul className="op__bars">
              {[mrr.today, mrr.signed].map((m, i) => (
                <li key={m.label}>
                  <span className="op__bars-label">{m.label}</span>
                  <Bar ratio={m.value / mrr.signed.value} tone={i === 0 ? 'ink' : 'accent'} />
                  <span className="op__bars-value">R$ {m.value} mil</span>
                  <span className="op__bars-note">{m.note}</span>
                </li>
              ))}
            </ul>

            <h3>Num cliente</h3>
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
                    <span className="op__to" aria-label="para">→</span>
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
            <p className="op__pipeline">{pipeline}</p>
          </section>

          <section className="op__s op__s--team">
            <h2>Time</h2>
            <ul className="op__list">
              {team.map((t) => (
                <li key={t.name}><b><Out href={t.href}>{t.name}</Out></b>, {t.role}. {t.text}</li>
              ))}
            </ul>
          </section>

          <section className="op__s op__s--validators">
            <h2>Quem valida o que a gente diz</h2>
            <ul className="op__list">
              {validators.map((v) => (
                <li key={v.name}><b><Out href={v.href}>{v.name}</Out></b>, {v.role}. {v.text}</li>
              ))}
            </ul>
          </section>

          <section className="op__s op__s--year">
            <h2>Por onde a Hibeex passou em 2026</h2>
            <ul className="op__list">
              {year.map((y) => <li key={y.name}><b>{y.name}</b>: {y.text}</li>)}
            </ul>
          </section>

          <section className="op__s op__s--build">
            <h2>O que eu quero construir</h2>
            {build.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
          </section>

          <section className="op__ask" aria-labelledby="op-ask">
            <h2 id="op-ask">O que eu procuro em <em>dezembro</em></h2>
            <p className="op__ask-intro">{ask.intro}</p>
            <ol className="op__ask-list">
              {ask.people.map((p) => <li key={p.who}><b>{p.who}</b> {p.examples}</li>)}
            </ol>
            <p className="op__close">{ask.close}</p>
            <a className="op__mail" href="mailto:me@gabrielmr.com">me@gabrielmr.com</a>
          </section>
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
