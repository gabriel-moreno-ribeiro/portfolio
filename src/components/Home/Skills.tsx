import { motion } from "motion/react";
import React, { useMemo, useRef } from "react";
import aws from "../../assets/skills/devicon/aws.svg";
import awsDark from "../../assets/skills/devicon/aws-dark.svg";
import docker from "../../assets/skills/devicon/docker.svg";
import fastapi from "../../assets/skills/devicon/fastapi.svg";
import git from "../../assets/skills/devicon/git.svg";
import huggingface from "../../assets/skills/devicon/huggingface.svg";
import jupyter from "../../assets/skills/devicon/jupyter.svg";
import langgraph from "../../assets/skills/devicon/langgraph.svg";
import langgraphDark from "../../assets/skills/devicon/langgraph-dark.svg";
import latex from "../../assets/skills/devicon/latex.svg";
import latexDark from "../../assets/skills/devicon/latex-dark.svg";
import linux from "../../assets/skills/devicon/linux.svg";
import linuxDark from "../../assets/skills/devicon/linux-dark.svg";
import matlab from "../../assets/skills/devicon/matlab.svg";
import mcp from "../../assets/skills/devicon/mcp.svg";
import mcpDark from "../../assets/skills/devicon/mcp-dark.svg";
import n8n from "../../assets/skills/devicon/n8n.svg";
import nextjs from "../../assets/skills/devicon/nextjs.svg";
import nextjsDark from "../../assets/skills/devicon/nextjs-dark.svg";
import numpy from "../../assets/skills/devicon/numpy.svg";
import ollama from "../../assets/skills/devicon/ollama.svg";
import ollamaDark from "../../assets/skills/devicon/ollama-dark.svg";
import pandas from "../../assets/skills/devicon/pandas.svg";
import pandasDark from "../../assets/skills/devicon/pandas-dark.svg";
import playwright from "../../assets/skills/devicon/playwright.svg";
import postgresql from "../../assets/skills/devicon/postgresql.svg";
import python from "../../assets/skills/devicon/python.svg";
import pytorch from "../../assets/skills/devicon/pytorch.svg";
import qwen from "../../assets/skills/devicon/qwen.svg";
import redis from "../../assets/skills/devicon/redis.svg";
import supabase from "../../assets/skills/devicon/supabase.svg";
import typescript from "../../assets/skills/devicon/typescript.svg";
import unsloth from "../../assets/skills/devicon/unsloth.svg";
import vllm from "../../assets/skills/devicon/vllm.svg";
import { useReducedMotion, useVisible } from "../../lib/motion";
import { useThemeStore } from "../../store/themeStore";

type Tool = { name: string; light: string; dark?: string };

// The bench, by what each part is for: models and how they're trained and
// served, the agents and automations built on them, the data/research side,
// and the backend everything runs on. Black logos get a white version on the
// dark card.
const GROUPS: { title: string; tools: Tool[] }[] = [
  {
    title: "Models & training",
    tools: [
      { name: "PyTorch", light: pytorch },
      { name: "Hugging Face", light: huggingface },
      { name: "Qwen", light: qwen },
      { name: "Ollama", light: ollama, dark: ollamaDark },
      { name: "vLLM", light: vllm },
      { name: "Unsloth", light: unsloth },
    ],
  },
  {
    title: "Agents & automation",
    tools: [
      { name: "LangGraph", light: langgraph, dark: langgraphDark },
      { name: "n8n", light: n8n },
      { name: "MCP", light: mcp, dark: mcpDark },
      { name: "Playwright", light: playwright },
    ],
  },
  {
    title: "Data & research",
    tools: [
      { name: "Python", light: python },
      { name: "pandas", light: pandas, dark: pandasDark },
      { name: "NumPy", light: numpy },
      { name: "Jupyter", light: jupyter },
      { name: "MATLAB", light: matlab },
      { name: "LaTeX", light: latex, dark: latexDark },
    ],
  },
  {
    title: "Backend & infra",
    tools: [
      { name: "TypeScript", light: typescript },
      { name: "Next.js", light: nextjs, dark: nextjsDark },
      { name: "FastAPI", light: fastapi },
      { name: "PostgreSQL", light: postgresql },
      { name: "Supabase", light: supabase },
      { name: "Redis", light: redis },
      { name: "Docker", light: docker },
      { name: "AWS", light: aws, dark: awsDark },
      { name: "Linux", light: linux, dark: linuxDark },
      { name: "Git", light: git },
    ],
  },
];

// Dragging needs a real pointer: on touch it would swallow the page scroll.
const canDrag =
  typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

// A tile flung away comes back on a spring, every time: nothing can stay stuck.
const SNAP_BACK = { type: "spring", stiffness: 420, damping: 22 } as const;

const Skills: React.FC = () => {
  const { darkMode } = useThemeStore();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  // The idle float only runs while the section is on screen.
  const live = useVisible(ref);

  // A small, fixed tilt per tile when it's picked up, so a drag feels physical.
  const tilts = useMemo(() => GROUPS.flatMap((g) => g.tools).map((_, i) => ((i * 37) % 11) - 5), []);
  let n = 0;

  return (
    <div
      className={`skills-container ${live && !reduced ? "is-live" : ""}`}
      ref={ref}
      id="skills"
    >
      <h2 className="main-text" data-color-inverted="true">
        Some of the languages <br />
        & tools I build with.
      </h2>

      <div className="skills__groups">
        {GROUPS.map((group) => (
          <section key={group.title} className="skills__group" aria-label={group.title}>
            <h3 className="skills__group-title">{group.title}</h3>
            <ul className="skills__list">
              {group.tools.map((tool) => {
                const i = n++;
                return (
                  <motion.li
                    key={tool.name}
                    className="skills__tool"
                    style={{ "--i": i } as React.CSSProperties}
                    data-drag-me={canDrag && !reduced ? true : undefined}
                    drag={canDrag && !reduced}
                    dragSnapToOrigin
                    dragElastic={0.5}
                    dragTransition={{ bounceStiffness: 420, bounceDamping: 22 }}
                    whileDrag={{ scale: 1.12, rotate: tilts[i], zIndex: 5 }}
                    transition={SNAP_BACK}
                  >
                    <span className="skills__card">
                      <img
                        src={(darkMode && tool.dark) || tool.light}
                        alt=""
                        width={36}
                        height={36}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    </span>
                    <span className="skills__name">{tool.name}</span>
                  </motion.li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};

export default Skills;
