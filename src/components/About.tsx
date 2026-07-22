'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const skills = [
  { category: 'Languages', items: ['TypeScript', 'JavaScript', 'Java', 'C++', 'Python'] },
  { category: 'Frontend', items: ['Next.js', 'React', 'Tailwind CSS', 'Framer Motion'] },
  { category: 'Backend & Data', items: ['Node.js', 'Supabase', 'PostgreSQL', 'REST APIs'] },
  { category: 'AI / ML', items: ['Claude API', 'LLM Orchestration', 'Agentic Workflows', 'Data Pipelines'] },
  { category: 'Cloud & Tools', items: ['AWS', 'Git', 'GitHub Actions', 'Vercel'] },
]

export function About() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="about" className="py-section page-padding" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="text-caption uppercase text-foreground-faint tracking-widest block mb-8">
          About
        </span>

        <p className="text-heading font-display text-foreground leading-tight max-w-4xl">
          Gabriel Moreno Ribeiro.
          <br />
          <span className="text-foreground-muted">
            18-year-old founder from Brazil who builds full-stack AI products
            and ships them to real users. From ERP automation to EdTech,
            I turn complex problems into working systems.
          </span>
        </p>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-5 gap-8">
          {skills.map((group) => (
            <div key={group.category}>
              <span className="text-caption uppercase text-accent tracking-widest block mb-3">
                {group.category}
              </span>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item} className="text-sm text-foreground-muted">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
