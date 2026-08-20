import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { lazy, Suspense, useEffect, useRef } from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import { useThemeStore } from '../../store/themeStore';

const skipHeavy3D =
  typeof window !== 'undefined' && window.innerWidth < 768;

const PartsAssemblingCanvas = skipHeavy3D
  ? null
  : lazy(() => import('../Canvas/PartsAssemblingCanvas'));

gsap.registerPlugin(ScrollTrigger);

const workExperience = [
  {
    title: 'Co-Founder & CEO',
    company: 'HIBEEX',
    date: 'January 2026 - Present',
    points: [
      "Building <span class='black'>Backoffice AI</span> for small and medium businesses — raw data in, decisions out",
      "One of <span class='black'>6 startups</span> in the <span class='black'>Canastra Ventures AI Residency</span>",
      "Stack: <span class='black'>TypeScript, Next.js, Node.js, Supabase, PostgreSQL, AWS</span>",
    ],
  },
  {
    title: 'Independent Researcher',
    company: 'Fintech Savings RCT',
    date: 'Advised by Aaron Litvin, Ph.D. (Harvard)',
    points: [
      "Ran an <span class='black'>RCT with 208 students</span> on whether fintech apps change savings behavior",
      "Treatment group saved <span class='black'>130% more</span> than control",
    ],
  },
  {
    title: 'Co-Founder & CEO',
    company: 'GSAT Education',
    date: 'November 2025 - May 2026',
    points: [
      "Built an <span class='black'>EdTech platform</span> for standardized test prep from scratch",
      "Owned product, engineering, and go-to-market as founding CEO",
    ],
  },
  {
    title: 'President',
    company: 'Olympic Club - Colégio Militar',
    date: 'August 2024 - May 2026',
    points: [
      "Ran the board, pushed through <span class='black'>17 initiatives</span> over two years",
      "Student participation up <span class='black'>47%</span>. National olympiad results up <span class='black'>62%</span>.",
    ],
  },
  {
    title: 'Scholar - PREP Program',
    company: 'Fundação Estudar',
    date: 'January 2025 - March 2026',
    points: [
      "One of ~70 picked from <span class='black'>10,000+ applicants</span> (0.7% acceptance)",
      "Brazil's college access program for international universities",
    ],
  },
  {
    title: 'Researcher',
    company: 'Instituto Principia',
    date: 'January 2023 - July 2025',
    points: [
      "One of <span class='black'>14 students</span> selected nationally for Escola de Talentos",
      "Thesis on chemical kinetics under <span class='black'>Prof. Juliano Bonacin, Ph.D.</span> — <span class='black'>97% accuracy</span>, 59 pages",
      "Covered quantum mechanics, relativity, statistical physics",
    ],
  },
];

const WorkExperience = () => {
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const { darkMode } = useThemeStore();
  const isMobile = useIsMobile(600);

  useEffect(() => {
    const sections = gsap.utils.toArray('.work-experience-section');
    const triggers: ScrollTrigger[] = [];

    sections.forEach((section: any) => {
      const anim = gsap.fromTo(
        section,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        },
      );
      if (anim.scrollTrigger) triggers.push(anim.scrollTrigger);
    });

    const progressTrigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: self => {
        document.dispatchEvent(
          new CustomEvent('scrollAnimationProgress', { detail: self.progress }),
        );
      },
    });
    triggers.push(progressTrigger);

    return () => {
      triggers.forEach(t => t.kill());
    };
  }, [darkMode, isMobile]);

  return (
    <div className="work-experience-main-wrapper" ref={containerRef} id="work-experience">
      <h2 className="fixed-heading">
        <span className="orange">Professional </span>
        <span data-color-inverted={'true'}>Experience.</span>
      </h2>
      <div className="left-column">
        {PartsAssemblingCanvas && (
          <Suspense fallback={null}>
            <PartsAssemblingCanvas />
          </Suspense>
        )}
      </div>
      <div className="right-column" ref={textRef}>
        {workExperience.map((exp, index) => (
          <div key={index} className="work-experience-section">
            <h2 className="job-title">
              {exp.title} @ <span className="orange">{exp.company}</span>
            </h2>
            <div className="flex-row">
              <p className="duration">{exp.date}</p>
            </div>
            <ul className="work-ex-points">
              {exp.points.map((point, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: point }} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkExperience;
