'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/cn'

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { label: 'Work', href: '/work' },
    { label: 'About', href: '/about' },
  ]

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
        isScrolled
          ? 'bg-bg-base/80 backdrop-blur-md border-b border-text-tertiary/10'
          : 'bg-transparent'
      )}
    >
      <div className="container-base flex items-center justify-between py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-6 h-6 bg-accent-primary rounded-sm flex items-center justify-center text-xs font-bold text-bg-base">
            G
          </div>
          <span className="font-semibold">Gabriel</span>
        </Link>

        {/* Nav Items */}
        <div className="flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-500 transition-colors relative group',
                'text-text-secondary hover:text-text-primary'
              )}
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-primary group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="#contact"
          className={cn(
            'px-lg py-md bg-accent-primary text-bg-base rounded-normal',
            'font-500 text-sm hover:bg-accent-muted transition-all duration-200',
            'animate-pulse-soft'
          )}
        >
          Get in touch
        </Link>
      </div>
    </nav>
  )
}
