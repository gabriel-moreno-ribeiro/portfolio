import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import HoverSwapText from '../Shared/HoverSwapText';

const timelineEvents = [
  {
    year: '2019',
    title: 'Colegio Militar de Salvador',
    desc: 'Admitted at age 10 — one of 30 selected from 2,500+ applicants. Perfect score in mathematics.',
    hover: 'The math test was actually fun',
  },
  {
    year: '2021',
    title: 'First Gold Medals',
    desc: 'Won gold at OBA (Astronomy), ONEE, and OIMSF International. The olympiad journey begins.',
    hover: 'Collecting medals like Pokemon cards',
  },
  {
    year: '2022',
    title: 'National Recognition',
    desc: 'Silver at OBFEP (Physics National), Gold at OBQJr (Chemistry). Started competing across all sciences.',
    hover: 'Chemistry was supposed to be a side quest',
  },
  {
    year: '2023',
    title: 'PIBIC Jr & Instituto Principia',
    desc: 'Created low-cost physics kits for 4 public schools (1,900+ students). Selected for Escola de Talentos (14 of thousands).',
    hover: 'Building labs from scratch hits different',
  },
  {
    year: '2024',
    title: 'Olympic Club President & IFT-UNESP #1',
    desc: 'Led the Olympic Club. Ranked 1st of 10,000+ at IFT-UNESP (Theoretical Physics). Bronze OBQ, Silver OBMEP, Gold ONNEQ.',
    hover: 'Slept 4 hours a day that semester',
  },
  {
    year: '2025',
    title: 'Fundacao Estudar & SAT 1510',
    desc: 'Selected for PREP (0.7% acceptance). SAT 1510/1600 (top 1% Brazil). Co-founded GSAT Education. Admitted to St Andrews with Global Merit Scholarship.',
    hover: 'The college app grind was real',
  },
  {
    year: '2026',
    title: 'HIBEEX — Building the Future',
    desc: 'Co-founded HIBEEX: financial AI turning accountants into advisors for every SMB. Full-stack builder. Ship fast, measure impact, iterate relentlessly.',
    hover: 'Current status: shipping at 3am',
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
        <HoverSwapText original={event.year} hovered={event.hover} />
      </div>
      <div className="timeline-content">
        <h3>{event.title}</h3>
        <p>{event.desc}</p>
      </div>
    </motion.div>
  );
}

function Timeline() {
  return (
    <div className="timeline-section" id="timeline">
      <h1 className="heading" data-color-inverted="true">
        <HoverSwapText original="My Journey" hovered="The Lore" />
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
