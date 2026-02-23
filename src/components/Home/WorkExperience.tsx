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
    company: 'Dock.us (YC 21)',
    date: 'March 2025 - Present (~1 Year)',
    description:
      "Building cool and amazing features using the latest AI technologies, for a <span class='black'>Next.js, Node.js, GraphQL</span> based tech stack with <span class='black'>AWS SQS</span> for messaging infrastructure.",
  },
  {
    title: 'Founding Engineer',
    company: 'Turgon AI',
    date: 'October 2024 - June 2025 (~1 Year)',
    description:
      "Led and mentored a cross-functional team to architect and deliver <span class='black'>three AI-driven products</span>. Acted as Scrum Master, reviewed and merged <span class='black'>500+ pull requests</span>. Built a multi-tenant <span class='black'>Next.js CMS</span> controlling private club mobile apps globally with dynamic pages, real-time updates, and RBAC. Developed secure contactless check-ins using encrypted QR codes, a <span class='black'>Fin-AI product</span> with 99%+ accurate financial insights leveraging Vercel AI SDK, LangChain, and Eleven Labs. Architected an AI-driven <span class='black'>Expo mobile app</span> using BFF architecture, digital wallet and ticketing system, and robust CI/CD pipelines with <span class='black'>GitHub Actions</span>. Integrated PostHog analytics, Redux Toolkit, Upstash Redis, and multi-tenant deployments via Vercel with Prisma ORM and Supabase Realtime.",
  },
  {
    title: 'SDE',
    company: 'AccioJob (YC 21)',
    date: 'October 2022 - October 2024 (2 Years)',
    description:
      "Managed over <span class='black'>300+</span> features and issues (highest in the team) across four product repositories, handling both frontend and backend tasks while launching new features. Developed AI products, such as AI-based tutoring, unique question generation, and proctoring services, introducing a high-revenue vertical and advanced proctoring features also taught Frontend Web Development to over <span class='black'>90,000</span> students online.",
  },
  {
    title: 'Founder ',
    company: 'STV Technologies',
    date: 'October 2021 - August 2022 (1 Year)',
    description:
      "Worked at a freelancing firm alongside college friends, collaborating with <span class='black'>international and national </span> clients to successfully complete <span class='black'>30+</span> freelance projects within a 2-year timeframe. Projects encompassed diverse areas such as full-stack web development, app development, Shopify, Wix/WordPress websites, unity games, and more. Generated a revenue of <span class='black'>INR 10,00,00/-</span>",
  },
  {
    title: 'Fullstack Intern',
    company: 'Attrilu',
    date: 'Feb 2022 - April 2022 (3 Months)',
    description:
      "Served as a freelance developer, engaging in projects involving <span class='black'>Facebook (Meta) APIs.</span> Collaborated in building a web application for creators and brand marketing, utilizing technologies such as <span class='black'>Next.js and Django.</span>",
  },
  {
    title: 'Mobile App Intern',
    company: 'Fitzura',
    date: 'Jan 2022 - March 2022 (3 Months)',
    description:
      "Assisted in developing a comprehensive fitness clothing app using <span class='black'>React Native</span> and also crafted its backend using <span class='black'>Python Django.</span>",
  },
];

const WorkExperience = () => {
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const { darkMode } = useThemeStore();
  const isMobile = useIsMobile(600);

  useEffect(() => {
    const sections = gsap.utils.toArray('.work-experience-section');

    sections.forEach((section: any) => {
      gsap.fromTo(
        section,
        { opacity: 0, y: isMobile ? 100 : 100 },
        {
          opacity: 1,
          y: 0,
          overwrite: 'auto',
          scrollTrigger: {
            trigger: section,
            start: isMobile ? 'top-=200 center+=500' : 'top+=20 center+=200',
            end: 'bottom center',
            scrub: 0.3,
          },
        },
      );
    });

    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: self => {
        const progress = self.progress;
        document.dispatchEvent(
          new CustomEvent('scrollAnimationProgress', { detail: progress }),
        );
      },
    });
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
            <p
              className="work-ex"
              dangerouslySetInnerHTML={{ __html: exp.description }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkExperience;
