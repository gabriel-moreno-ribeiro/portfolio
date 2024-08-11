import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FiArrowRight, FiLink } from "react-icons/fi";
import ScrambleAnimation from "react-scrambled-text/dist/src/ScrambleAnimation";
import useIsMobile from "../../hooks/useIsMobile";
import { scrollToComponent } from "../../utils/scrollToComponent";
import CanvasComponent from "../Canvas/CanvasComponent";
import CommonButton from "../Shared/CommonButton";

const bottomTexts = [
  `Avi is also an instructor at a leading YC EdTech platform, having taught MERN Stack to over <span class="black"> 100,000+ </span> students.`,
  `Avi is a graduate from <span class="black"> IIIT Delhi </span> and has done his <span class="black"> Btech (CS) </span> in 2024.`,
  `Avi also has interests in <span class="black"> Algo Trading, UI Designing and Product Designing. </span>`,
];

function Hero() {
  const isMobile = useIsMobile();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % bottomTexts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [bottomTexts.length]);

  return (
    <div className="hero-section">
      <CanvasComponent />
      <div className="heading-section">
        <motion.div
          className="heading"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <ScrambleAnimation
            style={{
              fontSize: isMobile ? "32px" : "56px",
              color: "var(--black)",
            }}
            texts={["Fullstack", "App", "Game", "Web"]}
            speed={100}
            pauseDuration={1000}
            start={true}
          />
          <h1 className="heading">Developer.</h1>
        </motion.div>
        <motion.p
          className="desc"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Avi has a strong interest in Product Management and Entrepreneurship
          and is committed to delivering high-quality tech products that offer
          an exceptional user experience.
        </motion.p>
        <motion.div
          className="btn-flex"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.25 }}
        >
          <CommonButton
            text="Connect"
            Icon={<FiLink className="icon-link" />}
            iconPosition="right"
            onClick={() => window.open("https://linkedin.com/in/avivashishta")}
          />
          <CommonButton
            text="See Work"
            variant="outline"
            Icon={<FiArrowRight className="icon-arrow" />}
            iconPosition="right"
            onClick={() => scrollToComponent("work")}
          />
        </motion.div>
        <motion.p
          key={currentTextIndex}
          className="bottom-text"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          dangerouslySetInnerHTML={{ __html: bottomTexts[currentTextIndex] }}
        />
      </div>
    </div>
  );
}

export default Hero;
