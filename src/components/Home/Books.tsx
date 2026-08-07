import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Book {
  title: string;
  cover: string;
  stars: number;
  year: string;
}

// Birth: 21 Dec 2007. Age = startYear - 2007.
// Books ordered chronologically (youngest first) and by complexity within each year.
const BOOKS: Book[] = [
  // age 7 — 2014-2015
  { title: "Manual do Mundo", cover: "/books/manual-do-mundo.webp", stars: 5, year: "2014-2015" },

  // age 9 — 2016-2017
  { title: "How to Train Your Dragon", cover: "/books/how-to-train-your-dragon.jpg", stars: 4, year: "2016-2017" },

  // age 10 — 2017-2018
  { title: "Percy Jackson", cover: "/books/percy-jackson.png", stars: 5, year: "2017-2018" },
  { title: "A Ilha do Tesouro", cover: "/books/ilha-do-tesouro.webp", stars: 5, year: "2017-2018" },

  // age 11 — 2018-2019
  { title: "Harry Potter", cover: "/books/harry-potter.jpg", stars: 5, year: "2018-2019" },
  { title: "O Pijama Listrado", cover: "/books/pijama-listrado.jpg", stars: 5, year: "2018-2019" },
  { title: "Auto da Compadecida", cover: "/books/auto-da-compadecida.jpg", stars: 5, year: "2018-2019" },

  // age 12 — 2019-2020
  { title: "O Extraordinário", cover: "/books/extraordinario.webp", stars: 5, year: "2019-2020" },

  // age 13 — 2020-2021
  { title: "Dom Casmurro", cover: "/books/dom-casmurro.jpg", stars: 4, year: "2020-2021" },
  { title: "Memórias Póstumas de Brás Cubas", cover: "/books/bras-cubas.jpg", stars: 4, year: "2020-2021" },

  // age 14 — 2021-2022
  { title: "Física — Renato Brito (Vol. 1)", cover: "/books/rb.webp", stars: 5, year: "2021-2022" },
  { title: "Física — Renato Brito (Vol. 2)", cover: "/books/rb2.png", stars: 5, year: "2021-2022" },
  { title: "Tópicos de Física", cover: "/books/topicos.jpg", stars: 4, year: "2021-2022" },
  { title: "Duna", cover: "/books/Duna1.jpg", stars: 5, year: "2021-2022" },

  // age 15 — 2022-2023
  { title: "Frankenstein", cover: "/books/frankenstein.webp", stars: 4, year: "2022-2023" },
  { title: "Fahrenheit 451", cover: "/books/farenheit.jpg", stars: 5, year: "2022-2023" },
  { title: "Brave New World", cover: "/books/admiravel-mundo-novo.jpg", stars: 5, year: "2022-2023" },

  // age 16 — 2023-2024
  { title: "Atkins Physical Chemistry", cover: "/books/atkins.webp", stars: 4, year: "2023-2024" },
  { title: "The Martian", cover: "/books/the-martian.jpg", stars: 5, year: "2023-2024" },
  { title: "Project Hail Mary", cover: "/books/project-hail-mary.webp", stars: 5, year: "2023-2024" },
  { title: "Surely You're Joking, Mr. Feynman!", cover: "/books/feynman.jpg", stars: 5, year: "2023-2024" },

  // age 17 — 2024-2025
  { title: "The Complete Sherlock Holmes", cover: "/books/sherlock-holmes.webp", stars: 5, year: "2024-2025" },
  { title: "The Official SAT Study Guide", cover: "/books/the-official-sat-study-guide.webp", stars: 4, year: "2024-2025" },
  { title: "The Wolf of Wall Street", cover: "/books/wolf-of-wall-street.webp", stars: 5, year: "2024-2025" },
  { title: "Catching the Wolf of Wall Street", cover: "/books/catching-wolf.webp", stars: 4, year: "2024-2025" },
  { title: "The Way of the Wolf", cover: "/books/way-of-the-wolf.webp", stars: 5, year: "2024-2025" },

  // age 18 — 2025-2026
  { title: "Zero to One", cover: "/books/zero-to-one.webp", stars: 5, year: "2025-2026" },
  { title: "Made in America", cover: "/books/made-in-america.webp", stars: 5, year: "2025-2026" },
];

// All school years from 2007-2008 to present, for the calendar sidebar
const ALL_YEARS: string[] = [];
for (let y = 2007; y <= 2025; y++) {
  ALL_YEARS.push(`${y}-${y + 1}`);
}

const BIRTH_YEAR = "2007-2008"; // born Dec 21 2007 — so 2007-2008 is valid from Dec 21 on

function getAge(year: string) {
  return parseInt(year.split("-")[0]) - 2007;
}

function hasBooksIn(year: string) {
  return BOOKS.some((b) => b.year === year);
}

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="books-card__stars">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < stars ? "star--filled" : "star--empty"}>★</span>
      ))}
    </div>
  );
}

function Books() {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  const isBefore = selectedYear
    ? parseInt(selectedYear.split("-")[0]) < 2007
    : false;

  const filteredBooks = useMemo(
    () => (selectedYear && !isBefore ? BOOKS.filter((b) => b.year === selectedYear) : []),
    [selectedYear, isBefore]
  );

  return (
    <section className="books-section" id="books">
      <h1 className="heading" data-color-inverted="true">
        Books I've Read.
      </h1>
      <p className="books-section__subtitle">
        Pick a year on the left to open the shelf.
      </p>

      <div className="books-layout">
        {/* ── Calendar sidebar ── */}
        <div className="books-calendar">
          {ALL_YEARS.map((year) => {
            const age = getAge(year);
            const hasBooks = hasBooksIn(year);
            const isActive = selectedYear === year;
            const isPast = parseInt(year.split("-")[0]) < 2007;
            return (
              <motion.button
                key={year}
                className={[
                  "books-year-row",
                  isActive ? "books-year-row--active" : "",
                  isPast ? "books-year-row--past" : "",
                  hasBooks ? "books-year-row--has-books" : "",
                ].join(" ").trim()}
                onClick={() => setSelectedYear(isActive ? null : year)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="books-year-row__label">{year}</span>
                <span className="books-year-row__age">age {age}</span>
                {hasBooks && <span className="books-year-row__dot" />}
              </motion.button>
            );
          })}
        </div>

        {/* ── Right panel ── */}
        <div className="books-panel">
          <AnimatePresence mode="wait">
            {!selectedYear && (
              <motion.div
                key="prompt"
                className="books-section__empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="books-section__empty-icon">📚</span>
                <p>Select a year to open the shelf.</p>
              </motion.div>
            )}

            {isBefore && (
              <motion.div
                key="unborn"
                className="books-section__empty books-section__empty--unborn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <span className="books-section__empty-icon">🍼</span>
                <p>Ops... I wasn't born yet.</p>
              </motion.div>
            )}

            {selectedYear && !isBefore && filteredBooks.length === 0 && (
              <motion.div
                key="empty-year"
                className="books-section__empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="books-section__empty-icon">📭</span>
                <p>No books recorded for this year yet.</p>
              </motion.div>
            )}

            {filteredBooks.length > 0 && (
              <motion.div
                key={selectedYear}
                className="books-grid"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {filteredBooks.map((book, i) => (
                  <motion.div
                    key={book.title}
                    className="books-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                  >
                    <div className="books-card__cover">
                      <img src={book.cover} alt={book.title} loading="lazy" />
                    </div>
                    <div className="books-card__info">
                      <span className="books-card__title">{book.title}</span>
                      <StarRating stars={book.stars} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default Books;
