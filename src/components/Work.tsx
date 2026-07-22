'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface Project {
  title: string
  category: string
  year: string
  description: string
  link?: string
}

const projects: Project[] = [
  {
    title: 'HIBEEX',
    category: 'FinTech · AI',
    year: '2026',
    description:
      'B2B financial intelligence platform — connects to Brazilian ERPs (Omie, Conta Azul, VHSYS), syncs data, and delivers AI-powered cash-flow analysis. Revenue-share partnership with VHSYS (~20,000 clients). Serving the 6th largest Sistema Dominio user in Brazil.',
    link: 'https://www.hibeex.com.br/',
  },
  {
    title: 'GSAT Education',
    category: 'EdTech · AI',
    year: '2025',
    description:
      'Adaptive SAT prep platform with 3,200+ annotated-solutions DB and proprietary personalization algorithm. 71 students mentored, 53 improved from ~900 to 1300+ SAT. R$50K+ revenue bootstrapped, 100% reinvested.',
  },
  {
    title: 'FinTech Savings RCT',
    category: 'Research · Behavioral Economics',
    year: '2025',
    description:
      'Randomized Controlled Trial (n=208 public-school students) measuring fintech impact on savings behavior. +130% total savings in treatment group. Supervised by Dr. Aaron Litvin (Ph.D., Harvard).',
  },
  {
    title: 'Chemical Kinetics Modeling',
    category: 'Scientific Computing',
    year: '2024',
    description:
      'Computational modeling of complex chemical mechanisms using Steady-State Approximation. 59-page thesis with 97% simulation accuracy on Haber-Bosch and stratospheric ozone systems. Under Dr. Juliano Bonacin (Ph.D., USP).',
  },
  {
    title: 'Refurbished Electronics',
    category: 'E-Commerce',
    year: '2021–2024',
    description:
      'Imported, repaired & shipped hardware to 150+ clients across 21 Brazilian states. ~USD 7,000 revenue; 75% reinvested in education.',
  },
]

function ProjectRow({ project, index }: { project: Project; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const Tag = project.link ? 'a' : 'div'
  const linkProps = project.link
    ? { href: project.link, target: '_blank', rel: 'noopener noreferrer' }
    : {}

  return (
    <motion.div
      ref={ref}
      className="group block py-8 border-b border-foreground-faint/20"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <Tag {...linkProps} className={project.link ? 'cursor-pointer' : ''}>
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-heading font-display text-foreground group-hover:text-accent transition-colors duration-500">
              {project.title}
            </h3>
          </div>

          <div className="hidden md:flex items-center gap-8 text-foreground-muted text-sm">
            <span>{project.category}</span>
            <span>{project.year}</span>
          </div>

          {project.link && (
            <motion.div
              className="w-6 h-6 flex items-center justify-center text-foreground-faint group-hover:text-accent transition-colors duration-500"
              whileHover={{ x: 4 }}
            >
              ↗
            </motion.div>
          )}
        </div>

        <p className="text-foreground-muted text-sm mt-3 max-w-2xl">
          {project.description}
        </p>
      </Tag>
    </motion.div>
  )
}

export function Work() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="work" className="py-section page-padding" ref={ref}>
      <motion.span
        className="text-caption uppercase text-foreground-faint tracking-widest block mb-12"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        Selected Work
      </motion.span>

      <div>
        {projects.map((project, i) => (
          <ProjectRow key={project.title} project={project} index={i} />
        ))}
      </div>
    </section>
  )
}
