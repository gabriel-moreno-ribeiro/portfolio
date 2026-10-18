// /one-pager: Gabriel and Hibeex on one sheet, for the Behring Founders phase 3
// and any intro. The sheet is laid out like an accounting ledger: small section
// labels, hairline rules, numbers in a mono face. The same markup prints to A4;
// scripts/one-pager-pdf.mjs turns it into the PDF behind the download button.
import { motion } from 'motion/react';
import { useRef } from 'react';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Shared/Footer';
import {
  ask, askClose, build, footer, head, market, Metric, now, origin, PDF, pipeline, problem, product,
  SOURCES, team, traction, validators, whyNow, year,
} from '../content/onePager';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { Counter, useReducedMotion, useVisible } from '../lib/motion';
import '../styles/components/pages/onePager.scss';

const EASE = [0.22, 1, 0.36, 1] as const;

// The Hibeex mark: an orange hexagon with an indigo one inside.
const Mark = () => (
  <svg className="op__mark" viewBox="0 0 40 40" aria-hidden="true">
    <path d="M20 2 36 11v18L20 38 4 29V11z" fill="#ff8a00" />
    <path d="M20 11.5 27.5 16v8L20 28.5 12.5 24v-8z" fill="#241c7d" />
  </svg>
);

const Arrow = () => (
  <svg className="op__arrow" viewBox="0 0 16 10" aria-label="para">
    <path d="M1 5h13M10 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Source = ({ id }: { id: keyof typeof SOURCES }) => (
  <small className="op__source">
    <a href={SOURCES[id].href} target="_blank" rel="noopener noreferrer">{SOURCES[id].label}</a>
  </small>
);

// One ledger line. The final number is the default; it only runs up (from 0)
// once the ledger is on screen.
const print = (m: Metric) => `${m.prefix ?? ''}${(m.count ?? 0).toLocaleString('pt-BR')}${m.suffix ?? ''}`;

function Figure({ m, run }: { m: Metric; run: boolean }) {
  return (
    <div className="op__figure">
      <dt>
        {m.before && <><span className="op__before">{m.before}</span><Arrow /></>}
        {run ? <Counter value={m.count ?? 0} prefix={m.prefix} suffix={m.suffix} locale="pt-BR" duration={1400} /> : print(m)}
      </dt>
      <dd>{m.label}</dd>
    </div>
  );
}

function OnePager() {
  useDocumentHead({
    title: 'One-pager · Gabriel Moreno Ribeiro e a Hibeex',
    description: head.oneLiner,
    canonical: 'https://gabrielmr.com/one-pager',
  });

  const reduced = useReducedMotion();
  const ledgerRef = useRef<HTMLDListElement>(null);
  const ledgerSeen = useVisible(ledgerRef, { once: true, rootMargin: '0px 0px -10% 0px' });

  return (
    <main className="op" id="main-content" lang="pt-BR">
      <div className="page-nav"><Navbar /></div>

      <div className="op__bar">
        <Link to="/" className="page-back"><FiArrowLeft aria-hidden="true" /> Home</Link>
        <a className="op__download" href={PDF} download="gabriel-moreno-ribeiro-hibeex.pdf">
          <FiDownload aria-hidden="true" /> Baixar PDF (A4)
        </a>
      </div>

      <motion.article
        className="op__sheet"
        initial={reduced ? false : { opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.08 }}
      >
        <header className="op__head">
          <div className="op__brand"><Mark /><span>Hibeex</span></div>
          <h1>{head.name}</h1>
          <p className="op__line">{head.line}</p>
          <p className="op__oneliner">{head.oneLiner}</p>
          <p className="op__contact">
            {head.contact.map((c) => <a key={c.href} href={c.href} target={c.href.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer">{c.label}</a>)}
            <span>{head.program}</span>
          </p>
        </header>

        <section className="op__s op__s--origin">
          <h2>De onde eu venho</h2>
          {origin.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}
        </section>

        <section className="op__s op__s--problem">
          <h2>O problema</h2>
          <p>{problem}</p>
        </section>

        <section className="op__s op__s--product">
          <h2>O que a Hibeex faz</h2>
          <p>{product}</p>
        </section>

        <section className="op__s op__s--now">
          <h2>Onde a gente está agora</h2>
          <p>{now.validated}</p>
          <p>{now.learned}</p>
          <p className="op__aside">{now.contrary} <Source id="contrary" /></p>
          <p>
            {now.outside} <q>{now.quote}</q> <Source id="gc" /> {now.market} <Source id="census" /> {now.thrive} <Source id="forbes" />
          </p>
        </section>

        <section className="op__s op__s--traction">
          <h2>Tração</h2>
          <dl className="op__ledger" ref={ledgerRef}>
            {traction.map((m) => <Figure key={m.label} m={m} run={ledgerSeen} />)}
          </dl>
          <p className="op__pipeline">{pipeline}</p>
        </section>

        <section className="op__s op__s--why">
          <h2>Por que agora</h2>
          <ul className="op__list">
            {whyNow.map((w) => <li key={w.lead}><b>{w.lead}</b> {w.text}</li>)}
          </ul>
        </section>

        <section className="op__s op__s--market">
          <h2>Como a gente lê o mercado</h2>
          <p>{market.consolidation} <Source id="contaAzul" /></p>
          <p>{market.thesis}</p>
        </section>

        <section className="op__s op__s--team">
          <h2>Time</h2>
          <ul className="op__people">
            {team.map((t) => <li key={t.name}><b>{t.name}</b>, {t.role}. {t.text}</li>)}
          </ul>
        </section>

        <section className="op__s op__s--validators">
          <h2>Quem valida o que a gente diz</h2>
          <ul className="op__people">
            {validators.map((v) => <li key={v.name}><b>{v.name}</b>, {v.role}. {v.text}</li>)}
          </ul>
        </section>

        <section className="op__s op__s--year">
          <h2>Por onde a Hibeex passou em 2026</h2>
          <ul className="op__people">
            {year.map((y) => <li key={y.name}><b>{y.name}</b>. {y.text}</li>)}
          </ul>
        </section>

        <section className="op__s op__s--build">
          <h2>O que eu quero construir</h2>
          <ol className="op__phases">
            {build.phases.map((f) => <li key={f.n}><span>{f.n}</span> {f.text}</li>)}
          </ol>
          <p>{build.text}</p>
        </section>

        <section className="op__s op__s--ask">
          <h2>O que eu procuro em dezembro</h2>
          <ul className="op__list">
            {ask.map((a) => <li key={a.lead}><b>{a.lead}</b> {a.text}</li>)}
          </ul>
          <p className="op__close">{askClose}</p>
        </section>

        <footer className="op__foot">
          <Mark />
          <span>{footer}</span>
        </footer>
      </motion.article>

      <Footer />
    </main>
  );
}

export default OnePager;
