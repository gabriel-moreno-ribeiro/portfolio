import { useRef } from "react";
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

function BookSpine({ book, index }: { book: Book; index: number }) {
  return (
    <motion.div
      className="bookshelf__book"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ delay: index * 0.025, duration: 0.35 }}
      title={`${book.title} (${book.year})`}
    >
      <div className="bookshelf__cover">
        <img src={book.cover} alt={book.title} loading="lazy" />
      </div>
      <div className="bookshelf__tooltip">
        <span className="bookshelf__tooltip-title">{book.title}</span>
        <span className="bookshelf__tooltip-year">{book.year}</span>
        <span className="bookshelf__tooltip-stars">
          {"★".repeat(book.stars)}{"☆".repeat(5 - book.stars)}
        </span>
      </div>
    </motion.div>
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
        Hover a spine to see the title. Left to right, youngest to now.
      </p>

      <div className="bookshelf" ref={shelfRef}>
        <div className="bookshelf__shelf">
          {BOOKS.map((book, i) => (
            <BookSpine key={book.title + book.year} book={book} index={i} />
          ))}
          {/* Empty slots for books yet to come */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`empty-${i}`} className="bookshelf__book bookshelf__book--empty" />
          ))}
        </div>
        <div className="bookshelf__plank" />
      </div>
    </section>
  );
}

export default Books;
