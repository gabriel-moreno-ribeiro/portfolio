'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

export function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    // Staggered fade-in animation
    const elements = [titleRef.current, subtitleRef.current, ctaRef.current]
    elements.forEach((el, i) => {
      if (el) {
        el.style.opacity = '0'
        el.style.transform = 'translateY(10px)'
        setTimeout(() => {
          el.style.transition = 'all 0.6s ease-out'
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
        }, i * 150)
      }
    })
  }, [])

  return (
    <section className="min-h-screen flex items-center justify-center pt-20 pb-20 container-base">
      <div className="max-w-4xl w-full">
        {/* Hero Title */}
        <h1
          ref={titleRef}
          className="text-hero font-bold text-white mb-4 leading-tight"
        >
          Gabriel
        </h1>

        {/* Hero Subtitle */}
        <p
          ref={subtitleRef}
          className="text-xl md:text-2xl text-text-secondary mb-8 max-w-2xl leading-relaxed"
        >
          I build things from the ground up and fix them when they break.
          Electrical engineer + builder. Curious about how systems work.
        </p>

        {/* CTA Buttons */}
        <div ref={ctaRef} className="flex gap-4 flex-wrap">
          <Link
            href="/work"
            className="px-xl py-lg bg-accent-primary text-bg-base rounded-normal font-semibold hover:bg-accent-muted transition-all duration-200 hover:scale-105"
          >
            See my work
          </Link>
          <Link
            href="/about"
            className="px-xl py-lg bg-bg-elevated text-text-primary border border-text-tertiary rounded-normal font-semibold hover:border-text-secondary hover:bg-bg-surface transition-all duration-200"
          >
            Learn my story
          </Link>
        </div>
      </div>
    </section>
  )
}
