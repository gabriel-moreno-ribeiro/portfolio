'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const initiatives = [
  {
    title: 'Projeto Candela',
    period: 'Jun 2022 – Present',
    description:
      'Physics lab kits + QR video lessons distributed to 28 public schools in Bahia & Ceará, reaching 3,392 students.',
    impact: 'Grades up 40%. Physics failure rate cut from 30% to 10% in 6 months.',
    funding: 'PIBIC Jr/UFBA grant + R$8K crowdfunding. Pitched at 60+ schools.',
  },
  {
    title: 'GSAT Social Scholarships',
    period: 'Oct 2025 – Present',
    description:
      'Free SAT prep for underprivileged students from public schools, funded by 100% reinvestment of GSAT revenue.',
    impact: '53 students improved from ~900 to 1300+ SAT scores.',
    funding: 'R$50K+ revenue — 100% reinvested into student access.',
  },
  {
    title: 'FinTech Financial Literacy RCT',
    period: 'Jan 2025 – Apr 2026',
    description:
      'Randomized Controlled Trial with 208 public-school students testing fintech tools for savings behavior.',
    impact: '+130% total savings in treatment group. Policy recommendations for BNCC.',
    funding: 'Supervised by Dr. Aaron Litvin (Ph.D., Harvard).',
  },
]

export function SocialImpact() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="impact" className="py-section page-padding" ref={ref}>
      <motion.span
        className="text-caption uppercase text-foreground-faint tracking-widest block mb-12"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        Social Impact
      </motion.span>

      <div className="grid gap-12 md:grid-cols-3">
        {initiatives.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="border-l-2 border-accent pl-4">
              <h3 className="text-subheading font-display text-foreground mb-1">
                {item.title}
              </h3>
              <span className="text-caption text-foreground-faint block mb-3">
                {item.period}
              </span>
              <p className="text-sm text-foreground-muted mb-3">
                {item.description}
              </p>
              <p className="text-sm text-accent font-medium mb-1">
                {item.impact}
              </p>
              <p className="text-xs text-foreground-faint">
                {item.funding}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
