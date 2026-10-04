import { useInView } from "motion/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import python from "../../assets/skills/devicon/python.svg";
import pytorch from "../../assets/skills/devicon/pytorch.svg";
import huggingface from "../../assets/skills/devicon/huggingface.svg";
import qwen from "../../assets/skills/devicon/qwen.svg";
import ollama from "../../assets/skills/devicon/ollama.svg";
import ollamaDark from "../../assets/skills/devicon/ollama-dark.svg";
import vllm from "../../assets/skills/devicon/vllm.svg";
import unsloth from "../../assets/skills/devicon/unsloth.svg";
import langgraph from "../../assets/skills/devicon/langgraph.svg";
import langgraphDark from "../../assets/skills/devicon/langgraph-dark.svg";
import n8n from "../../assets/skills/devicon/n8n.svg";
import fastapi from "../../assets/skills/devicon/fastapi.svg";
import typescript from "../../assets/skills/devicon/typescript.svg";
import postgresql from "../../assets/skills/devicon/postgresql.svg";
import redis from "../../assets/skills/devicon/redis.svg";
import docker from "../../assets/skills/devicon/docker.svg";
import linux from "../../assets/skills/devicon/linux.svg";
import linuxDark from "../../assets/skills/devicon/linux-dark.svg";
import useIsMobile from "../../hooks/useIsMobile";
import { useThemeStore } from "../../store/themeStore";
import SkillsCanvas from "./SkillsCanvas";

// The bench of an AI / automation engineer, below the app layer: training and
// fine-tuning (PyTorch, Unsloth), open-weight models and serving (Hugging Face,
// Qwen, Ollama, vLLM), agents and workflows (LangGraph, n8n), and the backend
// they run on. The black logos get a white version on the dark card.
const TOOLS: { name: string; light: string; dark?: string }[] = [
  { name: "Python", light: python },
  { name: "PyTorch", light: pytorch },
  { name: "Hugging Face", light: huggingface },
  { name: "Qwen", light: qwen },
  { name: "Ollama", light: ollama, dark: ollamaDark },
  { name: "vLLM", light: vllm },
  { name: "Unsloth", light: unsloth },
  { name: "LangGraph", light: langgraph, dark: langgraphDark },
  { name: "n8n", light: n8n },
  { name: "FastAPI", light: fastapi },
  { name: "TypeScript", light: typescript },
  { name: "PostgreSQL", light: postgresql },
  { name: "Redis", light: redis },
  { name: "Docker", light: docker },
  { name: "Linux", light: linux, dark: linuxDark },
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
