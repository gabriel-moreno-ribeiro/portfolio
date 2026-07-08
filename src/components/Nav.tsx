'use client'

import { motion } from 'framer-motion'

export function Nav() {
  const links = [
    { label: 'Work', href: '#work' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ]

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 page-padding flex items-center justify-between py-6 mix-blend-difference"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.8 }}
    >
      <a href="#" className="text-sm font-medium text-foreground">
        Gabriel<span className="text-accent">.</span>
      </a>

      <div className="flex items-center gap-8">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-sm text-foreground-muted hover:text-foreground transition-colors duration-300 relative group"
          >
            {link.label}
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-accent group-hover:w-full transition-all duration-500 ease-out-expo" />
          </a>
        ))}
      </div>
    </motion.nav>
  )
}
