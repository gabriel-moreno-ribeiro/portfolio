import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import img1 from "../../assets/work-carousel/img1.png";
import img2 from "../../assets/work-carousel/img2.png";
import img3 from "../../assets/work-carousel/img3.png";

const images = [img1, img2, img3];

const WorkCarousel = () => {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="work-carousel">
      <div className="carousel-container">
        <h1 className="heading">
          Currently Working At
          <span className="blue">
            <a href="https://acciojob.com" target="_blank" rel="noreferrer">
              {" "}
              AccioJob
            </a>
          </span>
          (YC19)
        </h1>
        <div className="images-container">
          <AnimatePresence>
            {images.map((image, index) =>
              index === currentImageIndex ? (
                <motion.img
                  key={image}
                  src={image}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="carousel-image"
                />
              ) : null
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default WorkCarousel;
