// Fixed rail on the left: one dot per section, a vertical line whose fill is the page progress,
// and the current section marked with aria-current. Replaces the inline nav that lived in Home.tsx.
import { useEffect, useRef, useState } from 'react';
import { scrollToComponent } from '../../utils/scrollToComponent';
import '../../styles/components/home/sectionRail.scss';

export interface RailSection {
  id: string;
  label: string;
}

// A section is "current" once its top crosses this line of the viewport.
const ACTIVE_LINE = 0.4;
// Gap left above a section reached from the rail (clears the navbar).
const SCROLL_OFFSET = 60;

function SectionRail({ sections }: { sections: RailSection[] }) {
  const [active, setActive] = useState(0);
  const fillRef = useRef<HTMLSpanElement>(null);
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  // The array literal from the caller is a new object on every render; the ids are what matter.
  const key = sections.map((s) => s.id).join(',');

  // Sections below the fold are lazy, so look them up on every scroll instead of
  // observing a snapshot of the DOM taken at mount.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const list = sectionsRef.current;
      const line = window.innerHeight * ACTIVE_LINE;
      let idx = 0;
      for (let i = 1; i < list.length; i++) {
        const el = document.getElementById(list[i].id);
        if (el && el.getBoundingClientRect().top <= line) idx = i;
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 2 && window.scrollY >= max - 2) idx = list.length - 1;
      setActive((prev) => (prev === idx ? prev : idx));
      if (fillRef.current) {
        const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        fillRef.current.style.transform = `scaleY(${progress})`;
      }
    };
    // rAF is only ever scheduled from a scroll or resize event, which do not fire on a hidden tab.
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
    };
  }, [key]);

  return (
    <nav className="section-rail" aria-label="Page sections">
      <span className="section-rail__track" aria-hidden="true">
        <span ref={fillRef} className="section-rail__fill" />
      </span>
      <ul className="section-rail__list">
        {sections.map((section, i) => (
          <li key={section.id}>
            <button
              type="button"
              className={`section-rail__item ${active === i ? 'section-rail__item--active' : ''}`}
              onClick={() => scrollToComponent(section.id, SCROLL_OFFSET)}
              aria-current={active === i ? 'true' : undefined}
            >
              <span className="section-rail__dot" aria-hidden="true" />
              <span className="section-rail__label">{section.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default SectionRail;
