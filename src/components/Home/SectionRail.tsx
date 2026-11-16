// Fixed rail on the left: one dot per section, a vertical line whose fill is the page progress,
// and the current section marked with aria-current. Replaces the inline nav that lived in Home.tsx.
// The marker is the D-20 from the Experience road: it drives along the rail with the scroll and
// stops on the last dot, where Contact has its parking spot (Rail/ParkingSpot).
import { useEffect, useRef, useState } from 'react';
import { usePageVisible, useReducedMotion } from '../../lib/motion';
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
  const truckRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const reduced = useReducedMotion();
  const pageVisible = usePageVisible();
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  // The array literal from the caller is a new object on every render; the ids are what matter.
  const key = sections.map((s) => s.id).join(',');

  // Layout is read only when it can have changed: once at mount and whenever the document
  // box resizes (lazy sections mounting, images, fonts, a wider or narrower window). Every
  // lazy section's placeholder already carries its id, so the lookups resolve from the start.
  // A scroll only compares scrollY against the cached tops. Even scrollY flushes a dirty
  // layout in Chromium, so it is read in a task queued from the scroll event, which runs
  // right after that frame has painted (layout clean); the write shows on the next frame.
  useEffect(() => {
    // Hidden tab: no listeners at all; coming back re-runs this effect, which measures again.
    if (!pageVisible) return;
    let pending = false;
    let tops: number[] = [];
    // Centre of each dot, relative to the first one (where the truck sits by default in CSS).
    let stops: number[] = [];
    let lastTruckY = -1;
    let lastY = window.scrollY;
    let docHeight = 0;
    let vh = window.innerHeight;
    let y = 0;
    let lastProgress = -1;
    const measure = () => {
      y = window.scrollY;
      vh = window.innerHeight;
      tops = sectionsRef.current.map((s) => {
        const el = document.getElementById(s.id);
        return el ? el.getBoundingClientRect().top + y : Infinity;
      });
      docHeight = document.documentElement.scrollHeight;
      const items = listRef.current ? Array.from(listRef.current.children) as HTMLElement[] : [];
      stops = items.map((li) => li.offsetTop - items[0].offsetTop);
    };
    const update = () => {
      const n = tops.length;
      const line = vh * ACTIVE_LINE;
      let idx = 0;
      for (let i = 1; i < n; i++) {
        if (tops[i] - y <= line) idx = i;
      }
      const max = docHeight - vh;
      if (max > 2 && y >= max - 2) idx = n - 1;
      setActive((prev) => (prev === idx ? prev : idx));
      const progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      const ends = (progress === 0 || progress === 1) && progress !== lastProgress;
      if (fillRef.current && (ends || Math.abs(progress - lastProgress) >= 0.002)) {
        lastProgress = progress;
        fillRef.current.style.transform = `scaleY(${progress})`;
      }
      const truck = truckRef.current;
      if (truck && stops.length === n) {
        // Between two dots the truck is as far along as the page is between the two sections.
        // Reduced motion: it only ever sits on the current dot.
        let truckY = stops[idx];
        if (!reduced && idx < n - 1) {
          const from = idx === 0 ? tops[0] + line : tops[idx];
          // A short last section never reaches the line; the page bottom stands in for it.
          const to = Math.min(tops[idx + 1], max + line);
          const frac = to > from ? Math.min(1, Math.max(0, (y + line - from) / (to - from))) : 0;
          truckY += (stops[idx + 1] - stops[idx]) * frac;
        }
        if (Math.abs(truckY - lastTruckY) >= 0.25) {
          lastTruckY = truckY;
          truck.style.transform = `translate(-50%, calc(-50% + ${truckY.toFixed(2)}px))`;
        }
        // Parked on the last dot it always faces down; small layout nudges do not turn it round.
        if (idx === n - 1) truck.dataset.dir = 'down';
        else if (Math.abs(y - lastY) > 4) truck.dataset.dir = y > lastY ? 'down' : 'up';
        lastY = y;
      }
    };
    // Only ever scheduled from a scroll or resize event, which do not fire on a hidden tab.
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      pending = false;
      y = window.scrollY;
      update();
    };
    const schedule = () => {
      if (pending) return;
      pending = true;
      channel.port2.postMessage(null);
    };
    // A height-only resize leaves the document box alone (the observer covers width changes),
    // so only the viewport height needs refreshing.
    const onResize = () => {
      vh = window.innerHeight;
      schedule();
    };
    // Runs right after layout, so these reads are already clean.
    const ro = new ResizeObserver(() => {
      measure();
      update();
    });
    measure();
    update();
    ro.observe(document.documentElement);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      channel.port1.close();
    };
  }, [key, reduced, pageVisible]);

  return (
    <nav className="section-rail" aria-label="Page sections">
      <span className="section-rail__track" aria-hidden="true">
        <span ref={fillRef} className="section-rail__fill" />
      </span>
      <span ref={truckRef} className="section-rail__truck" data-dir="down" aria-hidden="true">
        <img className="section-rail__truck-down" src="/assets/car/car-00.webp" width={44} height={44} alt="" />
        <img className="section-rail__truck-up" src="/assets/car/car-24.webp" width={44} height={44} alt="" />
      </span>
      <ul ref={listRef} className="section-rail__list">
        {sections.map((section, i) => (
          <li key={section.id}>
            <button
              type="button"
              className={`section-rail__item ${active === i ? 'section-rail__item--active' : i < active ? 'section-rail__item--passed' : ''}`}
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
