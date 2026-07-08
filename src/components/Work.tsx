'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface Project {
  title: string
  category: string
  year: string
  description: string
}

const projects: Project[] = [
  // Placeholder — Gabriel will fill with real projects
  {
    title: 'Project One',
    category: 'Building',
    year: '2024',
    description: 'Description goes here.',
  },
  {
    title: 'Project Two',
    category: 'Fixing',
    year: '2024',
    description: 'Description goes here.',
  },
  {
    title: 'Project Three',
    category: 'Research',
    year: '2023',
    description: 'Description goes here.',
  },
]

function ProjectRow({ project, index }: { project: Project; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.a
      ref={ref}
      href="#"
      className="group block py-8 border-b border-foreground-faint/20 cursor-pointer"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
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

        <motion.div
          className="w-6 h-6 flex items-center justify-center text-foreground-faint group-hover:text-accent transition-colors duration-500"
          whileHover={{ x: 4 }}
        >
          ↗
        </motion.div>
      </div>

      <p className="text-foreground-muted text-sm mt-2 max-w-md opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        {project.description}
      </p>
    </motion.a>
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
