// The Desmos hobby, at the end of Cool Things: three drawings made of
// equations, side by side as a sketchbook. Each tile draws itself as it scrolls
// into view and stops on the finished drawing; a small button replays it and a
// link opens the live graph in Desmos.
import { useEffect, useRef, useState } from "react";
import { FiArrowUpRight, FiPlay, FiRotateCcw } from "react-icons/fi";
import { usePageVisible, useReducedMotion, useVisible } from "../../lib/motion";
import "../../styles/components/home/desmosSketches.scss";

type Sketch = { id: string; name: string; graphId: string };

// The recordings are long at 1x; this is the pace the drawings appear at.
const SPEED = 2.5;

const SKETCHES: Sketch[] = [
  { id: "laptop-flu", name: "Sick laptop", graphId: "axmfjf6rxv" },
  { id: "processor", name: "Chip with a screwdriver", graphId: "kk7wibzqq1" },
  { id: "fixed-bug", name: "Bug with a bandage", graphId: "gdohbfcp0i" },
];

function Tile({ sketch }: { sketch: Sketch }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // The recording is only fetched once the tile is near the viewport.
  const near = useVisible(wrapRef, { once: true, rootMargin: "300px 0px" });
  const onScreen = useVisible(wrapRef, { threshold: 0.5 });
  const pageVisible = usePageVisible();
  const reduced = useReducedMotion();
  const [ended, setEnded] = useState(false);
  // If the recording can't play here, the finished drawing underneath stays.
  const [failed, setFailed] = useState(false);

  // It draws while on screen with the tab visible, and holds the last frame
  // once it is done. With reduced motion it waits for the button.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || reduced || ended) return;
    v.playbackRate = SPEED;
    if (onScreen && pageVisible) v.play().catch(() => {});
    else v.pause();
  }, [onScreen, pageVisible, reduced, ended]);

  const replay = () => {
    const v = videoRef.current;
    if (!v) return;
    setEnded(false);
    v.currentTime = 0;
    v.playbackRate = SPEED;
    v.play().catch(() => {});
  };

  return (
    <div className="desmos__tile" ref={wrapRef}>
      <div className="desmos__frame">
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
        {near && !failed && (
          <video
            ref={videoRef}
            className="desmos__video"
            src={`/work/desmos/${sketch.id}.mp4`}
            muted
            playsInline
            preload="auto"
            onEnded={() => setEnded(true)}
            onError={() => setFailed(true)}
            aria-label={`${sketch.name} being drawn in Desmos`}
          />
        )}
        {near && !failed && (ended || reduced) && (
          <button
            type="button"
            className="desmos__badge"
            onClick={replay}
            aria-label={ended ? `Draw ${sketch.name} again` : `Watch ${sketch.name} being drawn`}
          >
            {ended ? <FiRotateCcw /> : <FiPlay />}
          </button>
        )}
      </div>
      <p className="desmos__caption">
        <span>{sketch.name}</span>
        <a
          href={`https://www.desmos.com/calculator/${sketch.graphId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Desmos <FiArrowUpRight aria-hidden="true" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
    </div>
  );
}

export default function DesmosSketches() {
  return (
    <section className="desmos" aria-labelledby="desmos-title">
      <div className="desmos__head">
        <h3 id="desmos-title">Drawings made of equations</h3>
        <p>A hobby: each one is a few dozen inequalities in Desmos. They draw themselves as you scroll past.</p>
      </div>
      <div className="desmos__grid">
        {SKETCHES.map((s) => (
          <Tile key={s.id} sketch={s} />
        ))}
      </div>
    </section>
  );
}
