'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export function About() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="about" className="py-section page-padding" ref={ref}>
      <motion.div
        className="max-w-4xl"
        initial={{ opacity: 0, y: 60 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="text-caption uppercase text-foreground-faint tracking-widest block mb-8">
          About
        </span>

        <p className="text-heading font-display text-foreground leading-tight">
          I'm Gabriel. 18. Brazilian.
          <br />
          <span className="text-foreground-muted">
            I've been taking things apart since I could hold a screwdriver.
            Now I build systems — hardware, software, whatever solves the problem.
          </span>
        </p>
      </motion.div>
    </section>
  )
}
