// The Desmos hobby, at the end of Cool Things: three drawings made of
// equations, side by side as a sketchbook. Each tile is the finished drawing;
// pressing one plays the recording of it being built right there, and a link
// opens the live graph in Desmos.
import { useEffect, useRef, useState } from "react";
import { FiArrowUpRight, FiPlay, FiX } from "react-icons/fi";
import { usePageVisible, useReducedMotion, useVisible } from "../../lib/motion";
import "../../styles/components/home/desmosSketches.scss";

type Sketch = { id: string; name: string; graphId: string };

const SKETCHES: Sketch[] = [
  { id: "laptop-flu", name: "Sick laptop", graphId: "axmfjf6rxv" },
  { id: "processor", name: "Chip with a screwdriver", graphId: "kk7wibzqq1" },
  { id: "fixed-bug", name: "Bug with a bandage", graphId: "gdohbfcp0i" },
];

function Tile({ sketch, open, onToggle }: { sketch: Sketch; open: boolean; onToggle: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const onScreen = useVisible(wrapRef, { threshold: 0.3 });
  const pageVisible = usePageVisible();
  const reduced = useReducedMotion();

  // The recording runs while its tile is open and on screen.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (open && onScreen && pageVisible) v.play().catch(() => {});
    else v.pause();
  }, [open, onScreen, pageVisible]);

  return (
    <div className={`desmos__tile${open ? " is-open" : ""}`} ref={wrapRef}>
      <button
        type="button"
        className="desmos__frame"
        onClick={onToggle}
        aria-pressed={open}
        aria-label={open ? `Close the recording of ${sketch.name}` : `Watch ${sketch.name} being drawn`}
      >
        <img
          className="desmos__poster"
          src={`/work/desmos/${sketch.id}.webp`}
          alt={sketch.name}
          width={900}
          height={600}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        {open && (
          <video
            ref={videoRef}
            className="desmos__video"
            src={`/work/desmos/${sketch.id}.mp4`}
            poster={`/work/desmos/${sketch.id}.webp`}
            controls={reduced}
            muted
            loop
            playsInline
            autoPlay={!reduced}
            aria-label={`${sketch.name} being drawn in Desmos`}
          />
        )}
        <span className="desmos__badge" aria-hidden="true">
          {open ? <FiX /> : <FiPlay />}
        </span>
      </button>
      <p className="desmos__caption">
        <span>{sketch.name}</span>
        <a
          href={`https://www.desmos.com/calculator/${sketch.graphId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Play with the equations <FiArrowUpRight aria-hidden="true" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
    </div>
  );
}

export default function DesmosSketches() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="desmos" aria-labelledby="desmos-title">
      <div className="desmos__head">
        <h3 id="desmos-title">Drawings made of equations</h3>
        <p>A hobby: each one is a few dozen inequalities in Desmos. Press one to watch it being drawn.</p>
      </div>
      <div className="desmos__grid">
        {SKETCHES.map((s) => (
          <Tile key={s.id} sketch={s} open={open === s.id} onToggle={() => setOpen((o) => (o === s.id ? null : s.id))} />
        ))}
      </div>
    </section>
  );
}
