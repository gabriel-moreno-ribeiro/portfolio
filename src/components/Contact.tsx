'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export function Contact() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="contact" className="py-section page-padding" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="text-caption uppercase text-foreground-faint tracking-widest block mb-8">
          Get in touch
        </span>

        <h2 className="text-display font-display text-foreground mb-12">
          Let's talk<span className="text-accent">.</span>
        </h2>

        <div className="flex flex-col md:flex-row gap-12 md:gap-24">
          <div>
            <span className="text-caption uppercase text-foreground-faint tracking-widest block mb-3">
              Email
            </span>
            <a
              href="mailto:gabrielcms2112@gmail.com"
              className="text-subheading text-foreground hover:text-accent transition-colors duration-300"
            >
              gabrielcms2112@gmail.com
            </a>
          </div>

          <div>
            <span className="text-caption uppercase text-foreground-faint tracking-widest block mb-3">
              Socials
            </span>
            <div className="flex flex-col gap-2">
              <a href="#" className="text-foreground-muted hover:text-accent transition-colors duration-300">
                GitHub
              </a>
              <a href="#" className="text-foreground-muted hover:text-accent transition-colors duration-300">
                LinkedIn
              </a>
              <a href="#" className="text-foreground-muted hover:text-accent transition-colors duration-300">
                Twitter
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer line */}
      <motion.div
        className="mt-section pt-8 border-t border-foreground-faint/20 flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <span className="text-caption text-foreground-faint">
          © 2024 Gabriel
        </span>
        <span className="text-caption text-foreground-faint">
          Built from scratch.
        </span>
      </motion.div>
    </section>
  )
}
