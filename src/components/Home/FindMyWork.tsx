import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { toggleTerminalWindow } from "../../utils/terminalWindow";

const MEDIA_FILES = [
  "01.jpg",
  "02.jpg",
  "03.jpg",
  "04.jpg",
  "05.jpg",
  "06.jpg",
  "01.mp4",
  "02.mp4",
];

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
    desc: "Financial AI that turns messy data into decisions small business owners can act on. One of 6 startups picked for the Canastra Ventures AI Residency.",
    tags: ["TypeScript", "Next.js", "Supabase", "AWS", "AI/ML"],
  },
  {
    slug: "candela",
    title: "Projeto Candela",
    desc: "Low-cost physics lab kits used by 3,392 students in 28 public schools. Failure rates dropped from 30% to 10%.",
    tags: ["3,392 students", "28 schools", "30% to 10% failure"],
  },
  {
    slug: "rct",
    title: "Fintech Savings RCT",
    desc: "Randomized controlled trial with 208 public-school students on fintech tools and savings behavior, advised by Aaron Litvin, Ph.D. (Harvard). Treatment group saved 130% more.",
    tags: ["RCT design", "208 students", "+130% savings", "Python"],
  },
  {
    slug: "medals",
    title: "39 Olympiad Medals (19 Gold)",
    desc: "49 olympiads in math, physics, chemistry and astronomy. 1st of 10,000+ at IFT-UNESP. Gold at ONNEQ (top 0.675%). 1st at OBAQ (top 0.014%).",
    tags: ["19 gold", "2 international", "1st IFT-UNESP"],
  },
  {
    slug: "kinetics",
    title: "Chemical Kinetics Research",
    desc: "Reaction mechanisms modeled with 97% accuracy in a 59-page thesis under Prof. Juliano Bonacin, Ph.D.",
    tags: ["97% accuracy", "MATLAB", "Mathematica", "LaTeX"],
  },
  {
    slug: "gsat",
    title: "GSAT Education",
    desc: "EdTech platform for standardized test prep — built from scratch as founding CEO.",
    tags: ["React", "TypeScript", "Node.js", "EdTech"],
  },
];

function MediaCarousel({ slug, title }: { slug: string; title: string }) {
  const [loaded, setLoaded] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let alive = true;
    MEDIA_FILES.forEach((file) => {
      const url = `/work/${slug}/${file}`;
      if (file.endsWith(".mp4")) {
        const probe = document.createElement("video");
        probe.preload = "metadata";
        probe.onloadedmetadata = () => {
          if (alive) setLoaded((prev) => [...prev, file]);
        };
        probe.src = url;
      } else {
        const probe = new Image();
        probe.onload = () => {
          if (alive) setLoaded((prev) => [...prev, file]);
        };
        probe.src = url;
      }
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  const available = MEDIA_FILES.filter((f) => loaded.includes(f));

  if (available.length === 0) {
    return (
      <div className="media-carousel media-placeholder">
        <span>📷</span>
        <small>
          Photos & videos coming soon — drop files in <code>/work/{slug}/</code>
        </small>
      </div>
    );
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
        The most important things I've built and won.
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
