import { motion, useScroll } from "framer-motion";
function HorizontalScroller() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="horizontal-scroller"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

export default HorizontalScroller;
