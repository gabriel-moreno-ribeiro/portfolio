'use client'

import { useState } from 'react'
import { Preloader } from '@/components/Preloader'
import { Nav } from '@/components/Nav'
import { Hero } from '@/components/Hero'
import { About } from '@/components/About'
import { Work } from '@/components/Work'
import { Contact } from '@/components/Contact'

export default function Home() {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      <Preloader onComplete={() => setLoaded(true)} />

      {loaded && (
        <main>
          <Nav />
          <Hero />
          <div className="line-separator mx-auto w-[90%]" />
          <About />
          <div className="line-separator mx-auto w-[90%]" />
          <Work />
          <div className="line-separator mx-auto w-[90%]" />
          <Contact />
        </main>
      )}
    </>
  )
}
