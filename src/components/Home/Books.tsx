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
];

// Books data — add your books here
// cover path format: /books/{slug}.webp
const BOOKS: Book[] = [
  // Example entries (replace with your real data):
  // { title: "O Pequeno Príncipe", cover: "/books/pequeno-principe.webp", stars: 5, year: "2014-2015" },
  // { title: "Harry Potter e a Pedra Filosofal", cover: "/books/hp1.webp", stars: 5, year: "2016-2017" },
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
        data-fun="The Library Card"
      >
        Books I've Read.
      </h1>
      <p className="books-section__subtitle">
        A lifetime of reading — select years to explore my journey through books.
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
              {selectedYears.length > 0
                ? "No books recorded for the selected years yet."
                : "Books coming soon — add your reading history!"}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default Books;
