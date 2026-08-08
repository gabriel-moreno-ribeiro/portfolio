import { useRef, useState } from "react";
import { motion } from "motion/react";

interface Book {
  title: string;
  cover: string;
  stars: number;
  year: string;
}

const BOOKS: Book[] = [
  { title: "Manual do Mundo", cover: "/books/manual-do-mundo.webp", stars: 5, year: "2014-2015" },
  { title: "How to Train Your Dragon", cover: "/books/how-to-train-your-dragon.jpg", stars: 4, year: "2016-2017" },
  { title: "Percy Jackson", cover: "/books/percy-jackson.png", stars: 5, year: "2017-2018" },
  { title: "A Ilha do Tesouro", cover: "/books/ilha-do-tesouro.webp", stars: 5, year: "2017-2018" },
  { title: "Harry Potter", cover: "/books/harry-potter.jpg", stars: 5, year: "2018-2019" },
  { title: "O Pijama Listrado", cover: "/books/pijama-listrado.jpg", stars: 5, year: "2018-2019" },
  { title: "Auto da Compadecida", cover: "/books/auto-da-compadecida.jpg", stars: 5, year: "2018-2019" },
  { title: "O Extraordinário", cover: "/books/extraordinario.webp", stars: 5, year: "2019-2020" },
  { title: "Dom Casmurro", cover: "/books/dom-casmurro.jpg", stars: 4, year: "2020-2021" },
  { title: "Memórias Póstumas de Brás Cubas", cover: "/books/bras-cubas.jpg", stars: 4, year: "2020-2021" },
  { title: "Física — Renato Brito Vol. 1", cover: "/books/rb.webp", stars: 5, year: "2021-2022" },
  { title: "Física — Renato Brito Vol. 2", cover: "/books/rb2.png", stars: 5, year: "2021-2022" },
  { title: "Tópicos de Física", cover: "/books/topicos.jpg", stars: 4, year: "2021-2022" },
  { title: "Duna", cover: "/books/Duna1.jpg", stars: 5, year: "2021-2022" },
  { title: "Frankenstein", cover: "/books/frankenstein.webp", stars: 4, year: "2022-2023" },
  { title: "Fahrenheit 451", cover: "/books/farenheit.jpg", stars: 5, year: "2022-2023" },
  { title: "Brave New World", cover: "/books/admiravel-mundo-novo.jpg", stars: 5, year: "2022-2023" },
  { title: "Atkins Physical Chemistry", cover: "/books/atkins.webp", stars: 4, year: "2023-2024" },
  { title: "The Martian", cover: "/books/the-martian.jpg", stars: 5, year: "2023-2024" },
  { title: "Project Hail Mary", cover: "/books/project-hail-mary.webp", stars: 5, year: "2023-2024" },
  { title: "Surely You're Joking, Mr. Feynman!", cover: "/books/feynman.jpg", stars: 5, year: "2023-2024" },
  { title: "The Complete Sherlock Holmes", cover: "/books/sherlock-holmes.webp", stars: 5, year: "2024-2025" },
  { title: "The Official SAT Study Guide", cover: "/books/the-official-sat-study-guide.webp", stars: 4, year: "2024-2025" },
  { title: "The Wolf of Wall Street", cover: "/books/wolf-of-wall-street.webp", stars: 5, year: "2024-2025" },
  { title: "Catching the Wolf of Wall Street", cover: "/books/catching-wolf.webp", stars: 4, year: "2024-2025" },
  { title: "The Way of the Wolf", cover: "/books/way-of-the-wolf.webp", stars: 5, year: "2024-2025" },
  { title: "Zero to One", cover: "/books/zero-to-one.webp", stars: 5, year: "2025-2026" },
  { title: "Made in America", cover: "/books/made-in-america.webp", stars: 5, year: "2025-2026" },
];

// Consistent slight tilt per index — looks natural without being random
const TILTS = [-0.8, 0.4, -0.3, 0.6, -0.5, 0.3, -0.7, 0.5, -0.2, 0.8,
               -0.6, 0.4, -0.4, 0.7, -0.3, 0.5, -0.8, 0.3, -0.5, 0.6,
               -0.4, 0.7, -0.3, 0.5, -0.6, 0.4, -0.7, 0.3];

// Varied heights to look like a real shelf
const HEIGHTS = [190, 178, 196, 184, 200, 176, 194, 182, 198, 172,
                 192, 186, 204, 178, 196, 188, 200, 180, 194, 186,
                 198, 176, 204, 182, 196, 180, 200, 188];

function BookItem({ book, index }: { book: Book; index: number }) {
  const [active, setActive] = useState(false);
  const tilt = TILTS[index % TILTS.length];
  const height = HEIGHTS[index % HEIGHTS.length];

  return (
    <button
      className={`book ${active ? 'book--hovered' : ''}`}
      style={{
        '--tilt': `${tilt}deg`,
        '--h': `${height}px`,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        font: 'inherit',
      } as React.CSSProperties}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      aria-label={`${book.title} (${book.stars} out of 5 stars, ${book.year})`}
    >
      <div className="book__cover">
        <img src={book.cover} alt="" loading="lazy" aria-hidden="true" />
      </div>

      {active && (
        <div className="book__card" aria-hidden="true">
          <span className="book__card-title">{book.title}</span>
          <span className="book__card-year">{book.year}</span>
          <span className="book__card-stars" aria-hidden="true">
            {"★".repeat(book.stars)}
            <span className="book__card-stars--empty">{"★".repeat(5 - book.stars)}</span>
          </span>
        </div>
      )}
    </button>
  );
}

function Books() {
  const shelfRef = useRef<HTMLDivElement>(null);

  return (
    <section className="books-section" id="books">
      <h2 className="heading" data-color-inverted="true">
        Books I've Read.
      </h2>
      <p className="books-section__subtitle">
        Every book I've finished since I was nine. Oldest on the left.
      </p>

      <div className="bookcase">
        {/* Top trim */}
        <div className="bookcase__top-trim" />

        {/* Books row */}
        <div className="bookcase__interior">
          <div className="bookcase__row" ref={shelfRef}>
            {BOOKS.map((book, i) => (
              <motion.div
                key={book.title + book.year}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -40px 0px" }}
                transition={{ delay: i * 0.018, duration: 0.3 }}
              >
                <BookItem book={book} index={i} />
              </motion.div>
            ))}

            {/* Single "more coming" slot */}
            <div className="book book--empty book--next" aria-label="More books to come" />
          </div>
        </div>

        {/* Shelf plank */}
        <div className="bookcase__shelf" />

        {/* Side walls */}
        <div className="bookcase__wall bookcase__wall--left" />
        <div className="bookcase__wall bookcase__wall--right" />
      </div>
    </section>
  );
}

export default Books;
