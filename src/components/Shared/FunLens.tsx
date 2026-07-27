import { useEffect, useRef, useState } from "react";
import useIsMobile from "../../hooks/useIsMobile";

const SMALL_RADIUS = 10;
const MIN_RADIUS = 40;
const MAX_RADIUS = 90;

interface FunItem {
  el: HTMLElement;
  fun: string;
}

function FunLens() {
  const isMobile = useIsMobile();
  const overlayRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -300, y: -300 });
  const overTextRef = useRef(false);
  const radiusRef = useRef(MIN_RADIUS);
  const rafRef = useRef<number>(0);
  const [items, setItems] = useState<FunItem[]>([]);

  useEffect(() => {
    if (isMobile) return;

    const gather = () => {
      const els = document.querySelectorAll<HTMLElement>("[data-fun]");
      const gathered: FunItem[] = [];
      els.forEach((el) => {
        const fun = el.getAttribute("data-fun");
        if (fun) gathered.push({ el, fun });
      });
      setItems(gathered);
    };

    gather();
    const interval = setInterval(gather, 2000);
    return () => clearInterval(interval);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      const target = e.target as HTMLElement | null;
      const funEl = target?.closest<HTMLElement>("[data-fun]") ?? null;
      const zoneEl = target?.closest<HTMLElement>("[data-fun-zone]") ?? null;
      overTextRef.current = !!(funEl || zoneEl);

      // Size the lens to the text being hovered: just a bit bigger than
      // the element itself, never a huge ball.
      if (funEl) {
        const h = funEl.getBoundingClientRect().height;
        radiusRef.current = Math.min(Math.max(h / 2 + 20, MIN_RADIUS), MAX_RADIUS);
      }
      // If only over a zone (gap between texts), keep the last radius so
      // the ball doesn't flicker while moving inside a section.
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile || !overlayRef.current || !lensRef.current) return;

    let currentR = SMALL_RADIUS;

    const update = () => {
      const { x, y } = mouseRef.current;
      const overlay = overlayRef.current;
      const lens = lensRef.current;
      if (!overlay || !lens) return;

      const targetR = overTextRef.current ? radiusRef.current : SMALL_RADIUS;
      // Animate radius in JS so the black ball and the clip hole are ALWAYS
      // the exact same size — no CSS transition lag, no ghost text on exit.
      currentR += (targetR - currentR) * 0.35;
      if (Math.abs(targetR - currentR) < 0.5) currentR = targetR;

      overlay.style.clipPath = `circle(${currentR}px at ${x}px ${y}px)`;
      lens.style.left = `${x}px`;
      lens.style.top = `${y}px`;
      lens.style.width = `${currentR * 2}px`;
      lens.style.height = `${currentR * 2}px`;

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <>
      <div className="fun-lens-ball" ref={lensRef} />
      <div className="fun-lens-overlay" ref={overlayRef}>
        {items.map((item, i) => (
          <FunClone key={i} el={item.el} fun={item.fun} />
        ))}
      </div>
    </>
  );
}

function FunClone({ el, fun }: { el: HTMLElement; fun: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => {
      if (!ref.current) return;
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const div = ref.current;
      div.style.position = "fixed";
      div.style.left = `${rect.left}px`;
      div.style.top = `${rect.top}px`;
      div.style.width = `${rect.width}px`;
      div.style.height = `${rect.height}px`;
      div.style.boxSizing = "border-box";
      div.style.margin = "0";
      div.style.fontSize = cs.fontSize;
      div.style.fontFamily = cs.fontFamily;
      div.style.fontWeight = cs.fontWeight;
      div.style.fontStyle = cs.fontStyle;
      div.style.lineHeight = cs.lineHeight;
      div.style.letterSpacing = cs.letterSpacing;
      div.style.textTransform = cs.textTransform;
      div.style.padding = cs.padding;
      div.style.textAlign = cs.textAlign;
      if (cs.display === "flex" || cs.display === "inline-flex") {
        div.style.display = "flex";
        div.style.flexDirection = cs.flexDirection;
        div.style.alignItems = cs.alignItems;
        div.style.justifyContent = cs.justifyContent;
        div.style.gap = cs.gap;
      } else {
        div.style.display = "block";
      }
    };

    sync();
    const interval = setInterval(sync, 100);
    const onScroll = () => sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearInterval(interval);
      window.removeEventListener("scroll", onScroll);
    };
  }, [el]);

  return (
    <div ref={ref} className="fun-clone">
      {fun}
    </div>
  );
}

export default FunLens;
