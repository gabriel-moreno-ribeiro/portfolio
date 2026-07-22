'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const honors = [
  { title: '39 Olympiad Medals (19 Gold)', detail: '49 science olympiads, 7,000+ study hours, 2 international awards' },
  { title: 'SAT 1510/1600', detail: 'Math 780 — 98th percentile globally, Top 1% in Brazil' },
  { title: 'R$1.5M+ Merit Scholarships', detail: 'Full rides at Brazil\'s top 4 prep schools' },
  { title: 'Canastra Ventures AI Residency', detail: 'R$800K pre-seed, 1 of 6 startups (2.5%), youngest founding team ever' },
  { title: 'Fundação Estudar Fellowship', detail: '1 of ~70 fellows from 10,000+ candidates (0.7% acceptance)' },
  { title: 'LALA Leadership Academy', detail: 'Latin American Leadership Academy fellow' },
  { title: 'Colégio Militar de Salvador', detail: 'Admitted at age 10 (1 of 30 from 2,000+), Alamar 5 consecutive years' },
  { title: 'IIP Selection', detail: '1 of 14 among 700+ candidates, International Institute of Physics' },
]

export function Honors() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="honors" className="py-section page-padding" ref={ref}>
      <motion.span
        className="text-caption uppercase text-foreground-faint tracking-widest block mb-12"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        Honors & Awards
      </motion.span>

      <div className="grid gap-4 md:grid-cols-2">
        {honors.map((item, i) => (
          <motion.div
            key={item.title}
            className="py-4 border-b border-foreground-faint/20"
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <h4 className="text-foreground font-medium text-sm">{item.title}</h4>
            <p className="text-foreground-muted text-xs mt-1">{item.detail}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
