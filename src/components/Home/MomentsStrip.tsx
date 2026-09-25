// Two rows of photos drifting in opposite directions, right under the hero,
// so a first-time visitor sees the person before the product.
interface Moment {
  src: string;
  caption: string;
  alt: string;
}

// Every caption follows the same shape: what the photo is · place · year.
const ROW_ONE: Moment[] = [
  { src: "/moments/mv01.webp", caption: "Waterfall with the family · Missão Velha", alt: "Family at a waterfall in the Cariri valley" },
  { src: "/moments/ssa01.webp", caption: "Pineapple costume · Salvador", alt: "Gabriel as a child in a pineapple costume" },
  { src: "/moments/mv06.webp", caption: "São João festival · Missão Velha", alt: "Kids with cotton candy at a São João festival" },
  { src: "/moments/ssa06.webp", caption: "Sandboarding the dunes · Salvador", alt: "A child sandboarding down a dune" },
  { src: "/moments/mv04.webp", caption: "Summer break · Missão Velha", alt: "Gabriel as a boy holding a can of juice at night" },
  { src: "/moments/ssa05.webp", caption: "Festa junina · Salvador", alt: "Gabriel dressed for a festa junina" },
  { src: "/moments/ssa02.webp", caption: "Climbing the backyard tree · Salvador", alt: "A child climbing a tree in a backyard" },
  { src: "/moments/mv07.webp", caption: "With my brothers · Missão Velha", alt: "Gabriel and his two brothers laughing in the back of a car" },
  { src: "/moments/ssa03.webp", caption: "Rooftop afternoon · Salvador", alt: "Three kids on a rooftop in Salvador" },
];

const ROW_TWO: Moment[] = [
  { src: "/moments/for02.webp", caption: "Projeto Candela at Fundação Estudar · São Paulo · 2025", alt: "Gabriel next to his Projeto Candela poster at the Fundação Estudar annual meeting" },
  { src: "/moments/sp03.webp", caption: "HIBEEX co-founders · São Paulo · 2026", alt: "The two HIBEEX co-founders at a table" },
  { src: "/moments/for01.webp", caption: "Graduation at Ari de Sá · Fortaleza · 2025", alt: "Gabriel holding his Ari de Sá graduation yearbook" },
  { src: "/moments/hbx02.webp", caption: "WOW Aceleradora · São Paulo · 2026", alt: "The HIBEEX founders at the WOW accelerator" },
  { src: "/moments/for04.webp", caption: "Talk about Projeto Candela · Fortaleza · 2025", alt: "Gabriel speaking with a microphone" },
  { src: "/moments/sp01.webp", caption: "HIBEEX team at work · São Paulo · 2026", alt: "The HIBEEX team in an office at night" },
  { src: "/moments/for03.webp", caption: "Graduation yearbooks · Fortaleza · 2025", alt: "Gabriel and a friend holding their Ari de Sá yearbooks" },
  { src: "/moments/for05.webp", caption: "Award with the team · Fortaleza · 2025", alt: "Gabriel with classmates holding trophies" },
];

function Row({ items, reverse, duration, priority }: { items: Moment[]; reverse?: boolean; duration: number; priority?: boolean }) {
  // The track holds two copies; the animation slides exactly one copy's width.
  const doubled = [...items, ...items];
  return (
    // Under prefers-reduced-motion the row stops and becomes scrollable, so it needs a keyboard stop
    <div
      className={`moments__row ${reverse ? "moments__row--reverse" : ""}`}
      role="group"
      aria-label={reverse ? "Photos, second row" : "Photos, first row"}
      tabIndex={0}
    >
      <div className="moments__track" style={{ animationDuration: `${duration}s` }}>
        {doubled.map((m, i) => (
          <figure className="moments__item" key={`${m.src}-${i}`} aria-hidden={i >= items.length}>
            {/* The first photo of the first row is the page's LCP element */}
            <img src={m.src} alt={i < items.length ? m.alt : ""} loading={i < 5 ? "eager" : "lazy"} fetchPriority={priority && i === 0 ? "high" : undefined} decoding="async" width={300} height={220} />
            <figcaption>{m.caption}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

export default function MomentsStrip() {
  return (
    <section className="moments" id="moments" aria-label="A few moments">
      <p className="moments__eyebrow">
        <span>Salvador</span><i />
        <span>Missão Velha</span><i />
        <span>Fortaleza</span><i />
        <span>São Paulo</span>
      </p>
      <Row items={ROW_ONE} duration={75} priority />
      <Row items={ROW_TWO} duration={85} reverse />
    </section>
  );
}
