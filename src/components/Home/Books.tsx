import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Book {
  title: string;
  author: string;
  cover: string;
  stars: number;
  year: string;
  startedAge?: number;
  finishedAge?: number;
  review?: string;
  color: string;
}

function optPath(cover: string, width: number, fmt: "avif" | "webp") {
  const stem = cover.replace(/^\/books\//, "").replace(/\.[^.]+$/, "");
  return `/optimized/books/${stem}-${width}w.${fmt}`;
}

const BOOKS: Book[] = [
  { title: "Manual do Mundo", author: "Iberê Thenório", cover: "/books/manual-do-mundo.webp", stars: 5, year: "2014 – 2015", startedAge: 7, finishedAge: 8, review: "Opened my eyes to science as play. Every page made me want to try an experiment at home.", color: "emerald" },
  { title: "How to Train Your Dragon", author: "Cressida Cowell", cover: "/books/how-to-train-your-dragon.jpg", stars: 4, year: "2016 – 2017", startedAge: 9, finishedAge: 10, review: "Pure adventure. The underdog story stuck with me long before I knew what startups were.", color: "sky" },
  { title: "Percy Jackson", author: "Rick Riordan", cover: "/books/percy-jackson.png", stars: 5, year: "2017 – 2018", startedAge: 10, finishedAge: 11, review: "Made Greek mythology feel alive. Read the whole series in two months — couldn't stop.", color: "blue" },
  { title: "A Ilha do Tesouro", author: "Robert Louis Stevenson", cover: "/books/ilha-do-tesouro.webp", stars: 5, year: "2017 – 2018", startedAge: 10, finishedAge: 11, review: "Classic treasure hunt that taught me storytelling can be just as thrilling as any movie.", color: "amber" },
  { title: "Harry Potter", author: "J.K. Rowling", cover: "/books/harry-potter.jpg", stars: 5, year: "2018 – 2019", startedAge: 11, finishedAge: 12, review: "The series that made reading an obsession. Hogwarts still feels like a second home.", color: "purple" },
  { title: "O Pijama Listrado", author: "John Boyne", cover: "/books/pijama-listrado.jpg", stars: 5, year: "2018 – 2019", startedAge: 11, finishedAge: 12, review: "Hit me like a train at 11. First book that made me cry and question humanity.", color: "slate" },
  { title: "Auto da Compadecida", author: "Ariano Suassuna", cover: "/books/auto-da-compadecida.jpg", stars: 5, year: "2018 – 2019", startedAge: 11, finishedAge: 12, review: "Brazilian humor at its peak. João Grilo is the most clever character I've ever read.", color: "orange" },
  { title: "O Extraordinário", author: "R.J. Palacio", cover: "/books/extraordinario.webp", stars: 5, year: "2019 – 2020", startedAge: 12, finishedAge: 13, review: "A masterclass in empathy. Changed how I treat people who look different.", color: "teal" },
  { title: "Dom Casmurro", author: "Machado de Assis", cover: "/books/dom-casmurro.jpg", stars: 4, year: "2020 – 2021", startedAge: 13, finishedAge: 14, review: "Still can't decide if Capitu betrayed him. Machado plays with your mind brilliantly.", color: "stone" },
  { title: "Memórias Póstumas de Brás Cubas", author: "Machado de Assis", cover: "/books/bras-cubas.jpg", stars: 4, year: "2020 – 2021", startedAge: 13, finishedAge: 14, review: "A dead man narrating his own life with sarcasm. Way ahead of its time.", color: "zinc" },
  { title: "Física — Renato Brito Vol. 1", author: "Renato Brito", cover: "/books/rb.webp", stars: 5, year: "2021 – 2022", startedAge: 14, finishedAge: 15, review: "Built my physics foundation from scratch. Every problem solved felt like leveling up.", color: "indigo" },
  { title: "Física — Renato Brito Vol. 2", author: "Renato Brito", cover: "/books/rb2.png", stars: 5, year: "2021 – 2022", startedAge: 14, finishedAge: 15, review: "Electromagnetism and thermodynamics finally clicked. Dense but rewarding.", color: "indigo" },
  { title: "Tópicos de Física", author: "Gualter, Helou & Nicolau", cover: "/books/topicos.jpg", stars: 4, year: "2021 – 2022", startedAge: 14, finishedAge: 15, review: "The classic Brazilian physics textbook. Good problem sets, solid explanations.", color: "green" },
  { title: "Duna", author: "Frank Herbert", cover: "/books/Duna1.jpg", stars: 5, year: "2021 – 2022", startedAge: 14, finishedAge: 15, review: "Politics, ecology, religion, power — all woven into one universe. A life-changing read.", color: "amber" },
  { title: "Frankenstein", author: "Mary Shelley", cover: "/books/frankenstein.webp", stars: 4, year: "2022 – 2023", startedAge: 15, finishedAge: 16, review: "Not the monster story I expected. It's about loneliness and what we owe our creations.", color: "emerald" },
  { title: "Fahrenheit 451", author: "Ray Bradbury", cover: "/books/farenheit.jpg", stars: 5, year: "2022 – 2023", startedAge: 15, finishedAge: 16, review: "Terrifyingly relevant. Made me protective of books and ideas.", color: "red" },
  { title: "Brave New World", author: "Aldous Huxley", cover: "/books/admiravel-mundo-novo.jpg", stars: 5, year: "2022 – 2023", startedAge: 15, finishedAge: 16, review: "More prophetic than Orwell in many ways. Pleasure as a tool of control — chilling.", color: "violet" },
  { title: "Atkins Physical Chemistry", author: "Peter Atkins", cover: "/books/atkins.webp", stars: 4, year: "2023 – 2024", startedAge: 16, finishedAge: 17, review: "University-level pchem at 16. Hard but it gave me the theoretical depth for my research thesis.", color: "cyan" },
  { title: "The Martian", author: "Andy Weir", cover: "/books/the-martian.jpg", stars: 5, year: "2023 – 2024", startedAge: 16, finishedAge: 17, review: "Engineering as survival. Watney's problem-solving mindset is pure founder energy.", color: "orange" },
  { title: "Project Hail Mary", author: "Andy Weir", cover: "/books/project-hail-mary.webp", stars: 5, year: "2023 – 2024", startedAge: 16, finishedAge: 17, review: "Even better than The Martian. Rocky is the best fictional friend I've ever made.", color: "fuchsia" },
  { title: "Surely You're Joking, Mr. Feynman!", author: "Richard Feynman", cover: "/books/feynman.jpg", stars: 5, year: "2023 – 2024", startedAge: 16, finishedAge: 17, review: "Feynman's curiosity is infectious. Made me realize the best scientists are also artists.", color: "rose" },
  { title: "The Complete Sherlock Holmes", author: "Arthur Conan Doyle", cover: "/books/sherlock-holmes.webp", stars: 5, year: "2024 – 2025", startedAge: 17, finishedAge: 18, review: "1,000+ pages of pure deduction. Trained my brain to notice details everyone misses.", color: "neutral" },
  { title: "The Official SAT Study Guide", author: "College Board", cover: "/books/the-official-sat-study-guide.webp", stars: 4, year: "2024 – 2025", startedAge: 17, finishedAge: 18, review: "Not fun to read, but the discipline of grinding 8 practice tests paid off.", color: "slate" },
  { title: "The Wolf of Wall Street", author: "Jordan Belfort", cover: "/books/wolf-of-wall-street.webp", stars: 5, year: "2024 – 2025", startedAge: 17, finishedAge: 18, review: "A cautionary tale disguised as a wild ride. Taught me what NOT to do with money and power.", color: "green" },
  { title: "Catching the Wolf of Wall Street", author: "Jordan Belfort", cover: "/books/catching-wolf.webp", stars: 4, year: "2024 – 2025", startedAge: 17, finishedAge: 18, review: "The downfall is more interesting than the rise. Accountability comes for everyone.", color: "lime" },
  { title: "The Way of the Wolf", author: "Jordan Belfort", cover: "/books/way-of-the-wolf.webp", stars: 5, year: "2024 – 2025", startedAge: 17, finishedAge: 18, review: "Straight-line selling stripped to its core. I use these frameworks pitching HIBEEX daily.", color: "yellow" },
  { title: "Zero to One", author: "Peter Thiel", cover: "/books/zero-to-one.webp", stars: 5, year: "2025 – 2026", startedAge: 18, finishedAge: 18, review: "The most important book for any founder. Monopoly thinking changed how I build HIBEEX.", color: "blue" },
  { title: "Made in America", author: "Sam Walton", cover: "/books/made-in-america.webp", stars: 5, year: "2025 – 2026", startedAge: 18, finishedAge: 18, review: "Humility + obsessive customer focus = Walmart. Sam's principles are timeless for any company.", color: "red" },
];

const colorMap: Record<string, string> = {
  slate: "#475569", gray: "#6b7280", zinc: "#71717a", neutral: "#737373",
  stone: "#78716c", red: "#dc2626", orange: "#ea580c", amber: "#d97706",
  yellow: "#ca8a04", lime: "#65a30d", green: "#16a34a", emerald: "#059669",
  teal: "#0d9488", cyan: "#0891b2", sky: "#0284c7", blue: "#2563eb",
  indigo: "#4f46e5", violet: "#7c3aed", purple: "#9333ea", fuchsia: "#c026d3",
  pink: "#db2777", rose: "#e11d48",
};

const colorMapDark: Record<string, string> = {
  slate: "#1e293b", gray: "#1f2937", zinc: "#27272a", neutral: "#262626",
  stone: "#292524", red: "#7f1d1d", orange: "#7c2d12", amber: "#78350f",
  yellow: "#713f12", lime: "#1a2e05", green: "#052e16", emerald: "#022c22",
  teal: "#042f2e", cyan: "#083344", sky: "#082f49", blue: "#1e3a5f",
  indigo: "#1e1b4b", violet: "#2e1065", purple: "#3b0764", fuchsia: "#4a044e",
  pink: "#500724", rose: "#4c0519",
};

function Stars({ count }: { count: number }) {
  return (
    <div className="book-modal__stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={`book-modal__star ${i < count ? "book-modal__star--filled" : ""}`}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function BookSpine({ book, index, onClick }: { book: Book; index: number; onClick: () => void }) {
  const tilt = [0.4, -0.3, 0.5, -0.4, 0.3, -0.6, 0.5, -0.3, 0.4, -0.5][index % 10];
  const h = [192, 182, 198, 186, 204, 178, 196, 184, 200, 176][index % 10];
  const bgColor = colorMap[book.color] || colorMap.blue;

  return (
    <motion.button
      className="book-spine"
      style={{
        "--tilt": `${tilt}deg`,
        "--h": `${h}px`,
        "--book-color": bgColor,
      } as React.CSSProperties}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ delay: index * 0.025, duration: 0.35 }}
      onClick={onClick}
      aria-label={`View details for ${book.title}`}
    >
      <div className="book-spine__face">
        <span className="book-spine__title">{book.title}</span>
      </div>
      <div className="book-spine__edge" />
    </motion.button>
  );
}

