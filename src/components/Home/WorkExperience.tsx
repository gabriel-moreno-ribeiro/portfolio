import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { lazy, Suspense, useEffect, useRef } from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import { useThemeStore } from '../../store/themeStore';

const PartsAssemblingCanvas = lazy(
  () => import('../Canvas/PartsAssemblingCanvas'),
);

gsap.registerPlugin(ScrollTrigger);

const workExperience = [
  {
    title: 'Co-Founder & CEO',
    company: 'HIBEEX',
    funSummary: 'Excel Wizard @ The Startup That Never Sleeps',
    date: 'January 2026 - Present',
    points: [
      "Building <span class='black'>financial AI</span> that turns accountants into business advisors for every SMB",
      "Full stack: <span class='black'>TypeScript, Next.js, Node.js, Supabase, PostgreSQL, AWS</span>",
      "Cognitive automation for <span class='black'>B2B FinTech</span> workflows",
    ],
  },
  {
    title: 'Co-Founder & CEO',
    company: 'GSAT Education',
    funSummary: 'Accidental Professor @ SAT Prep Inc.',
    date: 'November 2025 - May 2026 (6 Months)',
    points: [
      "Built <span class='black'>EdTech platform</span> for standardized test preparation from scratch",
      "Managed <span class='black'>product development</span> and go-to-market strategy",
      "Led technical and business operations as founding CEO",
    ],
  },
  {
    title: 'President',
    company: 'Olympic Club - Colegio Militar',
    funSummary: 'Nerd Wrangler @ The Study Group',
    date: 'August 2024 - May 2026 (1 Year 9 Months)',
    points: [
      "Led executive board, secured support for <span class='black'>17 major initiatives</span>",
      "Drove <span class='black'>47% increase</span> in student participation",
      "<span class='black'>62% increase</span> in national olympiad results",
    ],
  },
  {
    title: 'Scholar - PREP Program',
    company: 'Fundacao Estudar',
    funSummary: 'Paid To Study @ The 0.7% Club',
    date: 'January 2025 - March 2026 (1 Year 2 Months)',
    points: [
      "One of ~70 scholars from <span class='black'>10,000+ applicants</span> (0.7% acceptance)",
      "Brazil's longest-running and <span class='black'>most competitive</span> college access program",
    ],
  },
  {
    title: 'Researcher',
    company: 'Instituto Principia',
    funSummary: 'Lab Rat @ Science Club',
    date: 'January 2023 - July 2025 (2 Years 6 Months)',
    points: [
      "One of <span class='black'>14 students</span> selected nationally",
      "Research in <span class='black'>chemical kinetics</span> and physicochemical modeling",
      "Advanced physics: quantum mechanics, relativity, statistical physics",
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

    // Simple one-shot fade-in animation — no scrub, so items stay visible once revealed
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

    // Keep the 3D model progress tracker
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
    <div className="work-experience-main-wrapper" ref={containerRef}>
      <h1 className="fixed-heading" data-fun="JSON.parse(my_resume)">
        <span className="orange">Destructuring </span>
        <span data-color-inverted={'true'}>My Experience.</span>
      </h1>
      <div className="left-column">
        <Suspense fallback={null}>
          <PartsAssemblingCanvas />
        </Suspense>
      </div>
      <div className="right-column" ref={textRef}>
        {workExperience.map((exp, index) => (
          <div key={index} className="work-experience-section" data-fun={exp.funSummary}>
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
