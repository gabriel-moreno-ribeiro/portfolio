import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalData } from "../../lib/data";
import { useReducedMotion, useVisible } from "../../lib/motion";
import { useThemeStore } from "../../store/themeStore";
import { canvasReady, createToolbox, type Toolbox, type ToolboxItem } from "./skillsPhysics";

// `skills.json` guarda o caminho relativo; o Vite resolve a URL final.
const ICON_URLS = import.meta.glob("../../assets/skills/**/*.{webp,svg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const urlFor = (path: string): string => ICON_URLS[`../../assets/skills/${path}`] ?? "";

const HIBEEX = "hibeex";

function Skills() {
  const { skills } = useLocalData();
  const darkMode = useThemeStore((s) => s.darkMode);
  const reduced = useReducedMotion();

  const sectionRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toolboxRef = useRef<Toolbox | null>(null);

  // Um observer para nascer (uma vez só, a queda não se repete) e outro para ligar/desligar o loop.
  const entered = useVisible(sectionRef, { rootMargin: "200px 0px", once: true });
  const onScreen = useVisible(sectionRef, { rootMargin: "0px" });

  const [lit, setLit] = useState(false);
  const [running, setRunning] = useState(false);
  const [tip, setTip] = useState<{ name: string; x: number; y: number } | null>(null);

  const items = useMemo<ToolboxItem[]>(
    () =>
      skills.map((skill) => ({
        id: skill.id,
        name: skill.name || "Tool",
        src: urlFor(typeof skill.icon === "string" ? skill.icon : darkMode ? skill.icon.dark : skill.icon.light),
        card: typeof skill.icon === "string",
        lit: skill.projects.includes(HIBEEX),
      })),
    [skills, darkMode],
  );
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    if (reduced || !entered) return;
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box || !canvasReady()) return;

    let disposed = false;
    createToolbox({
      canvas,
      items: itemsRef.current,
      size: box.clientWidth < 560 ? 48 : 64,
      onHover: (name, x, y) => setTip(name ? { name, x, y } : null),
    })
      .then((toolbox) => {
        if (!toolbox) return;
        if (disposed) {
          toolbox.destroy();
          return;
        }
        toolboxRef.current = toolbox;
        setRunning(true);
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      toolboxRef.current?.destroy();
      toolboxRef.current = null;
      setRunning(false);
      setTip(null);
    };
  }, [reduced, entered]);

  useEffect(() => {
    toolboxRef.current?.setActive(onScreen);
  }, [onScreen, running]);

  useEffect(() => {
    toolboxRef.current?.setItems(items);
  }, [items]);

  useEffect(() => {
    toolboxRef.current?.setHighlight(lit);
  }, [lit, running]);

  return (
    <section className="skills" id="skills" ref={sectionRef} aria-labelledby="skills-title">
      <div className="skills__head">
        <h2 className="skills__lead" id="skills-title" data-color-inverted="true">
          Some of the languages &amp; tools I build with.
        </h2>
        <button
          type="button"
          className="skills__chip"
          aria-pressed={lit}
          onClick={() => setLit((v) => !v)}
        >
          used in HIBEEX
        </button>
      </div>

      <div className={`skills__box${running ? " is-physics" : ""}`} ref={boxRef}>
        <ul className={`skills__grid${lit ? " is-filtered" : ""}`}>
          {items.map((item) => (
            <li
              className="skills__item"
              key={item.id}
              data-lit={item.lit ? "true" : undefined}
              data-card={item.card ? "true" : undefined}
            >
              <img className="skills__icon" src={item.src} width={64} height={64} alt="" loading="lazy" />
              <span className="skills__name">{item.name}</span>
            </li>
          ))}
        </ul>
        <canvas className="skills__canvas" ref={canvasRef} aria-hidden="true" />
        {tip && (
          <span className="skills__tip" style={{ left: tip.x, top: tip.y }} aria-hidden="true">
            {tip.name}
          </span>
        )}
      </div>
    </section>
  );
}

export default Skills;
