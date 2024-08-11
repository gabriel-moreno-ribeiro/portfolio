import { motion } from "framer-motion";
import { FiArrowRight, FiLink } from "react-icons/fi";
import ScrambleAnimation from "react-scrambled-text/dist/src/ScrambleAnimation";
import useIsMobile from "../../hooks/useIsMobile";
import { scrollToComponent } from "../../utils/scrollToComponent";
import CanvasComponent from "../Canvas/CanvasComponent";
import CommonButton from "../Shared/CommonButton";

function Hero() {
  const isMobile = useIsMobile();
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
          className="bottom-text"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.25 }}
        >
          Avi is also an instructor at a leading YC EdTech platform, having
          taught over <span className="black">100,000+</span> students.
        </motion.p>
      </div>
    </div>
  );
}

export default Hero;
