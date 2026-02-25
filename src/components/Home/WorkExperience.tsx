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
    title: 'Software Engineer',
    company: 'Dock.us',
    date: 'March 2025 - Present (~1 Year)',
    points: [
      "Building features using the latest <span class='black'>technologies</span>",
      "<span class='black'>Next.js, Node.js, GraphQL</span> based tech stack",
      "<span class='black'>AWS SQS</span> for queueing infrastructure",
    ],
  },
  {
    title: 'Founding Engineer',
    company: 'Turgon AI',
    date: 'October 2024 - June 2025 (~1 Year)',
    points: [
      "Led a cross-functional team to architect and deliver <span class='black'>3 AI-driven products</span>",
      "Reviewed and merged <span class='black'>500+ pull requests</span> as Scrum Master",
      "Built a multi-tenant <span class='black'>Next.js CMS</span> for private club mobile apps with dynamic pages, real-time updates, and RBAC",
      "Developed <span class='black'>Fin-AI product</span> with 99%+ accurate financial insights using Vercel AI SDK, LangChain, and Eleven Labs",
      "Architected AI-driven <span class='black'>Expo mobile app</span> with BFF architecture, digital wallet, and ticketing system",
      "Integrated PostHog analytics, Redux Toolkit, Upstash Redis, and CI/CD pipelines with <span class='black'>GitHub Actions</span>",
    ],
  },
  {
    title: 'SDE',
    company: 'AccioJob (YC 21)',
    date: 'October 2022 - October 2024 (2 Years)',
    points: [
      "Managed <span class='black'>300+</span> features and issues (highest in team) across four product repositories",
      'Developed AI products: AI-based tutoring, question generation, and proctoring services',
      "Taught Frontend Web Development to <span class='black'>90,000+</span> students online",
    ],
  },
  {
    title: 'Founder',
    company: 'STV Technologies',
    date: 'October 2021 - August 2022 (1 Year)',
    points: [
      "Co-founded freelancing firm, collaborating with <span class='black'>international and national</span> clients",
      "Completed <span class='black'>30+</span> freelance projects spanning full-stack web, app dev, Shopify, Unity games",
      "Generated revenue of <span class='black'>INR 10,00,000/-</span>",
    ],
  },
  {
    title: 'Fullstack Intern',
    company: 'Attrilu',
    date: 'Feb 2022 - April 2022 (3 Months)',
    points: [
      "Built web application for creators and brand marketing using <span class='black'>Facebook (Meta) APIs</span>",
      "Tech stack: <span class='black'>Next.js and Django</span>",
    ],
  },
  {
    title: 'Mobile App Intern',
    company: 'Fitzura',
    date: 'Jan 2022 - March 2022 (3 Months)',
    points: [
      "Developed fitness clothing app using <span class='black'>React Native</span>",
      "Built backend using <span class='black'>Python Django</span>",
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
      <h1 className="fixed-heading">
        <span className="orange">Destructuring </span>
        <span data-color-inverted={'true'}>My Work Experience.</span>
      </h1>
      <div className="left-column">
        <Suspense fallback={null}>
          <PartsAssemblingCanvas />
        </Suspense>
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
