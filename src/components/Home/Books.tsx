import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Book {
  title: string;
  cover: string;
  stars: number;
  year: string;
}

const YEARS = [
  "2007-2008",
  "2008-2009",
  "2009-2010",
  "2010-2011",
  "2011-2012",
  "2012-2013",
  "2013-2014",
  "2014-2015",
  "2015-2016",
  "2016-2017",
  "2017-2018",
  "2018-2019",
  "2019-2020",
  "2020-2021",
  "2021-2022",
  "2022-2023",
  "2023-2024",
  "2024-2025",
  "2025-2026",
];

const BOOKS: Book[] = [
  // 2025-2026 (age 18)
  { title: "Made in America", cover: "/books/made-in-america.webp", stars: 5, year: "2025-2026" },
  { title: "Zero to One", cover: "/books/zero-to-one.webp", stars: 5, year: "2025-2026" },
  // 2024-2025 (age 17)
  { title: "The Way of the Wolf", cover: "/books/way-of-the-wolf.webp", stars: 5, year: "2024-2025" },
  { title: "The Wolf of Wall Street", cover: "/books/wolf-of-wall-street.webp", stars: 5, year: "2024-2025" },
  { title: "Catching the Wolf of Wall Street", cover: "/books/catching-wolf.webp", stars: 4, year: "2024-2025" },
  { title: "The Complete Sherlock Holmes", cover: "/books/sherlock-holmes.webp", stars: 5, year: "2024-2025" },
  { title: "IDEA", cover: "/books/idea.webp", stars: 5, year: "2024-2025" },
  { title: "The Martian", cover: "/books/the-martian.jpg", stars: 5, year: "2024-2025" },
  { title: "Project Hail Mary", cover: "/books/project-hail-mary.webp", stars: 5, year: "2024-2025" },
  { title: "Surely You're Joking, Mr. Feynman!", cover: "/books/feynman.jpg", stars: 5, year: "2024-2025" },
  { title: "The Official SAT Study Guide", cover: "/books/the-official-sat-study-guide.webp", stars: 4, year: "2024-2025" },
  // 2023-2024 (age 16)
  { title: "Fahrenheit 451", cover: "/books/farenheit.jpg", stars: 5, year: "2023-2024" },
  { title: "Brave New World", cover: "/books/admiravel-mundo-novo.jpg", stars: 5, year: "2023-2024" },
  { title: "Frankenstein", cover: "/books/frankenstein.webp", stars: 4, year: "2023-2024" },
  { title: "Atkins Physical Chemistry", cover: "/books/atkins.webp", stars: 4, year: "2023-2024" },
  // 2022-2023 (age 15)
  { title: "Duna", cover: "/books/Duna1.jpg", stars: 5, year: "2022-2023" },
  { title: "How to Train Your Dragon", cover: "/books/how-to-train-your-dragon.jpg", stars: 4, year: "2022-2023" },
  // 2021-2022 (age 14)
  { title: "O Extraordinário", cover: "/books/extraordinario.webp", stars: 5, year: "2021-2022" },
  { title: "Tópicos de Física", cover: "/books/topicos.jpg", stars: 4, year: "2021-2022" },
  // 2020-2021 (age 13)
  { title: "Harry Potter", cover: "/books/harry-potter.jpg", stars: 5, year: "2020-2021" },
  { title: "Percy Jackson", cover: "/books/percy-jackson.png", stars: 5, year: "2020-2021" },
  // 2019-2020 (age 12)
  { title: "A Ilha do Tesouro", cover: "/books/ilha-do-tesouro.webp", stars: 5, year: "2019-2020" },
  { title: "Manual do Mundo", cover: "/books/manual-do-mundo.webp", stars: 4, year: "2019-2020" },
  // 2018-2019 (age 11)
  { title: "O Pijama Listrado", cover: "/books/pijama-listrado.jpg", stars: 5, year: "2018-2019" },
  { title: "Auto da Compadecida", cover: "/books/auto-da-compadecida.jpg", stars: 5, year: "2018-2019" },
  // 2017-2018 (age 10)
  { title: "Dom Casmurro", cover: "/books/dom-casmurro.jpg", stars: 4, year: "2017-2018" },
  { title: "Memórias Póstumas de Brás Cubas", cover: "/books/bras-cubas.jpg", stars: 4, year: "2017-2018" },
];

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="books-card__stars">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < stars ? "star--filled" : "star--empty"}>
          ★
        </span>
      ))}
    </div>
  );
}

function Books() {
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  const toggleYear = (year: string) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const filteredBooks = useMemo(() => {
    if (selectedYears.length === 0) return BOOKS;
    return BOOKS.filter((book) => selectedYears.includes(book.year));
  }, [selectedYears]);

  const getAge = (year: string) => {
    const startYear = parseInt(year.split("-")[0]);
    return startYear - 2007;
  };

  return (
    <section className="books-section" id="books">
      <h1
        className="heading"
        data-color-inverted="true"
      >
        Books I've Read.
      </h1>
      <p className="books-section__subtitle">
        Filter by year to see what I was reading at each age.
      </p>

      <div className="books-section__years">
        {YEARS.map((year) => {
          const isActive = selectedYears.includes(year);
          const age = getAge(year);
          return (
            <motion.button
              key={year}
              className={`books-year-chip ${isActive ? "books-year-chip--active" : ""}`}
              onClick={() => toggleYear(year)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="books-year-chip__year">{year}</span>
              <span className="books-year-chip__age">age {age}</span>
            </motion.button>
          );
        })}
      </div>

      {selectedYears.length > 0 && (
        <motion.button
          className="books-section__clear"
          onClick={() => setSelectedYears([])}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Clear selection
        </motion.button>
      )}

      <div className="books-grid">
        <AnimatePresence mode="popLayout">
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book, i) => (
              <motion.div
                key={book.title + book.year}
                className="books-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                layout
              >
                <div className="books-card__cover">
                  <img
                    src={book.cover}
                    alt={book.title}
                    loading="lazy"
                  />
                </div>
                <div className="books-card__info">
                  <span className="books-card__title">{book.title}</span>
                  <StarRating stars={book.stars} />
                  <span className="books-card__year">{book.year}</span>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.p
              className="books-section__empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              No books recorded for the selected years yet.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default Books;
