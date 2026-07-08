'use client'

import { useState } from 'react'
import { Project, getProjectsByCategory } from '@/lib/projects'
import { ProjectCard } from './ProjectCard'
import { cn } from '@/lib/cn'

export function ProjectGrid() {
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'project', label: 'Projects' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'research', label: 'Research' },
  ]

  const projects = getProjectsByCategory(activeCategory)

  return (
    <section className="py-20 container-base">
      <div className="mb-12">
        <h2 className="text-section font-bold mb-8">Work</h2>

        {/* Category filters */}
        <div className="flex gap-3 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'px-lg py-md text-sm font-500 rounded-normal transition-all duration-200',
                activeCategory === cat.id
                  ? 'bg-accent-primary text-bg-base'
                  : 'bg-bg-elevated text-text-secondary border border-text-tertiary hover:border-text-primary'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length > 0 ? (
          projects.map((project, idx) => (
            <div
              key={project.id}
              style={{
                animation: `slideUp 0.3s ease-out ${idx * 50}ms both`,
              }}
            >
              <ProjectCard project={project} featured={idx === 0 && projects.length > 3} />
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-text-secondary">
            No projects in this category yet.
          </div>
        )}
      </div>
    </section>
  )
}
