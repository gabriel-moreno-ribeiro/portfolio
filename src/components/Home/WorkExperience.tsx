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
    funTitle: 'Chief Excel Whisperer @ HIBEEX',
    date: 'January 2026 - Present',
    funDate: 'January 2026 - Until Coffee Runs Out',
    points: [
      "Building <span class='black'>financial AI</span> that turns messy financial data into decisions SMB owners can act on",
      "One of <span class='black'>6 startups</span> in the <span class='black'>Canastra Ventures AI Residency</span> — among the youngest founders selected",
      "Full stack: <span class='black'>TypeScript, Next.js, Node.js, Supabase, PostgreSQL, AWS</span>",
    ],
    funPoints: [
      'Building robots that turn financial spaghetti into actual decisions',
      'One of 6 startups in a fancy AI residency — youngest guy in every room, again',
      'Full stack: every buzzword on my LinkedIn, held together with duct tape and prayers',
    ],
  },
  {
    title: 'Independent Researcher',
    company: 'Fintech Savings RCT',
    funTitle: 'Teen Money Scientist @ The Savings Lab',
    date: 'Advised by Aaron Litvin, Ph.D. (Harvard)',
    funDate: 'Adult Supervision Provided By Harvard',
    points: [
      "Designed and ran a <span class='black'>randomized controlled trial</span> with <span class='black'>208 public-school students</span> on how fintech tools change savings behavior",
      "Treatment group increased savings by <span class='black'>130%</span>",
    ],
    funPoints: [
      'Talked 208 teenagers into a savings experiment — and they actually showed up',
      'The group with the app saved 130% more — the control group is still salty',
    ],
  },
  {
    title: 'Co-Founder & CEO',
    company: 'GSAT Education',
    funTitle: 'Accidental Professor @ SAT Prep Inc.',
    date: 'November 2025 - May 2026 (6 Months)',
    funDate: 'November 2025 - May 2026 (6 Months of Chaos)',
    points: [
      "Built <span class='black'>EdTech platform</span> for standardized test preparation from scratch",
      "Managed <span class='black'>product development</span> and go-to-market strategy",
      "Led technical and business operations as founding CEO",
    ],
    funPoints: [
      'Built an entire EdTech platform because studying alone was too boring',
      'Managed product development, a.k.a. argued with my own to-do list',
      'Led technical and business operations, a.k.a. did literally everything',
    ],
  },
  {
    title: 'President',
    company: 'Olympic Club - Colegio Militar',
    funTitle: 'Nerd Wrangler @ The Study Club',
    date: 'August 2024 - May 2026 (1 Year 9 Months)',
    funDate: 'August 2024 - May 2026 (Felt Like a Decade)',
    points: [
      "Led executive board, secured support for <span class='black'>17 major initiatives</span>",
      "Drove <span class='black'>47% increase</span> in student participation",
      "<span class='black'>62% increase</span> in national olympiad results",
    ],
    funPoints: [
      'Convinced the board to fund 17 wild ideas without getting expelled',
      'Tricked 47% more students into doing extra math for fun',
      '62% more medals — the trophy cabinet asked for a raise',
    ],
  },
  {
    title: 'Scholar - PREP Program',
    company: 'Fundacao Estudar',
    funTitle: 'Lottery Winner @ The 0.7% Club',
    date: 'January 2025 - March 2026 (1 Year 2 Months)',
    funDate: "January 2025 - March 2026 (Still Can't Believe It)",
    points: [
      "One of ~70 scholars from <span class='black'>10,000+ applicants</span> (0.7% acceptance)",
      "Brazil's longest-running and <span class='black'>most competitive</span> college access program",
    ],
    funPoints: [
      'One of ~70 survivors from 10,000+ applicants — basically the Hunger Games',
      "Brazil's oldest and scariest college prep bootcamp",
    ],
  },
  {
    title: 'Researcher',
    company: 'Instituto Principia',
    funTitle: 'Certified Lab Rat @ Science Camp',
    date: 'January 2023 - July 2025 (2 Years 6 Months)',
    funDate: 'January 2023 - July 2025 (2.5 Years of Beakers)',
    points: [
      "One of <span class='black'>14 students</span> selected nationally",
      "Chemical kinetics under <span class='black'>Prof. Juliano Bonacin, Ph.D.</span> — reaction mechanisms modeled with <span class='black'>97% accuracy</span> in a 59-page thesis",
      "Advanced physics: quantum mechanics, relativity, statistical physics",
    ],
    funPoints: [
      'One of 14 kids nationally who thought this sounded like fun',
      'Watched chemicals react and wrote a 59-page thesis about it — 97% accurate, 100% exhausting',
      'Quantum mechanics, relativity — yes, my brain hurt too',
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
          <div key={index} className="work-experience-section" data-fun-zone="true">
            <h2 className="job-title" data-fun={exp.funTitle}>
              {exp.title} @ <span className="orange">{exp.company}</span>
            </h2>
            <div className="flex-row">
              <p className="duration" data-fun={exp.funDate}>{exp.date}</p>
            </div>
            <ul className="work-ex-points">
              {exp.points.map((point, i) => (
                <li key={i} data-fun={exp.funPoints[i]} dangerouslySetInnerHTML={{ __html: point }} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkExperience;
