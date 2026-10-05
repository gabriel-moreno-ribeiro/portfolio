import { useInView } from "motion/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import useIsMobile from "../../hooks/useIsMobile";
import { useReducedMotion } from "../../lib/motion";
import { useInputSourceStore } from "../../store/inputSourceStore";
import { useThemeStore } from "../../store/themeStore";

type Tool = { name: string; light: string; dark?: string };

// Models and training, agents and automation, data and research, then the
// backend everything runs on. Black logos get a white version on dark cards.
const TOOLS: Tool[] = [
  { name: "Python", light: python },
  { name: "PyTorch", light: pytorch },
  { name: "Hugging Face", light: huggingface },
  { name: "Qwen", light: qwen },
  { name: "Ollama", light: ollama, dark: ollamaDark },
  { name: "vLLM", light: vllm },
  { name: "Unsloth", light: unsloth },
  { name: "LangGraph", light: langgraph, dark: langgraphDark },
  { name: "n8n", light: n8n },
  { name: "MCP", light: mcp, dark: mcpDark },
  { name: "Playwright", light: playwright },
  { name: "pandas", light: pandas, dark: pandasDark },
  { name: "NumPy", light: numpy },
  { name: "Jupyter", light: jupyter },
  { name: "MATLAB", light: matlab },
  { name: "LaTeX", light: latex, dark: latexDark },
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
];

// Rest positions around the title, from the field's centre (best-candidate
// sampling: at least 147px apart, clear of the title and the corner buttons).
// x stretches with the viewport past 1400px, as before.
const REST = [
  { x: -190, y: -279 }, { x: 414, y: 390 }, { x: -504, y: 392 }, { x: 538, y: -396 },
  { x: -56, y: 201 }, { x: 292, y: -50 }, { x: -504, y: -18 }, { x: 130, y: -348 },
  { x: -538, y: -343 }, { x: 530, y: 128 }, { x: 140, y: 367 }, { x: -328, y: 203 },
  { x: 539, y: -132 }, { x: -263, y: -16 }, { x: 19, y: -125 }, { x: 286, y: 187 },
  { x: -182, y: 395 }, { x: 357, y: -269 }, { x: -409, y: -181 }, { x: -532, y: 175 },
  { x: -313, y: -391 }, { x: 114, y: 168 }, { x: -31, y: -308 }, { x: -126, y: -145 },
  { x: 470, y: 250 }, { x: 178, y: -173 },
];

// --- Physics (per 60fps frame; scaled by real frame time) ---
const SPRING_K = 0.08;
const DAMPING = 0.82;
const TRAIL_LERP = 0.14;
const TRAIL_SPACING = 7; // frames of cursor history between two cards in the trail
const HISTORY = TOOLS.length * TRAIL_SPACING + 8;
const ENTRANCE_MS = 500;
const STAGGER_MS = 45;

const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

type Card = { x: number; y: number; vx: number; vy: number; rx: number; ry: number; s: number };

/**
 * The playground: the cards burst out of the title, follow the cursor in a
 * trail while it moves over the section, and spring back home when it leaves
 * or clicks. Plain elements moved with transforms (no full-screen canvas to
 * repaint), and the loop sleeps as soon as everything is at rest, so the
 * section costs nothing while you read it.
 */
