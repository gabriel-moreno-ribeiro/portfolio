import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

const timelineEvents = [
  {
    year: '2019',
    title: 'Colegio Militar de Salvador',
    desc: 'Admitted at age 10 — one of 30 selected from 2,500+ applicants. Perfect score in mathematics.',
    funYear: 'chapter 1',
    funTitle: 'uniform era',
  },
  {
    year: '2021',
    title: 'First Gold Medals',
    desc: 'Won gold at OBA (Astronomy), ONEE, and OIMSF International. The olympiad journey begins.',
    funYear: 'plot twist',
    funTitle: 'tests are fun?',
  },
  {
    year: '2022',
    title: 'National Recognition',
    desc: 'Silver at OBFEP (Physics National), Gold at OBQJr (Chemistry). Started competing across all sciences.',
    funYear: 'side quest',
    funTitle: 'chem arc',
  },
  {
    year: '2023',
    title: 'PIBIC Jr & Instituto Principia',
    desc: 'Created low-cost physics kits for 4 public schools (1,900+ students). Selected for Escola de Talentos (14 of thousands).',
    funYear: 'giving back',
    funTitle: 'DIY labs',
  },
  {
    year: '2024',
    title: 'Olympic Club President & IFT #1',
    desc: 'Led the Olympic Club. Ranked 1st of 10,000+ at IFT-UNESP. Bronze OBQ, Silver OBMEP, Gold ONNEQ.',
    funYear: 'no sleep',
    funTitle: 'multitasking 101',
  },
  {
    year: '2025',
    title: 'Estudar Scholar & SAT 1510',
    desc: 'Selected for PREP (0.7% acceptance). SAT 1510/1600. Co-founded GSAT Education. Admitted to St Andrews.',
    funYear: 'essay szn',
    funTitle: 'app grind',
  },
  {
    year: '2026',
    title: 'HIBEEX — Building the Future',
    desc: 'Co-founded HIBEEX: financial AI for SMBs. Full-stack builder. Ship fast, measure impact, iterate relentlessly.',
    funYear: 'loading...',
    funTitle: 'no sleep mode',
  },
];

function TimelineItem({ event, index }: { event: typeof timelineEvents[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px -100px 0px' });

  return (
    <motion.div
      ref={ref}
      className="timeline-item"
      initial={{ opacity: 0, x: index % 2 === 0 ? -60 : 60 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <div className="timeline-year">
        <span data-fun={event.funYear}>{event.year}</span>
      </div>
      <div className="timeline-content">
        <h3 data-fun={event.funTitle}>{event.title}</h3>
        <p data-fun="the fine print">{event.desc}</p>
      </div>
    </motion.div>
  );
}

function Timeline() {
  return (
    <div className="timeline-section" id="timeline">
      <h1 className="heading" data-color-inverted="true">
        <span data-fun="the origin story">My Journey</span>
      </h1>
      <div className="timeline-container">
        <div className="timeline-line" />
        {timelineEvents.map((event, i) => (
          <TimelineItem key={i} event={event} index={i} />
        ))}
      </div>
    </div>
  );
}

export default Timeline;
