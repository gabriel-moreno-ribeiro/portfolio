import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FiGithub, FiPlayCircle } from "react-icons/fi";
import ReactPlayer from "react-player/youtube";
import MacButtons from "./MacButtons";

interface WorkCardInterface {
  data: {
    cardData: {
      title: string;
      imgUrl: string;
      url: {
        githubUrl?: string;
        youtubeUrl?: string;
      } | null;
    };
    modalData: {
      title: string;
      desc: string;
      infoHeading?: string;
      infoArr?: string[];
    };
  };
}

const WorkCard = ({ data }: WorkCardInterface) => {
  const { cardData, modalData } = data;
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleModal = () => {
    setIsOpen((prev) => {
      if (!prev) {
        setIsExpanded(true);
        setIsMinimized(false);
      }
      return !prev;
    });
  };

  const handleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsMinimized(false);
    }, 400);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
  }, []);

  return (
    <div className="card-modal-component">
      <motion.div className="main-card" whileTap={{ scale: 0.95 }}>
        <motion.img
          src={cardData.imgUrl}
          alt="card"
          className="card-img"
          onClick={toggleModal}
        />
        <div className="card-heading-flex">
          <h2 className="heading">{cardData.title}</h2>
          {cardData.url && (
            <>
              {cardData.url.githubUrl && (
                <FiGithub
                  className="icon"
                  onClick={() => window.open(cardData.url?.githubUrl)}
                />
              )}
              {cardData.url.youtubeUrl && (
                <FiPlayCircle
                  className="icon"
                  onClick={() => window.open(cardData.url?.youtubeUrl)}
                />
              )}
            </>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content"
              initial={{ width: "800px", opacity: 0 }}
              animate={
                isMinimized
                  ? {
                      width: "500px",
                      opacity: 0,
                      x: 300,
                      y: 300,
                      transition: {
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      },
                    }
                  : isExpanded
                  ? {
                      width: "800px",
                      opacity: 1,
                      transition: {
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                      },
                    }
                  : {
                      width: "500px",
                      opacity: 1,
                      transition: {
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                      },
                    }
              }
              exit={{ width: "800px", opacity: 0 }}
            >
              <MacButtons
                onClose={handleClose}
                onMinimise={handleMinimize}
                onExpand={handleExpand}
              />
              <h2 className="heading">{modalData.title}</h2>
              {cardData.url?.youtubeUrl && (
                <ReactPlayer
                  url={cardData.url.youtubeUrl}
                  controls
                  width="100%"
                  height={isExpanded ? 400 : 300}
                />
              )}
              <p className="desc">{modalData.desc}</p>
              <h2 className="heading-2">{modalData.infoHeading}</h2>
              <p className="desc">{modalData.infoArr?.join(", ")}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkCard;