function Playground({ urls, enter, still }: { urls: string[]; enter: boolean; still: boolean }) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const cardEls = useRef<(HTMLSpanElement | null)[]>([]);
  const cards = useRef<Card[]>(REST.map((p) => ({ x: 0, y: 0, vx: 0, vy: 0, rx: p.x, ry: p.y, s: 0 })));
  const mode = useRef<"waiting" | "entering" | "trail" | "return" | "rest">("waiting");
  const enteredAt = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const history = useRef<{ x: number; y: number }[]>([]);
  const chain = useRef<number[]>([]);
  const raf = useRef(0);
  const last = useRef(0);
  const visible = useRef(false);
  const restingFrames = useRef(0); // frames the cursor hasn't moved while trailing

  const paint = () => {
    const list = cards.current;
    for (let i = 0; i < list.length; i++) {
      const el = cardEls.current[i];
      const c = list[i];
      if (el) el.style.transform = `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0) scale(${c.s.toFixed(3)})`;
    }
  };

  const step = (now: number) => {
    raf.current = 0;
    if (!visible.current) return;
    const dt = last.current ? Math.min(now - last.current, 64) : 16.7;
    last.current = now;
    const f = dt / 16.7; // 1 at 60fps
    const list = cards.current;
    let keepGoing = true;

    // Hand tracking (camera mode) drives the trail like a cursor
    const input = useInputSourceStore.getState();
    if (input.inputSource === "camera" && mode.current !== "waiting" && mode.current !== "entering") {
      const hand = input.handPositions[0];
      const rect = fieldRef.current?.getBoundingClientRect();
      if (hand && rect && hand.fingers <= 3 && !hand.isPinching && !hand.isScrolling) {
        pointer.current = {
          x: ((hand.x + 1) / 2) * window.innerWidth - rect.left - rect.width / 2,
          y: ((hand.y + 1) / 2) * window.innerHeight - rect.top - rect.height / 2,
        };
        if (mode.current !== "trail") startTrail();
      } else if (mode.current === "trail") {
        endTrail();
      }
    }

    if (mode.current === "entering") {
      const t0 = now - enteredAt.current;
      let done = true;
      list.forEach((c, i) => {
        const t = Math.min(Math.max((t0 - i * STAGGER_MS) / ENTRANCE_MS, 0), 1);
        if (t < 1) done = false;
        const e = easeOutBack(t);
        c.x = c.rx * e;
        c.y = c.ry * e;
        c.s = t === 0 ? 0 : t < 0.5 ? 1.5 * (t * 2) : 1.5 - 0.5 * ((t - 0.5) * 2);
      });
      if (done) {
        list.forEach((c) => { c.x = c.rx; c.y = c.ry; c.s = 1; c.vx = 0; c.vy = 0; });
        mode.current = "rest";
      }
    } else if (mode.current === "trail") {
      restingFrames.current += 1;
      const h = history.current;
      h.push({ ...pointer.current });
      if (h.length > HISTORY) h.shift();
      if (chain.current.length === 0) {
        chain.current = list
          .map((c, i) => ({ i, d: Math.hypot(c.x - pointer.current.x, c.y - pointer.current.y) }))
          .sort((a, b) => a.d - b.d)
          .map((e) => e.i);
      }
      const k = 1 - Math.pow(1 - TRAIL_LERP, f);
      chain.current.forEach((idx, rank) => {
        const target = h[h.length - 1 - rank * TRAIL_SPACING];
        if (!target) return;
        const c = list[idx];
        c.x += (target.x - c.x) * k;
        c.y += (target.y - c.y) * k;
        c.vx = 0;
        c.vy = 0;
      });
    } else if (mode.current === "return") {
      let settled = true;
      const damp = Math.pow(DAMPING, f);
      for (const c of list) {
        c.vx = (c.vx + (c.rx - c.x) * SPRING_K * f) * damp;
        c.vy = (c.vy + (c.ry - c.y) * SPRING_K * f) * damp;
        c.x += c.vx * f;
        c.y += c.vy * f;
        if (Math.abs(c.rx - c.x) > 0.3 || Math.abs(c.ry - c.y) > 0.3 || Math.abs(c.vx) > 0.05 || Math.abs(c.vy) > 0.05) settled = false;
      }
      if (settled) {
        list.forEach((c) => { c.x = c.rx; c.y = c.ry; c.vx = 0; c.vy = 0; });
        mode.current = "rest";
      }
    }

    paint();
    // Asleep once everything is home, or once the trail has caught up with a
    // cursor that stopped; unless the camera is steering
    if (input.inputSource !== "camera") {
      if (mode.current === "rest") keepGoing = false;
      if (mode.current === "trail" && restingFrames.current > HISTORY + 90) keepGoing = false;
    }
    if (keepGoing) wake();
  };

  const wake = () => {
    if (!raf.current && visible.current) raf.current = requestAnimationFrame(step);
  };

  function startTrail() {
    if (mode.current === "waiting" || mode.current === "entering" || still) return;
    restingFrames.current = 0;
    if (mode.current !== "trail") {
      mode.current = "trail";
      chain.current = [];
      history.current = [];
    }
    wake();
  }

  function endTrail() {
    if (mode.current !== "trail") return;
    // Never left where the cursor dropped them: they always spring back home.
    mode.current = "return";
    chain.current = [];
    history.current = [];
    wake();
  }

  // Rest positions stretch with wide viewports
  useEffect(() => {
    const place = () => {
      const scale = Math.max(1, window.innerWidth / 1400);
      cards.current.forEach((c, i) => { c.rx = REST[i].x * scale; c.ry = REST[i].y; });
      if (mode.current === "rest") {
        cards.current.forEach((c) => { c.x = c.rx; c.y = c.ry; });
        paint();
      }
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, []);

  // Only runs while on screen
  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      if (e.isIntersecting) { last.current = 0; wake(); }
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf.current); raf.current = 0; };
  }, []);

  // Entrance once the section is reached; with reduced motion they're simply home
  useEffect(() => {
    if (still && mode.current === "waiting") {
      cards.current.forEach((c) => { c.x = c.rx; c.y = c.ry; c.s = 1; });
      mode.current = "rest";
      paint();
      return;
    }
    if (enter && mode.current === "waiting") {
      mode.current = "entering";
      enteredAt.current = performance.now();
      wake();
    }
  }, [enter, still]);

  // Camera mode needs the loop awake to read the hand
  useEffect(() => useInputSourceStore.subscribe((s) => { if (s.inputSource === "camera") wake(); }), []);

  const toLocal = (e: React.PointerEvent) => {
    const r = fieldRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
  };

  return (
    <div
      ref={fieldRef}
      className="skills-field"
      aria-hidden="true"
      onPointerMove={(e) => { pointer.current = toLocal(e); startTrail(); }}
      onPointerLeave={endTrail}
      onPointerCancel={endTrail}
      onClick={endTrail}
    >
      {urls.map((src, i) => (
        <span
          key={TOOLS[i].name}
          ref={(el) => { cardEls.current[i] = el; }}
          className="skills-orb"
          style={{ transform: "translate3d(0, 0, 0) scale(0)" }}
        >
          <span className="skills-orb__card" style={{ "--i": i } as React.CSSProperties}>
            <img src={src} alt="" width={48} height={48} draggable={false} decoding="async" />
          </span>
        </span>
      ))}
    </div>
  );
}

