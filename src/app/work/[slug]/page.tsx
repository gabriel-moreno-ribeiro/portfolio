import { getProject, projects } from '@/lib/projects'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProjectCard } from '@/components/ProjectCard'

export async function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = getProject(slug)

  if (!project) {
    return {
      title: 'Project not found',
    }
  }

  return {
    title: `${project.title} — Gabriel`,
    description: project.description,
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = getProject(slug)

  if (!project) {
    notFound()
  }

  // Get related projects
  const relatedProjects = projects
    .filter((p) => p.id !== project.id && p.category === project.category)
    .slice(0, 2)

  return (
    <main className="pt-28 pb-20">
      <div className="container-base">
        {/* Hero section */}
        <div className="mb-16">
          <Link
            href="/work"
            className="inline-flex items-center gap-2 text-accent-primary hover:text-accent-muted mb-8 transition-colors"
          >
            ← Back to work
          </Link>

          <h1 className="text-hero font-bold mb-4">{project.title}</h1>
          <div className="flex gap-4 flex-wrap mb-8">
            <span className="text-text-secondary">{project.year}</span>
            <span className="text-text-tertiary">•</span>
            <span className="inline-block px-md py-xs text-sm font-500 rounded-tight bg-accent-subtle text-accent-primary">
              {project.category}
            </span>
          </div>

          {/* Image placeholder */}
          <div className="aspect-video bg-gradient-to-br from-accent-subtle to-bg-surface rounded-normal mb-12 flex items-center justify-center">
            <span className="text-text-tertiary">{project.image}</span>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid md:grid-cols-3 gap-12 mb-20">
          {/* Main content */}
          <div className="md:col-span-2">
            <div className="space-y-12">
              {/* Problem */}
              <div>
                <h2 className="text-subsection font-semibold mb-4">Problem</h2>
                <p className="text-text-secondary text-lg leading-relaxed">{project.problem}</p>
              </div>

              {/* Solution */}
              <div>
                <h2 className="text-subsection font-semibold mb-4">Solution</h2>
                <p className="text-text-secondary text-lg leading-relaxed">{project.solution}</p>
              </div>

              {/* Outcome */}
              <div>
                <h2 className="text-subsection font-semibold mb-4">Outcome</h2>
                <p className="text-text-secondary text-lg leading-relaxed">{project.outcome}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Technologies */}
            <div className="mb-12 p-lg bg-bg-elevated rounded-normal border border-text-tertiary/10">
              <h3 className="font-semibold mb-md">Technologies</h3>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-md py-xs text-sm rounded-tight bg-bg-surface text-text-secondary"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Links */}
            {Object.entries(project.links).length > 0 && (
              <div className="p-lg bg-bg-elevated rounded-normal border border-text-tertiary/10">
                <h3 className="font-semibold mb-md">Links</h3>
                <div className="space-y-2">
                  {project.links.github && (
                    <a
                      href={project.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-accent-primary hover:text-accent-muted transition-colors"
                    >
                      → GitHub
                    </a>
                  )}
                  {project.links.live && (
                    <a
                      href={project.links.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-accent-primary hover:text-accent-muted transition-colors"
                    >
                      → Live demo
                    </a>
                  )}
                  {project.links.writeup && (
                    <a
                      href={project.links.writeup}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-accent-primary hover:text-accent-muted transition-colors"
                    >
                      → Write-up
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related projects */}
        {relatedProjects.length > 0 && (
          <div className="border-t border-text-tertiary/10 pt-20">
            <h2 className="text-section font-bold mb-8">Related projects</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {relatedProjects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