function BookModal({ book, onClose }: { book: Book; onClose: () => void }) {
  const bgColor = colorMap[book.color] || colorMap.blue;
  const bgDark = colorMapDark[book.color] || colorMapDark.blue;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      className="book-modal__backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      <motion.div
        className="book-modal"
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="book-modal__close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="book-modal__content">
          {/* Book cover with 3D effect */}
          <div className="book-modal__cover-wrapper">
            <div className="book-modal__cover-3d" style={{ "--cover-color": bgColor, "--cover-color-dark": bgDark } as React.CSSProperties}>
              <div className="book-modal__cover-front">
                <picture>
                  <source srcSet={`${optPath(book.cover, 240, "avif")} 240w`} type="image/avif" />
                  <source srcSet={`${optPath(book.cover, 240, "webp")} 240w`} type="image/webp" />
                  <img src={book.cover} alt={book.title} loading="eager" />
                </picture>
              </div>
              <div className="book-modal__cover-spine" />
              <div className="book-modal__cover-top" />
            </div>
          </div>

          {/* Book info */}
          <div className="book-modal__info">
            <h3 className="book-modal__title">{book.title}</h3>
            <p className="book-modal__author">{book.author}</p>
            <Stars count={book.stars} />

            <div className="book-modal__meta">
              <div className="book-modal__meta-item">
                <span className="book-modal__meta-label">Period</span>
                <span className="book-modal__meta-value">{book.year}</span>
              </div>
              {book.startedAge && (
                <div className="book-modal__meta-item">
                  <span className="book-modal__meta-label">Age</span>
                  <span className="book-modal__meta-value">
                    {book.startedAge === book.finishedAge
                      ? `${book.startedAge} years old`
                      : `${book.startedAge} – ${book.finishedAge} years old`}
                  </span>
                </div>
              )}
              <div className="book-modal__meta-item">
                <span className="book-modal__meta-label">Rating</span>
                <span className="book-modal__meta-value">{book.stars}/5</span>
              </div>
            </div>

            {book.review && (
              <blockquote className="book-modal__review">
                "{book.review}"
              </blockquote>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Books() {
  const shelfRef = useRef<HTMLDivElement>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  return (
    <section className="books-section" id="books">
      <h2 className="heading" data-color-inverted="true">
        Books I've Read.
      </h2>
      <p className="books-section__subtitle">
        {BOOKS.length} books since age 7. Click any spine to see the full story.
      </p>

      <div className="bookcase">
        <div className="bookcase__glass" />
        <div className="bookcase__top-trim" />

        <div className="bookcase__interior">
          <div className="bookcase__row" ref={shelfRef}>
            {BOOKS.map((book, i) => (
              <BookSpine
                key={book.title}
                book={book}
                index={i}
                onClick={() => setSelectedBook(book)}
              />
            ))}
          </div>
        </div>

        <div className="bookcase__shelf" />
        <div className="bookcase__wall bookcase__wall--left" />
        <div className="bookcase__wall bookcase__wall--right" />
      </div>

      <AnimatePresence>
        {selectedBook && (
          <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}

export default Books;
