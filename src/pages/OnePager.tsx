// /one-pager: Gabriel and Hibeex on one page, for the Behring Founders phase 3
// and any intro. A page of this site like /story and /files: the same header
// column, the name in serif italic, one hairline, DM Sans, and the site's black
// container to close. The only thing that says Hibeex is the bee. The same
// markup prints to one A4 sheet; scripts/one-pager-pdf.mjs makes the PDF
// behind the download button.
import { motion } from 'motion/react';
import { FiArrowDown, FiArrowLeft, FiArrowRight, FiDownload } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import HibeexMark from '../components/OnePager/HibeexMark';
import Footer from '../components/Shared/Footer';
import {
  ask, askClose, build, footer, head, market, Metric, now, origin, PDF, pipeline, problem, product,
  SOURCES, team, traction, validators, whyNow, year,
} from '../content/onePager';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { useReducedMotion } from '../lib/motion';
import '../styles/components/pages/onePager.scss';

const EASE = [0.22, 1, 0.36, 1] as const;

const Source = ({ id }: { id: keyof typeof SOURCES }) => (
  <small className="op__source">
    <a href={SOURCES[id].href} target="_blank" rel="noopener noreferrer">{SOURCES[id].label}</a>
  </small>
);

const figure = (m: Metric) => `${m.prefix ?? ''}${(m.count ?? 0).toLocaleString('pt-BR')}${m.suffix ?? ''}`;

function OnePager() {
  useDocumentHead({
    title: 'One-pager · Gabriel Moreno Ribeiro e a Hibeex',
    description: head.oneLiner,
    canonical: 'https://gabrielmr.com/one-pager',
  });

  const reduced = useReducedMotion();

  return (
    <main className="op" id="main-content" lang="pt-BR">
      <div className="page-nav"><Navbar /></div>

      <article className="op__page">
        <motion.header
          className="op__head"
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.08 }}
        >
          <div className="op__bar">
            <Link to="/" className="page-back"><FiArrowLeft aria-hidden="true" /> Home</Link>
            {/* The reader with 60 seconds can go straight to the third answer */}
            <a className="op__jump" href="#op-ask">O que eu procuro em dezembro <FiArrowDown aria-hidden="true" /></a>
            <a className="btn primary op__download" href={PDF} download="gabriel-moreno-ribeiro-hibeex.pdf">
              <p className="text">Baixar PDF (A4)</p>
              <div className="icon"><FiDownload className="icon-link" aria-hidden="true" /></div>
            </a>
          </div>
          <HibeexMark className="op__bee" label="Hibeex" />
          <h1 className="op__title">{head.name}</h1>
          <p className="op__line">{head.line}</p>
          <p className="op__meta op__meta--links">
            {head.contact.map((c, i) => (
              <span key={c.href}>
                {i > 0 && <i />}
                <a href={c.href} target={c.href.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer">{c.label}</a>
              </span>
            ))}
          </p>
          <p className="op__meta">
            {head.program.map((p, i) => <span key={p}>{i > 0 && <i />}{p}</span>)}
          </p>
        </motion.header>

        <p className="op__deck">{head.oneLiner}</p>

        <div className="op__body">
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
            <h2>Onde a gente está <em>agora</em></h2>
            <p>{now.validated}</p>
            <p>{now.learned}</p>
            <p>{now.contrary} <Source id="contrary" /></p>
            <p>
              {now.outside} {now.quote} <Source id="gc" /> {now.market} <Source id="census" /> {now.thrive} <Source id="forbes" />
            </p>
          </section>

          <section className="op__s op__s--traction">
            <h2>Tração</h2>
            <dl className="op__ledger">
              {traction.map((m) => (
                <div className="op__figure" key={m.label}>
                  <dt>
                    {m.before && <><span className="op__before">{m.before}</span><FiArrowRight className="op__arrow" aria-label="para" /></>}
                    {figure(m)}
                  </dt>
                  <dd>{m.label}</dd>
                </div>
              ))}
            </dl>
            <p className="op__pipeline">{pipeline}</p>
          </section>

          <section className="op__s op__s--why">
            <h2>Por que <em>agora</em></h2>
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
            <ul className="op__list">
              {team.map((t) => <li key={t.name}><b>{t.name}</b>, {t.role}. {t.text}</li>)}
            </ul>
          </section>

          <section className="op__s op__s--validators">
            <h2>Quem valida o que a gente diz</h2>
            <ul className="op__list">
              {validators.map((v) => <li key={v.name}><b>{v.name}</b>, {v.role}. {v.text}</li>)}
            </ul>
          </section>

          <section className="op__s op__s--year">
            <h2>Por onde a Hibeex passou em 2026</h2>
            <ul className="op__list">
              {year.map((y) => <li key={y.name}><b>{y.name}</b>. {y.text}</li>)}
            </ul>
          </section>

          <section className="op__s op__s--build">
            <h2>O que eu quero construir</h2>
            <ol className="op__list">
              {build.phases.map((f) => <li key={f.n}><b>{f.n}</b> {f.text}</li>)}
            </ol>
            <p>{build.text}</p>
          </section>
        </div>

        <section className="op__ask" aria-labelledby="op-ask">
          <h2 id="op-ask">O que eu procuro em <em>dezembro</em></h2>
          <ul className="op__list">
            {ask.map((a) => <li key={a.lead}><b>{a.lead}</b> {a.text}</li>)}
          </ul>
          <p className="op__close">{askClose}</p>
        </section>

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
