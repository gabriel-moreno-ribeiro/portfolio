import Link from 'next/link'
import { Project } from '@/lib/projects'
import { cn } from '@/lib/cn'

interface ProjectCardProps {
  project: Project
  featured?: boolean
}

export function ProjectCard({ project, featured = false }: ProjectCardProps) {
  return (
    <Link href={`/work/${project.slug}`}>
      <div
        className={cn(
          'group cursor-pointer rounded-normal overflow-hidden transition-all duration-300',
          'bg-bg-elevated border border-text-tertiary hover:border-accent-primary/50',
          'hover:shadow-card-hover',
          featured ? 'col-span-full md:col-span-2' : ''
        )}
      >
        {/* Image placeholder */}
        <div className={cn(
          'relative overflow-hidden bg-bg-surface',
          featured ? 'aspect-video' : 'aspect-square'
        )}>
          <div className="w-full h-full bg-gradient-to-br from-accent-subtle to-bg-surface flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <span className="text-text-tertiary">
              {project.image}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-lg">
          {/* Category badge */}
          <div className="flex gap-2 mb-md">
            <span className="inline-block px-sm py-xs text-xs font-500 rounded-tight bg-accent-subtle text-accent-primary">
              {project.category}
            </span>
            <span className="inline-block px-sm py-xs text-xs font-500 text-text-tertiary">
              {project.year}
            </span>
          </div>

          {/* Title */}
          <h3 className={cn(
            'font-semibold mb-md group-hover:text-accent-primary transition-colors',
            featured ? 'text-subsection' : 'text-lg'
          )}>
            {project.title}
          </h3>

          {/* Description */}
          <p className="text-text-secondary text-sm mb-lg line-clamp-2">
            {project.description}
          </p>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs text-text-tertiary px-sm py-xs rounded-tight bg-bg-surface"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