const Skills: React.FC = () => {
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const { darkMode } = useThemeStore();
  const ref = useRef<HTMLDivElement>(null);
  const enter = useInView(ref, { margin: "0px 0px -40% 0px", amount: 0.1, once: true });
  const [live, setLive] = useState(false);

  // The idle bob only while the section is on screen
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const urls = useMemo(() => TOOLS.map((t) => (darkMode && t.dark) || t.light), [darkMode]);

  return (
    <div
      className={`skills-container${live && !reduced ? " is-live" : ""}`}
      ref={ref}
      id="skills"
    >
      <h2 className="main-text" data-color-inverted="true">
        Some of the languages <br />
        & tools I build with.
      </h2>
      {/* The playground needs a pointer and ~1000px; phones get the strip. With
          reduced motion the cards simply sit at home. */}
      {!isMobile && <Playground urls={urls} enter={enter} still={reduced} />}
      {isMobile && (
        <ul className="skills-strip" aria-hidden="true">
          {urls.map((src, i) => (
            <li key={TOOLS[i].name}>
              <img src={src} alt="" width={40} height={40} loading="lazy" decoding="async" />
            </li>
          ))}
        </ul>
      )}
      <ul className="sr-only">
        {TOOLS.map((t) => <li key={t.name}>{t.name}</li>)}
      </ul>
    </div>
  );
};

export default Skills;
