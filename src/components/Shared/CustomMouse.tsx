import { useEffect, useRef } from "react";
import { useInputSourceStore } from "../../store/inputSourceStore";
import { useThemeStore } from "../../store/themeStore";

const IDLE: Partial<CSSStyleDeclaration> = {
  width: "10px",
  height: "10px",
  opacity: "1",
  mixBlendMode: "unset",
  filter: "unset",
  backgroundColor: "",
  backdropFilter: "unset",
};

function CustomMouse() {
  const { darkMode } = useThemeStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Only touch the DOM when the cursor actually changes shape: mouseover
    // fires on every element the pointer crosses.
    let currentShape = "";
    const set = (shape: string, style: Partial<CSSStyleDeclaration>, html = "") => {
      if (shape === currentShape) return;
      currentShape = shape;
      Object.assign(el.style, style);
      el.innerHTML = html;
    };

    // Hidden while the camera drives the cursor; a real mouse move brings it back
    let hidden = useInputSourceStore.getState().inputSource === "camera";
    el.style.display = hidden ? "none" : "";
    const unsub = useInputSourceStore.subscribe((s) => {
      hidden = s.inputSource === "camera";
      el.style.display = hidden ? "none" : "";
    });

    // Compositor-only move. Writing top/left forced a layout on every mousemove.
    const onMove = (e: MouseEvent) => {
      el.style.transform = `translate3d(${e.pageX}px, ${e.pageY}px, 0) translate(-50%, -50%)`;
      if (hidden) { hidden = false; el.style.display = ""; }
    };
    const onDown = () => set("down", { width: "50px", height: "50px", opacity: "0.5" });
    const onUp = () => set("up", { width: "10px", height: "10px", opacity: "1" });

    // Event delegation: works for sections that mount later (lazy-loaded) too
    const onOver = (e: MouseEvent) => {
      const t = e.target as Element;
      if (t.closest("[data-click-me]")) {
        set("click", { ...IDLE, width: "100px", height: "100px", backgroundColor: "rgba(0, 0, 0, 0.8)" }, "<p>Click Me!</p>");
      } else if (t.closest("[data-drag-me]")) {
        set("drag", { ...IDLE, width: "50px", height: "50px", backgroundColor: "var(--black)", backdropFilter: "blur(10px)", opacity: darkMode ? "0.25" : "0.8" });
      } else if (t.closest("[data-color-inverted]")) {
        set("invert", { ...IDLE, width: "80px", height: "80px", mixBlendMode: "difference", filter: darkMode ? "" : "invert(1)" });
      } else {
        set("idle", IDLE);
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("mouseover", onOver);
    return () => {
      unsub();
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseover", onOver);
      el.style.display = "";
    };
  }, [darkMode]);

  return <div ref={ref} className="custom-mouse" />;
}

export default CustomMouse;
