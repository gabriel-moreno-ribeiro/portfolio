export const metadata = {
  title: 'About — Gabriel',
  description: 'Gabriel\'s story. From curiosity to building and fixing systems.',
}

export default function AboutPage() {
  return (
    <main className="pt-28 pb-20">
      <div className="container-base max-w-3xl">
        <h1 className="text-hero font-bold mb-8">About me</h1>

        <div className="space-y-8 text-lg text-text-secondary leading-relaxed">
          <p>
            I'm Gabriel. I'm 18, Brazilian, and I spend most of my time building things and fixing things.
          </p>

          <p>
            As a kid, I was the kind of person who took electronics apart to see how they worked. Not to break them — I wanted to understand. That curiosity led me to robotics, circuits, coding, and eventually to systems thinking. I realized that understanding one component matters far less than understanding how everything fits together.
          </p>

          <h2 className="text-subsection font-semibold text-text-primary mt-12 mb-4">The builder phase</h2>

          <p>
            Building things is still my main drive. I love creating systems from scratch — whether that's a circuit board, a software platform, or a robotic arm. There's something deeply satisfying about taking an idea and making it real. About going from nothing to something that works.
          </p>

          <p>
            But building alone isn't enough. Most of the interesting work I do now is fixing things that are already broken. Debugging performance bottlenecks. Understanding why systems fail. Designing better architectures so they don't fail in the future.
          </p>

          <h2 className="text-subsection font-semibold text-text-primary mt-12 mb-4">Fixer & Builder</h2>

          <p>
            I'm pursuing electrical engineering in college because I'm fascinated by how electrical systems form the backbone of modern technology. But I'm equally interested in software, hardware, and everything in between. I build IoT systems, robotics projects, web applications. I analyze why things break. I design systems that don't.
          </p>

          <p>
            This portfolio is a record of both. You'll find projects I've built from scratch. You'll also find deep analyses of problems I've solved — not just the code, but the thinking behind it.
          </p>

          <h2 className="text-subsection font-semibold text-text-primary mt-12 mb-4">What drives me</h2>

          <ul className="space-y-4 list-none">
            <li className="flex gap-3">
              <span className="text-accent-primary flex-shrink-0">→</span>
              <span><strong>Curiosity</strong>: I want to understand how things work at every level.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-primary flex-shrink-0">→</span>
              <span><strong>Pragmatism</strong>: Theory is cool, but working systems matter more.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-primary flex-shrink-0">→</span>
              <span><strong>Precision</strong>: Details compound. Small mistakes become big failures.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-primary flex-shrink-0">→</span>
              <span><strong>Impact</strong>: I want to build things that matter. That solve real problems.</span>
            </li>
          </ul>

          <h2 className="text-subsection font-semibold text-text-primary mt-12 mb-4">Skills & expertise</h2>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div>
              <h4 className="font-semibold text-text-primary mb-3">Hardware & Electronics</h4>
              <ul className="space-y-2 text-text-secondary">
                <li>• Circuit design & analysis</li>
                <li>• Microcontroller programming</li>
                <li>• PCB design (KiCad)</li>
                <li>• Robotics & control systems</li>
                <li>• IoT & embedded systems</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-text-primary mb-3">Software</h4>
              <ul className="space-y-2 text-text-secondary">
                <li>• Full-stack web development</li>
                <li>• Python & system programming</li>
                <li>• Real-time systems</li>
                <li>• Performance optimization</li>
                <li>• System design & architecture</li>
              </ul>
            </div>
          </div>

          <h2 className="text-subsection font-semibold text-text-primary mt-12 mb-4">What's next</h2>

          <p>
            I'm applying to universities in the US for electrical engineering. But wherever I end up, I'll keep building and fixing. I'm particularly interested in:
          </p>

          <ul className="space-y-2 list-none">
            <li className="flex gap-3">
              <span className="text-accent-primary flex-shrink-0">→</span>
              <span>The intersection of hardware and software (embedded systems, IoT)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-primary flex-shrink-0">→</span>
              <span>How to build systems that scale and don't break</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-primary flex-shrink-0">→</span>
              <span>Automation and robotics for real-world impact</span>
            </li>
          </ul>

          <p className="mt-12 pt-8 border-t border-text-tertiary/10">
            Want to chat? I'm always interested in interesting problems, building things together, or just talking about how systems work. Reach out — I'd love to connect.
          </p>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 pt-8 border-t border-text-tertiary/10">
          <p className="text-text-secondary mb-4">Get in touch:</p>
          <div className="flex gap-4 flex-wrap">
            <a
              href="mailto:gabrielcms2112@gmail.com"
              className="px-lg py-md bg-accent-primary text-bg-base rounded-normal font-semibold hover:bg-accent-muted transition-all"
            >
              Email me
            </a>
            <a
              href="https://github.com/gabriel"
              target="_blank"
              rel="noopener noreferrer"
              className="px-lg py-md bg-bg-elevated text-text-primary border border-text-tertiary rounded-normal font-semibold hover:border-text-secondary transition-all"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/gabriel"
              target="_blank"
              rel="noopener noreferrer"
              className="px-lg py-md bg-bg-elevated text-text-primary border border-text-tertiary rounded-normal font-semibold hover:border-text-secondary transition-all"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
