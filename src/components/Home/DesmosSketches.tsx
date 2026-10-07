// The Desmos hobby, at the end of Cool Things. One stage: the recording of the
// chosen drawing being built, playing while it is on screen, or the live graph
// itself (the Desmos embed, loaded only when asked for). Three drawings to pick
// from underneath, as the drawings themselves.
import { useRef, useState } from "react";
import { FiArrowLeft, FiSliders } from "react-icons/fi";
import { usePageVisible, useReducedMotion, useVisible } from "../../lib/motion";
import "../../styles/components/home/desmosSketches.scss";

type Sketch = { id: string; name: string; graphId: string };

const SKETCHES: Sketch[] = [
  { id: "laptop-flu", name: "Sick laptop", graphId: "axmfjf6rxv" },
  { id: "processor", name: "Chip with a screwdriver", graphId: "kk7wibzqq1" },
  { id: "fixed-bug", name: "Bug with a bandage", graphId: "gdohbfcp0i" },
];

export default function DesmosSketches() {
  const [current, setCurrent] = useState(0);
  const [live, setLive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useVisible(ref, { threshold: 0.2 });
  const pageVisible = usePageVisible();
  const reduced = useReducedMotion();
  const sketch = SKETCHES[current];
  // The recording only runs while it can be seen; under reduced motion it waits for a press.
  const autoplay = onScreen && pageVisible && !reduced;

  return (
    <section className="desmos" aria-labelledby="desmos-title">
      <h3 id="desmos-title">Drawings made of equations</h3>
      <div className="desmos__stage" ref={ref}>
        {live ? (
          <iframe
            className="desmos__graph"
            src={`https://www.desmos.com/calculator/${sketch.graphId}?embed`}
            title={`${sketch.name}, live in Desmos`}
            allow="fullscreen"
          />
        ) : (
          <video
            key={sketch.id}
            className="desmos__video"
            src={`/work/desmos/${sketch.id}.mp4`}
            poster={`/work/desmos/${sketch.id}.webp`}
            autoPlay={autoplay}
            controls={reduced}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={`${sketch.name} being drawn in Desmos`}
          />
        )}
      </div>
      <div className="desmos__bar">
        <div className="desmos__picks" role="tablist" aria-label="Drawings">
          {SKETCHES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === current}
              className={`desmos__pick${i === current ? " is-current" : ""}`}
              onClick={() => setCurrent(i)}
            >
              <img src={`/work/desmos/${s.id}.webp`} alt={s.name} width={900} height={600} loading="lazy" decoding="async" draggable={false} />
            </button>
          ))}
        </div>
        <button type="button" className="desmos__toggle" onClick={() => setLive((v) => !v)} aria-pressed={live}>
          {live ? (
            <><FiArrowLeft aria-hidden="true" /> Back to the recording</>
          ) : (
            <><FiSliders aria-hidden="true" /> Play with the equations</>
          )}
        </button>
      </div>
    </section>
  );
}
