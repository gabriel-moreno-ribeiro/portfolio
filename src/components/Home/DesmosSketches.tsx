// The Desmos hobby, at the end of Cool Things: one sheet of graph paper with the
// three drawings on it, each with one real equation from the graph and what it
// draws. Pressing a drawing plays the recording of it being built, framed to
// the graph area; the link opens the graph itself.
import { useState } from "react";
import { FiArrowUpRight, FiPlay, FiSquare } from "react-icons/fi";
import "../../styles/components/home/desmosSketches.scss";

type Sketch = {
  id: string;
  name: string;
  graph: string;
  /** One equation from the graph, as typeset HTML */
  equation: React.ReactNode;
};

const SKETCHES: Sketch[] = [
  {
    id: "laptop-flu",
    name: "Sick Laptop",
    graph: "https://www.desmos.com/calculator/axmfjf6rxv",
    equation: (
      <>(<i>x</i>/2.85)<sup>6</sup> + ((<i>y</i> − 1.78)/1.92)<sup>6</sup> ≤ 1</>
    ),
  },
  {
    id: "processor",
    name: "Chip with a screwdriver",
    graph: "https://www.desmos.com/calculator/kk7wibzqq1",
    equation: (
      <>(<i>x</i>/2.1)<sup>6</sup> + ((<i>y</i> + 0.3)/1.8)<sup>6</sup> ≤ 1</>
    ),
  },
  {
    id: "fixed-bug",
    name: "Bug with a bandage",
    graph: "https://www.desmos.com/calculator/gdohbfcp0i",
    equation: (
      <>(<i>x</i>/2.1)<sup>2</sup> + ((<i>y</i> + 0.55)/1.9)<sup>2</sup> ≤ 1</>
    ),
  },
];

function SketchPlot({ sketch }: { sketch: Sketch }) {
  // The video only exists while it plays: nothing downloads until someone asks.
  const [playing, setPlaying] = useState(false);
  return (
    <figure className={`sketch${playing ? " is-playing" : ""}`}>
      <button
        type="button"
        className="sketch__plot"
        onClick={() => setPlaying((p) => !p)}
        aria-pressed={playing}
        aria-label={playing ? `Stop the ${sketch.name} recording` : `Watch the ${sketch.name} being drawn`}
      >
        <img
          src={`/work/desmos/${sketch.id}.webp`}
          alt={sketch.name}
          width={900}
          height={600}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        {playing && (
          <span className="sketch__screen">
            <video
              src={`/work/desmos/${sketch.id}.mp4`}
              autoPlay
              muted
              playsInline
              onEnded={() => setPlaying(false)}
              aria-hidden="true"
            />
          </span>
        )}
        <span className="sketch__control" aria-hidden="true">
          {playing ? <FiSquare /> : <FiPlay />}
        </span>
      </button>
      <figcaption>
        <span className="sketch__name">{sketch.name}</span>
        <span className="sketch__eq">{sketch.equation}</span>
        <a className="sketch__open" href={sketch.graph} target="_blank" rel="noopener noreferrer">
          Open the graph <FiArrowUpRight aria-hidden="true" />
        </a>
      </figcaption>
    </figure>
  );
}

export default function DesmosSketches() {
  return (
    <section className="sketchbook" aria-labelledby="sketchbook-title">
      <div className="sketchbook__head">
        <h3 id="sketchbook-title">Drawings made of equations</h3>
      </div>
      <div className="sketchbook__sheet">
        {SKETCHES.map((s) => (
          <SketchPlot key={s.id} sketch={s} />
        ))}
      </div>
    </section>
  );
}
