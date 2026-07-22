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
      <div className="mb-8">
        <div className="overflow-hidden">
          <motion.h1
            className="text-display font-display text-foreground"
            variants={line}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            Builder &
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
            Founder<span className="text-accent">.</span>
          </motion.h1>
        </div>
      </div>

      <motion.p
        className="text-body-lg text-foreground-muted max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        Co-Founder & CEO at HIBEEX — building financial AI for Brazilian SMBs.
        Full-stack engineer. 39 olympiad medals. Ship fast, measure impact, iterate.
      </motion.p>

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
