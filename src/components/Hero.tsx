'use client'

import { motion } from 'framer-motion'

const line = {
  hidden: { y: '100%' },
  visible: (i: number) => ({
    y: 0,
    transition: {
      delay: 1.8 + i * 0.15,
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
}

export function Hero() {
  return (
    <section className="min-h-screen flex flex-col justify-end page-padding pb-12">
      {/* Main title */}
      <div className="mb-8">
        <div className="overflow-hidden">
          <motion.h1
            className="text-display font-display text-foreground"
            variants={line}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            Fixer &
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1
            className="text-display font-display text-foreground"
            variants={line}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            Builder<span className="text-accent">.</span>
          </motion.h1>
        </div>
      </div>

      {/* Subtitle */}
      <motion.p
        className="text-body-lg text-foreground-muted max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        I build things from scratch and fix them when they break.
        Electrical engineer. Entrepreneur by instinct.
      </motion.p>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 right-8 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 0.8 }}
      >
        <span className="text-caption uppercase text-foreground-faint tracking-widest rotate-90 origin-center">
          Scroll
        </span>
        <motion.div
          className="w-px h-12 bg-foreground-faint"
          initial={{ scaleY: 0, originY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 3.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.div>
    </section>
  )
}
