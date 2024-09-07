import useMediaQuery from "@mui/material/useMediaQuery";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { useThemeStore } from "../../store/themeStore";
import PartsAssemblingCanvas from "../Canvas/PartsAssemblingCanvas";

gsap.registerPlugin(ScrollTrigger);

const workExperience = [
  {
    title: "SDE",
    company: "AccioJob (YC 21)",
    date: "October 2022 - Present (2 Years)",
    description:
      "Managed over <span class='black'>300+</span> features and issues (highest in the team) across four product repositories, handling both frontend and backend tasks while launching new features. Developed AI products, such as AI-based tutoring, unique question generation, and proctoring services, introducing a high-revenue vertical and advanced proctoring features also taught Frontend Web Development to over <span class='black'>90,000</span> students online.",
  },
  {
    title: "Founder ",
    company: "STV Technologies",
    date: "October 2021 - August 2022 (1 Year)",
    description:
      "Worked at a freelancing firm alongside college friends, collaborating with <span class='black'>international and national </span> clients to successfully complete <span class='black'>30+</span> freelance projects within a 2-year timeframe. Projects encompassed diverse areas such as full-stack web development, app development, Shopify, Wix/WordPress websites, unity games, and more. Generated a revenue of <span class='black'>INR 10,00,00/-</span>",
  },
  {
    title: "Fullstack Intern",
    company: "Attrilu",
    date: "Feb 2022 - April 2022 (3 Months)",
    description:
      "Served as a freelance developer, engaging in projects involving <span class='black'>Facebook (Meta) APIs.</span> Collaborated in building a web application for creators and brand marketing, utilizing technologies such as <span class='black'>Next.js and Django.</span>",
  },
  {
    title: "Mobile Intern",
    company: "Fitzura",
    date: "Jan 2022 - March 2022 (3 Months)",
    description:
      "Assisted in developing a comprehensive fitness clothing app using <span class='black'>React Native</span> and also crafted its backend using <span class='black'>Python Django.</span>",
  },
];

const WorkExperience = () => {
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const { darkMode } = useThemeStore();
  const isMobile = useMediaQuery("(max-width: 600px)");

  useEffect(() => {
    if (isMobile) return;
    const sections = gsap.utils.toArray(".work-experience-section");

    sections.forEach((section: any) => {
      gsap.fromTo(
        section,
        { opacity: 0, y: 100 },
        {
          opacity: 1,
          y: 0,
          overwrite: "auto",
          scrollTrigger: {
            trigger: section,
            start: "top+=20 center+=200",
            end: "bottom center",
            scrub: 0.3,
          },
        }
      );
    });

    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5,
      onUpdate: (self) => {
        const progress = self.progress;
        document.dispatchEvent(
          new CustomEvent("scrollAnimationProgress", { detail: progress })
        );
      },
    });
  }, [darkMode, isMobile]);

  return (
    <div className="work-experience-main-wrapper" ref={containerRef}>
      <h1 className="fixed-heading">
        <span className="orange">Destructuring </span>My Work Experience.
      </h1>
      <div className="left-column">
        <PartsAssemblingCanvas />
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
