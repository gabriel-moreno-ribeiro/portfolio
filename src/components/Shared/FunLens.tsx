import { useEffect, useRef, useState } from "react";
import useIsMobile from "../../hooks/useIsMobile";

const LENS_RADIUS = 120;
const SMALL_RADIUS = 10;

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
      const target = e.target as HTMLElement;
      overTextRef.current = !!target?.closest("[data-fun]");
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile || !overlayRef.current || !lensRef.current) return;

    const update = () => {
      const { x, y } = mouseRef.current;
      const overlay = overlayRef.current;
      const lens = lensRef.current;
      if (!overlay || !lens) return;

      const isOver = overTextRef.current;
      const r = isOver ? LENS_RADIUS : SMALL_RADIUS;

      overlay.style.clipPath = `circle(${r}px at ${x}px ${y}px)`;
      lens.style.left = `${x}px`;
      lens.style.top = `${y}px`;

      if (isOver) {
        lens.classList.add("expanded");
      } else {
        lens.classList.remove("expanded");
      }

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
      div.style.fontSize = cs.fontSize;
      div.style.fontFamily = cs.fontFamily;
      div.style.fontWeight = cs.fontWeight;
      div.style.lineHeight = cs.lineHeight;
      div.style.letterSpacing = cs.letterSpacing;
      div.style.padding = cs.padding;
      div.style.textAlign = cs.textAlign;
      div.style.display = cs.display === "flex" ? "flex" : "block";
      if (cs.display === "flex") {
        div.style.alignItems = cs.alignItems;
        div.style.justifyContent = cs.justifyContent;
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
