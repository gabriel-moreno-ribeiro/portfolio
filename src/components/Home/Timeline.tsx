import { motion, useInView } from 'motion/react';
import { useRef, useState } from 'react';

interface TimelineMedia {
  src: string;
  caption: string;
  type?: 'image' | 'video';
}

interface TimelineEvent {
  year: string;
  title: string;
  desc: string;
  media?: TimelineMedia[];
}

const timelineEvents: TimelineEvent[] = [
  {
    year: '2026',
    title: 'The Build Year — HIBEEX',
    desc: 'Chose a build year over freshman year. Co-founded HIBEEX: financial AI for SMBs. One of 6 startups in the Canastra Ventures AI Residency.',
    media: [
      { src: '/timeline/hibeex.jpg', caption: 'Building HIBEEX' },
      { src: '/timeline/hibeex.mp4', caption: 'HIBEEX demo', type: 'video' },
    ],
  },
  {
    year: '2025',
    title: 'Estudar Scholar & SAT 1510',
    desc: 'Selected for PREP (0.7% acceptance). SAT 1510/1600. Co-founded GSAT Education. Admitted to St Andrews with a Global Merit Scholarship.',
  },
  {
    year: '2024',
    title: 'Olympic Club President & IFT #1',
    desc: 'Led the Olympic Club. Ranked 1st of 10,000+ at IFT-UNESP. Bronze OBQ, Silver OBMEP, Gold ONNEQ.',
    media: [
      { src: '/timeline/olympic-club-01.jpg', caption: 'Olympic Club activities' },
      { src: '/timeline/olympic-club-02.jpg', caption: 'Team events' },
      { src: '/timeline/olympic-club.mp4', caption: 'Club highlights', type: 'video' },
    ],
  },
  {
    year: '2023',
    title: 'PIBIC Jr & Instituto Principia',
    desc: 'Founded Projeto Candela — low-cost physics kits now reaching 3,392 students across 28 public schools, cutting failure rates from 30% to 10%. Selected for Escola de Talentos (14 of thousands).',
    media: [
      { src: '/timeline/fixing-things.jpg', caption: 'Building & fixing things' },
      { src: '/timeline/candela-01.jpg', caption: 'Candela in schools' },
      { src: '/timeline/principia.mp4', caption: 'Instituto Principia', type: 'video' },
    ],
  },
  {
    year: '2022',
    title: 'National Recognition',
    desc: 'Silver at OBFEP (Physics National), Gold at OBQJr (Chemistry). Started competing across all sciences.',
    media: [
      { src: '/timeline/national-medals.jpg', caption: 'National awards' },
    ],
  },
  {
    year: '2021',
    title: 'First Gold Medals',
    desc: 'Won gold at OBA (Astronomy), ONEE, and OIMSF International. The olympiad journey begins.',
    media: [
      { src: '/timeline/first-medals.jpg', caption: 'The first medals' },
    ],
  },
  {
    year: '2019',
    title: 'Colégio Militar de Salvador',
    desc: 'Admitted at age 10 — one of 30 selected from 2,500+ applicants. Perfect score in mathematics.',
    media: [
      { src: '/timeline/colegio-militar.jpg', caption: 'Colégio Militar days' },
      { src: '/timeline/salvador-life.jpg', caption: 'Growing up in Salvador' },
    ],
  },
  {
    year: '2014',
    title: 'The Tinkerer Years',
    desc: 'Took apart anything with screws — toys, radios, electronics — to understand how things work. Fixed most of them.',
    media: [
      { src: '/timeline/tinkering.jpg', caption: 'Fixing (or breaking) things' },
      { src: '/timeline/missao-velha.jpg', caption: 'Missao Velha, Ceara' },
    ],
  },
  {
    year: '2007',
    title: 'Hello, World',
    desc: 'Born in Brazil. The curiosity started early — and never really stopped.',
    media: [
      { src: '/timeline/baby.jpg', caption: 'Day one' },
    ],
  },
];

function TimelineMediaSlot({ item }: { item: TimelineMedia }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  const isVideo = item.type === 'video' || item.src.endsWith('.mp4');

  return (
    <div className="timeline-photo">
      {isVideo ? (
        <video
          src={item.src}
          controls
          playsInline
          onError={() => setFailed(true)}
        />
      ) : (
        <img
          src={item.src}
          alt={item.caption}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
      <small>{item.caption}</small>
    </div>
  );
}

function TimelineItem({ event, index }: { event: TimelineEvent; index: number }) {
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
        <span>{event.year}</span>
      </div>
      <div className="timeline-content">
        <h3>{event.title}</h3>
        <p>{event.desc}</p>
        {event.media && event.media.length > 0 && (
          <div className="timeline-media-grid">
            {event.media.map((m, i) => (
              <TimelineMediaSlot key={i} item={m} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Timeline() {
  return (
    <div className="timeline-section" id="timeline">
      <h2 className="heading" data-color-inverted="true">
        My Journey
      </h2>
      <div className="timeline-container">
        <div className="timeline-line" />
        {[...timelineEvents].reverse().map((event, i) => (
          <TimelineItem key={event.year} event={event} index={i} />
        ))}
      </div>
    </div>
  );
}

export default Timeline;
