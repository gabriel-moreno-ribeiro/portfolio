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

    const set = (style: Partial<CSSStyleDeclaration>, html = "") => {
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

    const onMove = (e: MouseEvent) => {
      el.style.top = `${e.pageY}px`;
      el.style.left = `${e.pageX}px`;
      if (hidden) { hidden = false; el.style.display = ""; }
    };
    const onDown = () => set({ width: "50px", height: "50px", opacity: "0.5" });
    const onUp = () => set({ width: "10px", height: "10px", opacity: "1" });

    // Event delegation: works for sections that mount later (lazy-loaded) too
    const onOver = (e: MouseEvent) => {
      const t = e.target as Element;
      if (t.closest("[data-click-me]")) {
        set({ ...IDLE, width: "100px", height: "100px", backgroundColor: "rgba(0, 0, 0, 0.8)" }, "<p>Click Me!</p>");
      } else if (t.closest("[data-drag-me]")) {
        set({ ...IDLE, width: "50px", height: "50px", backgroundColor: "var(--black)", backdropFilter: "blur(10px)", opacity: darkMode ? "0.25" : "0.8" });
      } else if (t.closest("[data-color-inverted]")) {
        set({ ...IDLE, width: "80px", height: "80px", mixBlendMode: "difference", filter: darkMode ? "" : "invert(1)" });
      } else {
        set(IDLE);
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
