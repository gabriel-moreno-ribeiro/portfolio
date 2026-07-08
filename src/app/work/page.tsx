import { ProjectGrid } from '@/components/ProjectGrid'

export const metadata = {
  title: 'Work — Gabriel',
  description: 'Projects, analyses, and research from Gabriel. Building and fixing systems.',
}

export default function WorkPage() {
  return (
    <main className="pt-28 pb-20">
      <div className="container-base">
        <div className="mb-16">
          <h1 className="text-hero font-bold mb-4">Work</h1>
          <p className="text-xl text-text-secondary max-w-2xl">
            A collection of projects I've built, problems I've analyzed, and research I've conducted.
          </p>
        </div>
      </div>

      <ProjectGrid />
    </main>
  )
}
