'use client'

import { useEffect, useRef } from 'react'

interface TimelineItem {
  year: number
  title: string
  description: string
  type: 'milestone' | 'realization' | 'shift'
}

const milestones: TimelineItem[] = [
  {
    year: 2010,
    title: 'Curious kid',
    description: 'Taking apart electronics to see how they work. First Arduino at 10.',
    type: 'milestone',
  },
  {
    year: 2015,
    title: 'The builder phase',
    description: 'Obsessed with making things. First robot, first circuit board, first drone.',
    type: 'realization',
  },
  {
    year: 2019,
    title: 'Learning systems thinking',
    description: 'Realized that understanding one component matters less than understanding how everything fits together.',
    type: 'shift',
  },
  {
    year: 2022,
    title: 'Discovering software',
    description: 'Learned to code. Found that building software scratches the same itch as hardware.',
    type: 'realization',
  },
  {
    year: 2024,
    title: 'Fixer & Builder',
    description: 'Today: building systems and fixing broken things. EE major, builder by nature.',
    type: 'milestone',
  },
]

export function Timeline() {
  const itemsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-slide-up')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    itemsRef.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <section className="py-20 container-base">
      <h2 className="text-section font-bold mb-16">How I got here</h2>

      <div className="max-w-3xl">
        {milestones.map((item, idx) => (
          <div
            key={item.year}
            ref={(el) => {
              if (el) itemsRef.current[idx] = el
            }}
            className="flex gap-8 mb-12 opacity-0"
          >
            {/* Year indicator */}
            <div className="flex-shrink-0 w-24">
              <div className={`text-lg font-bold ${
                item.type === 'milestone' ? 'text-accent-primary' :
                item.type === 'realization' ? 'text-accent-muted' :
                'text-text-secondary'
              }`}>
                {item.year}
              </div>
              <div className={`w-3 h-3 rounded-full mt-2 ${
                item.type === 'milestone' ? 'bg-accent-primary' :
                item.type === 'realization' ? 'bg-accent-muted' :
                'bg-text-tertiary'
              }`} />
            </div>

            {/* Content */}
            <div className="flex-grow pb-8 border-l border-text-tertiary/20 pl-8">
              <h3 className="text-subsection font-semibold mb-2">{item.title}</h3>
              <p className="text-text-secondary">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
