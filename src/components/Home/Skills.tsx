import { useInView } from "motion/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import python from "../../assets/skills/devicon/python.svg";
import typescript from "../../assets/skills/devicon/typescript.svg";
import react from "../../assets/skills/devicon/react.svg";
import nextjs from "../../assets/skills/devicon/nextjs.svg";
import nextjsDark from "../../assets/skills/devicon/nextjs-dark.svg";
import nodejs from "../../assets/skills/devicon/nodejs.svg";
import postgresql from "../../assets/skills/devicon/postgresql.svg";
import supabase from "../../assets/skills/devicon/supabase.svg";
import docker from "../../assets/skills/devicon/docker.svg";
import aws from "../../assets/skills/devicon/aws.svg";
import awsDark from "../../assets/skills/devicon/aws-dark.svg";
import git from "../../assets/skills/devicon/git.svg";
import github from "../../assets/skills/devicon/github.svg";
import githubDark from "../../assets/skills/devicon/github-dark.svg";
import vercel from "../../assets/skills/devicon/vercel.svg";
import vercelDark from "../../assets/skills/devicon/vercel-dark.svg";
import claude from "../../assets/skills/devicon/claude.svg";
import useIsMobile from "../../hooks/useIsMobile";
import { useThemeStore } from "../../store/themeStore";
import SkillsCanvas from "./SkillsCanvas";

// What a software / AI engineer reaches for today, limited to what this site's
// projects actually use (HIBEEX's stack, Python, this site's tooling). The black
// logos get a white version on the dark card.
const TOOLS: { name: string; light: string; dark?: string }[] = [
  { name: "Python", light: python },
  { name: "TypeScript", light: typescript },
  { name: "React", light: react },
  { name: "Next.js", light: nextjs, dark: nextjsDark },
  { name: "Node.js", light: nodejs },
  { name: "PostgreSQL", light: postgresql },
  { name: "Supabase", light: supabase },
  { name: "Docker", light: docker },
  { name: "AWS", light: aws, dark: awsDark },
  { name: "Git", light: git },
  { name: "GitHub", light: github, dark: githubDark },
  { name: "Vercel", light: vercel, dark: vercelDark },
  { name: "Claude", light: claude },
];

// |x| stays under ~560 so at 1440px nothing clips on the right or lands on the side nav (left gutter ≈ 195px).
const deskstopFinalPositions = [
  { x: -440, y: 0 },
  { x: 520, y: 90 },
  { x: 540, y: -60 },
  { x: -470, y: -170 },
  { x: -470, y: 240 },
  { x: 100, y: -250 },
  { x: -400, y: -300 },
  { x: 420, y: 220 },
  { x: -300, y: 0 },
  { x: 300, y: 0 },
  // extras
  { x: -150, y: -350 },
  { x: 400, y: -180 },
  { x: -330, y: 130 },
  { x: 560, y: 300 },
  { x: -60, y: 260 },
  { x: 430, y: 350 },
];

const mobileFinalPositions = [
  { x: -100, y: 120 },
  { x: 150, y: 110 },
  { x: 120, y: -150 },
  { x: -120, y: -275 },
  { x: 0, y: 325 },
  { x: 10, y: -280 },
  { x: -100, y: -150 },
  { x: 5, y: 150 },
  { x: -150, y: 300 },
  { x: 150, y: 380 },
  // extras
  { x: -145, y: 65 },
  { x: 145, y: 30 },
  { x: -60, y: 225 },
  { x: -145, y: 185 },
  { x: 145, y: -235 },
  { x: -60, y: -335 },
];

const Skills: React.FC = () => {
  const isMobile = useIsMobile();
  const { darkMode } = useThemeStore();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    margin: "0px 0px -40% 0px",
    amount: 0.1,
    once: true,
  });

  const [vpWidth, setVpWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1400
  );
  useEffect(() => {
    const onResize = () => setVpWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const finalPositions = useMemo(() => {
    if (isMobile) return mobileFinalPositions.slice(0, TOOLS.length);
    const scale = Math.max(1, vpWidth / 1400);
    return deskstopFinalPositions.slice(0, TOOLS.length).map((p) => ({
      x: p.x * scale,
      y: p.y,
    }));
  }, [isMobile, vpWidth]);

  const iconUrls = useMemo(
    () => TOOLS.map((t) => (darkMode && t.dark) || t.light),
    [darkMode],
  );

  return (
    <div className="skills-container" ref={ref} id="skills">
      <p
        className="main-text"
        data-color-inverted={"true"}
      >
        Some of the languages <br />
        & tools I build with.
      </p>
      {/* The physics playground needs a mouse and ~1000px of height; phones get the logo strip below instead. */}
      {!isMobile && (
        <SkillsCanvas
          iconUrls={iconUrls}
          finalPositions={finalPositions}
          isMobile={isMobile}
          triggerEntrance={inView}
          cardStartIndex={0}
          cardBg={darkMode ? "#211a15" : "#ffffff"}
          cardBorder={darkMode ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.08)"}
        />
      )}
      {isMobile && (
        <ul className="skills-strip" aria-hidden="true">
          {iconUrls.map((src) => (
            <li key={src}>
              <img src={src} alt="" width={40} height={40} loading="lazy" decoding="async" />
            </li>
          ))}
        </ul>
      )}
      {/* The canvas and the strip are pictures; this is the list itself */}
      <ul className="sr-only">
        {TOOLS.map((t) => <li key={t.name}>{t.name}</li>)}
      </ul>
    </div>
  );
};

export default Skills;
