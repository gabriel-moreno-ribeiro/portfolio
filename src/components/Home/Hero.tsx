import { motion } from "framer-motion";
import { FiArrowRight, FiLink } from "react-icons/fi";
import { scrollToComponent } from "../../utils/scrollToComponent";
import CanvasComponent from "../Canvas/CanvasComponent";
import CommonButton from "../Shared/CommonButton";
function Hero() {
  return (
    <div className="hero-section">
      <CanvasComponent />
      <div className="heading-section">
        <motion.h1
          className="heading"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          Fullstack Web and App Developer.
        </motion.h1>
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
