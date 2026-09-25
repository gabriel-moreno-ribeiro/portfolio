import { motion } from "motion/react";
import useIsMobile from "../../hooks/useIsMobile";

interface CardProps {
  frontCard: boolean;
  imgSrc?: string;
  imgPadding?: number;
}

const FRONT_VARIANTS = {
  animate: { scale: 1, y: 0, opacity: 1 },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.5 } },
};

const NumberStatsCard = ({ frontCard, imgSrc, imgPadding = 18 }: CardProps) => {
  const isMobile = useIsMobile();

  const variantsBackCard = {
    initial: { scale: 0, y: isMobile ? 80 : 105, opacity: 0 },
    animate: { scale: 0.75, y: isMobile ? 20 : 30, opacity: 0.5 },
  };

  return (
    <motion.div
      className={`card ${frontCard ? "front-card" : "back-card"}`}
      variants={frontCard ? FRONT_VARIANTS : variantsBackCard}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={
        frontCard
          ? { type: "spring", stiffness: 300, damping: 20 }
          : { scale: { duration: 0.5 }, opacity: { duration: 0.4 } }
      }
    >
      <div className="card-content">
        {imgSrc && (
          <img
            src={imgSrc}
            alt=""
            aria-hidden="true"
            className="icon-img"
            width={110}
            height={110}
            style={{ padding: `${imgPadding}px` }}
          />
        )}
      </div>
    </motion.div>
  );
};

export default NumberStatsCard;
