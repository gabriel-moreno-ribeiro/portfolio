import { Hero } from '@/components/Hero'
import { Timeline } from '@/components/Timeline'
import { ProjectGrid } from '@/components/ProjectGrid'

export default function Home() {
  return (
    <main>
      <Hero />
      <Timeline />

      {/* Featured projects section */}
      <section className="py-20 container-base bg-bg-surface/30">
        <h2 className="text-section font-bold mb-12">Featured work</h2>
        <ProjectGrid />
      </section>

      {/* Beliefs section */}
      <section className="py-20 container-base">
        <h2 className="text-section font-bold mb-12">What I believe</h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-lg bg-bg-elevated rounded-normal border border-text-tertiary/10 hover:border-accent-primary/30 transition-all duration-300">
            <h3 className="font-semibold mb-md text-lg">Build with intent</h3>
            <p className="text-text-secondary">
              Every line of code, every circuit, every design choice should have a reason. No shortcuts. No nonsense.
            </p>
          </div>

          <div className="p-lg bg-bg-elevated rounded-normal border border-text-tertiary/10 hover:border-accent-primary/30 transition-all duration-300">
            <h3 className="font-semibold mb-md text-lg">Fix the root</h3>
            <p className="text-text-secondary">
              Band-aids are temporary. Understanding a problem means understanding how it fits into the bigger picture.
            </p>
          </div>

          <div className="p-lg bg-bg-elevated rounded-normal border border-text-tertiary/10 hover:border-accent-primary/30 transition-all duration-300">
            <h3 className="font-semibold mb-md text-lg">Curiosity first</h3>
            <p className="text-text-secondary">
              Stay curious. Ask questions. The best solutions come from understanding not just what works, but why.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
