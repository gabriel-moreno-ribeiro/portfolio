import { motion, useInView } from 'motion/react';
import { useRef, useState } from 'react';

interface TimelinePhoto {
  src: string;
  caption: string;
}

interface TimelineEvent {
  year: string;
  title: string;
  funTitle: string;
  desc: string;
  funDesc: string;
  photo?: TimelinePhoto;
}

// Chronological order — birth at the top, 2026 at the bottom
// (the render reverses this newest-first list).
// Photos: drop the image files into /public/timeline/ with the exact
// filenames below and they will appear automatically.
const timelineEvents: TimelineEvent[] = [
  {
    year: '2026',
    title: 'The Build Year — HIBEEX',
    funTitle: 'Build Year — Sleep Is For Later',
    desc: 'Chose a build year over freshman year. Co-founded HIBEEX: financial AI for SMBs. One of 6 startups in the Canastra Ventures AI Residency.',
    funDesc: 'Told university "brb, shipping first". Building HIBEEX at 2am. Snuck into an AI residency as the youngest founder in the room.',
    photo: { src: '/timeline/hibeex.jpg', caption: 'Building HIBEEX' },
  },
  {
    year: '2025',
    title: 'Estudar Scholar & SAT 1510',
    funTitle: 'Lottery Winner & Bubble Sheet Pro',
    desc: 'Selected for PREP (0.7% acceptance). SAT 1510/1600. Co-founded GSAT Education. Admitted to St Andrews with a Global Merit Scholarship.',
    funDesc: 'Cracked the 0.7% club. SAT 1510 — those 90 points still hurt. Started a company. Scotland said yes (he said "later").',
  },
  {
    year: '2024',
    title: 'Olympic Club President & IFT #1',
    funTitle: 'President of Nerds & #1 Somehow',
    desc: 'Led the Olympic Club. Ranked 1st of 10,000+ at IFT-UNESP. Bronze OBQ, Silver OBMEP, Gold ONNEQ.',
    funDesc: 'Ran the nerd club. Out-nerded 10,000+ people at IFT-UNESP. Bronze, Silver, Gold — collecting the full set.',
  },
  {
    year: '2023',
    title: 'PIBIC Jr & Instituto Principia',
    funTitle: 'The Duct Tape Science Era',
    desc: 'Founded Projeto Candela — low-cost physics kits now reaching 3,392 students across 28 public schools, cutting failure rates from 30% to 10%. Selected for Escola de Talentos (14 of thousands).',
    funDesc: 'Started Projeto Candela: duct-tape physics kits. 3,392 kids later, failing physics went out of fashion. Also joined a club of 14 chosen nerds.',
    photo: { src: '/timeline/fixing-things.jpg', caption: 'Building & fixing things' },
  },
  {
    year: '2022',
    title: 'National Recognition',
    funTitle: 'Certified National Nerd',
    desc: 'Silver at OBFEP (Physics National), Gold at OBQJr (Chemistry). Started competing across all sciences.',
    funDesc: "Silver in Physics, Gold in Chemistry. Decided one science wasn't enough and started collecting them all.",
  },
  {
    year: '2021',
    title: 'First Gold Medals',
    funTitle: 'First Shiny Objects',
    desc: 'Won gold at OBA (Astronomy), ONEE, and OIMSF International. The olympiad journey begins.',
    funDesc: 'Struck gold at OBA, ONEE, and OIMSF International. Discovered that tests could be a whole personality.',
    photo: { src: '/timeline/first-medals.jpg', caption: 'The first medals' },
  },
  {
    year: '2019',
    title: 'Colegio Militar de Salvador',
    funTitle: 'The Uniform Era Begins',
    desc: 'Admitted at age 10 — one of 30 selected from 2,500+ applicants. Perfect score in mathematics.',
    funDesc: 'Got in at age 10 — one of 30 picked from 2,500+ kids. Perfect score in math, zero chill ever since.',
    photo: { src: '/timeline/colegio-militar.jpg', caption: 'Colegio Militar days' },
  },
  {
    year: '2014',
    title: 'The Tinkerer Years',
    funTitle: 'Professional Toy Disassembler',
    desc: 'Took apart anything with screws — toys, radios, electronics — to understand how things work. Fixed most of them.',
    funDesc: 'Unscrewed everything in the house to see the insides. Reassembly success rate: debatable but improving.',
    photo: { src: '/timeline/tinkering.jpg', caption: 'Fixing (or breaking) things' },
  },
  {
    year: '2007',
    title: 'Hello, World',
    funTitle: 'Player 1 Has Entered The Game',
    desc: 'Born in Brazil. The curiosity started early — and never really stopped.',
    funDesc: 'Spawned in Brazil. Immediately started asking "why?" about everything and never stopped.',
    photo: { src: '/timeline/baby.jpg', caption: 'Day one' },
  },
];

function TimelinePhotoSlot({ photo }: { photo: TimelinePhoto }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="timeline-photo placeholder">
        <span>📷 {photo.caption}</span>
        <small>Photo coming soon</small>
      </div>
    );
  }

  return (
    <div className="timeline-photo">
      <img
        src={photo.src}
        alt={photo.caption}
        loading="lazy"
        onError={() => setFailed(true)}
      />
      <small>{photo.caption}</small>
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
      data-fun-zone="true"
    >
      <div className="timeline-year">
        <span>{event.year}</span>
      </div>
      <div className="timeline-content">
        <h3 data-fun={event.funTitle}>{event.title}</h3>
        <p data-fun={event.funDesc}>{event.desc}</p>
        {event.photo && <TimelinePhotoSlot photo={event.photo} />}
      </div>
    </motion.div>
  );
}

function Timeline() {
  return (
    <div className="timeline-section" id="timeline">
      <h1 className="heading" data-color-inverted="true" data-fun="The Origin Story">
        My Journey
      </h1>
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
