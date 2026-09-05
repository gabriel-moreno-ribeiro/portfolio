import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { forwardRef, useLayoutEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

const HorizontalSkills = forwardRef<
  HTMLDivElement,
  { icons: string[]; reverse?: boolean }
>(({ icons, reverse }, ref) => {
  useLayoutEffect(() => {
    const container = ref as React.MutableRefObject<HTMLDivElement | null>;
    if (!container.current) return;

    // Use gsap.context() so cleanup is scoped to this component only
    const ctx = gsap.context(() => {
      const el = container.current!;
      el.style.overflow = "hidden";

      const totalWidth = el.scrollWidth;
      const scrollDistance = totalWidth - el.clientWidth;

      gsap.to(el, {
        scrollLeft: scrollDistance,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 2,
          onUpdate: (self) => {
            if (self.direction > 0 && el.scrollLeft >= scrollDistance) {
              el.scrollLeft = 0;
            } else if (self.direction < 0 && el.scrollLeft <= 0) {
              el.scrollLeft = scrollDistance;
            }
          },
        },
      });
    }, container.current);

    return () => ctx.revert();
  }, [reverse, ref, icons]);

  return (
    <div
      className={`horizontal-skills-wrapper ${reverse ? "reverse" : ""}`}
      ref={ref}
    >
      {icons?.map((icon, i) => (
        <img
          src={icon}
          key={`icon-scrollable-${i}-${icon}`}
          alt=""
          className="icon"
          width={120}
          height={120}
        />
      ))}
      {/* Repeat icons for infinite looping */}
      {icons?.map((icon, i) => (
        <img
          src={icon}
          key={`icon-scrollable-duplicate-${i}-${icon}`}
          alt=""
          className="icon"
          width={120}
          height={120}
        />
      ))}
    </div>
  );
});

export default HorizontalSkills;
