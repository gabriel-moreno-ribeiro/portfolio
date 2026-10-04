import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { FiArrowUp } from "react-icons/fi";

// Appears once the visitor is a screen or so down the page. On phones it steps
// aside when the footer reaches the bottom of the screen: it would sit on the
// footer card's corner, and the page has run out anyway.
function footerUnderButton() {
  if (window.innerWidth > 768) return false;
  const footer = document.querySelector(".footer");
  return !!footer && footer.getBoundingClientRect().top < window.innerHeight - 160;
}

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700 && !footerUnderButton());
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          className="back-to-top"
          data-tip="Back to top"
          data-tip-pos="left"
          aria-label="Back to top"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <FiArrowUp />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
