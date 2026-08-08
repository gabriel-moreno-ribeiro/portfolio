import { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { toggleTerminalWindow } from "../../utils/terminalWindow";

// Static manifest of media that actually exists in public/work/<slug>/.
// Add entries here when uploading media — avoids speculative 404 probing.
const WORK_MEDIA_MANIFEST: Record<string, string[]> = {
  // hibeex: ["01.jpg", "02.jpg"],
  // candela: ["01.jpg"],
};

interface FeaturedItem {
  slug: string;
  title: string;
  desc: string;
  tags: string[];
}

const featured: FeaturedItem[] = [
  {
    slug: "hibeex",
    title: "HIBEEX — Financial AI for SMBs",
    desc: "Financial AI for small businesses. Raw data in, decisions out. One of 6 startups in the Canastra Ventures AI Residency.",
    tags: ["TypeScript", "Next.js", "Supabase", "AWS", "AI/ML"],
  },
  {
    slug: "candela",
    title: "Projeto Candela",
    desc: "Personally built and distributed low-cost physics lab kits to 28 public schools. 3,392 students reached. Failure rates: 30% down to 10%.",
    tags: ["3,392 students", "28 schools", "30% → 10%"],
  },
  {
    slug: "medals",
    title: "39 Olympiad Medals (19 Gold)",
    desc: "49 competitions in math, physics, chemistry, and astronomy. 1st of 10,000+ at IFT-UNESP. Gold at ONNEQ. 1st at OBAQ.",
    tags: ["19 gold", "2 international", "1st IFT-UNESP"],
  },
  {
    slug: "gsat",
    title: "GSAT Education",
    desc: "EdTech platform for standardized test prep, built from scratch as founding CEO.",
    tags: ["React", "TypeScript", "Node.js", "EdTech"],
  },
];

function MediaCarousel({ slug, title }: { slug: string; title: string }) {
  const available = WORK_MEDIA_MANIFEST[slug] ?? [];
  const [idx, setIdx] = useState(0);

  if (available.length === 0) {
    return null;
  }

  const current = available[idx % available.length];
  const src = `/work/${slug}/${current}`;
  const prev = () =>
    setIdx((i) => (i - 1 + available.length) % available.length);
  const next = () => setIdx((i) => (i + 1) % available.length);

  return (
    <div className="media-carousel">
      {current.endsWith(".mp4") ? (
        <video key={src} src={src} controls playsInline />
      ) : (
        <img key={src} src={src} alt={title} loading="lazy" />
      )}
      {available.length > 1 && (
        <>
          <button className="carousel-arrow left" onClick={prev} aria-label="Previous">
            <FiChevronLeft />
          </button>
          <button className="carousel-arrow right" onClick={next} aria-label="Next">
            <FiChevronRight />
          </button>
          <div className="carousel-dots">
            {available.map((f, i) => (
              <span
                key={f}
                className={i === idx % available.length ? "dot active" : "dot"}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FeaturedCard({ item }: { item: FeaturedItem }) {
  return (
    <div className="featured-card">
      <MediaCarousel slug={item.slug} title={item.title} />
      <h2>{item.title}</h2>
      <p>{item.desc}</p>
      <div className="featured-tags">
        {item.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </div>
  );
}

function FindMyWork() {
  return (
    <div className="find-my-work" id="work">
      <h1 className="heading" data-color-inverted={"true"}>
        Find My Work
      </h1>
      <p className="work-sub">
        What I've built and what I've won.
      </p>
      <button className="terminal-launch" onClick={toggleTerminalWindow}>
        {"> Open Terminal (floats anywhere — Ctrl+J)"}
      </button>
      <div className="featured-grid">
        {featured.map((item) => (
          <FeaturedCard key={item.slug} item={item} />
        ))}
      </div>
    </div>
  );
}

export default FindMyWork;
