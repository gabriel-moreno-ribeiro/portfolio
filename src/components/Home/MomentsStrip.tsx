// Two rows of photos drifting in opposite directions, right under the hero,
// so a first-time visitor sees the person before the product.
interface Moment {
  src: string;
  caption: string;
  alt: string;
}

const ROW_ONE: Moment[] = [
  { src: "/moments/mv01.webp", caption: "Cariri waterfalls · Missão Velha", alt: "Family at a waterfall in the Cariri valley" },
  { src: "/moments/ssa01.webp", caption: "Salvador · childhood", alt: "Gabriel as a child in a pineapple costume" },
  { src: "/moments/mv06.webp", caption: "São João · Ceará", alt: "Kids with cotton candy at a São João festival" },
  { src: "/moments/ssa06.webp", caption: "Dunes · Bahia", alt: "A child sandboarding down a dune" },
  { src: "/moments/mv04.webp", caption: "Missão Velha · every summer", alt: "Gabriel as a boy holding a can of juice at night" },
  { src: "/moments/ssa05.webp", caption: "Festa junina · Salvador", alt: "Gabriel dressed for a festa junina" },
  { src: "/moments/ssa02.webp", caption: "Backyard tree · Salvador", alt: "A child climbing a tree in a backyard" },
  { src: "/moments/mv07.webp", caption: "Cousins · Missão Velha", alt: "Three kids laughing in the back of a car" },
  { src: "/moments/ssa03.webp", caption: "Salvador · Bahia", alt: "Three kids on a rooftop in Salvador" },
];

const ROW_TWO: Moment[] = [
  { src: "/moments/for02.webp", caption: "Olympiad medals · Fortaleza", alt: "Gabriel smiling with olympiad medals" },
  { src: "/moments/sp03.webp", caption: "HIBEEX co-founders · 2026", alt: "The two HIBEEX co-founders at a table" },
  { src: "/moments/for01.webp", caption: "Fundação Estudar · 2025", alt: "Gabriel holding a Fundação Estudar certificate" },
  { src: "/moments/hbx02.webp", caption: "WOW Aceleradora · São Paulo", alt: "The HIBEEX founders at the WOW accelerator" },
  { src: "/moments/for04.webp", caption: "On stage · Fortaleza", alt: "Gabriel speaking with a microphone" },
  { src: "/moments/sp01.webp", caption: "HIBEEX team · São Paulo", alt: "The HIBEEX team in an office at night" },
  { src: "/moments/for03.webp", caption: "Fortaleza · 2024–2025", alt: "Gabriel and a friend holding award plaques" },
  { src: "/moments/for05.webp", caption: "Fortaleza · 2024–2025", alt: "Gabriel with classmates" },
];

function Row({ items, reverse, duration }: { items: Moment[]; reverse?: boolean; duration: number }) {
  // The track holds two copies; the animation slides exactly one copy's width.
  const doubled = [...items, ...items];
  return (
    <div className={`moments__row ${reverse ? "moments__row--reverse" : ""}`}>
      <div className="moments__track" style={{ animationDuration: `${duration}s` }}>
        {doubled.map((m, i) => (
          <figure className="moments__item" key={`${m.src}-${i}`} aria-hidden={i >= items.length}>
            <img src={m.src} alt={i < items.length ? m.alt : ""} loading={i < 5 ? "eager" : "lazy"} decoding="async" width={300} height={220} />
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
      <Row items={ROW_ONE} duration={75} />
      <Row items={ROW_TWO} duration={85} reverse />
    </section>
  );
}
