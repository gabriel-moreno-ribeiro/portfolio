import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { FiGithub } from "react-icons/fi";
import MacButtons from "./MacButtons";

const WorkCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleModal = () => {
    setIsOpen((prev) => {
      if (!prev) {
        setIsExpanded(false);
        setIsMinimized(false);
      }
      return !prev;
    });
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
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
      <motion.div
        className="main-card"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.img
          src="https://i.ibb.co/xX3CnB1/Screenshot-2021-12-09-at-2-22-01-PM.png"
          alt="card"
          className="card-img"
          onClick={toggleModal}
        />
        <div className="card-heading-flex">
          <h2 className="heading">Bare Molecules.</h2>
          <FiGithub className="icon" />
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
              initial={{ width: "400px", opacity: 0 }}
              animate={
                isMinimized
                  ? {
                      width: "50px",
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
              exit={{ width: "500px", opacity: 0 }}
            >
              <MacButtons
                onClose={handleClose}
                onMinimise={handleMinimize}
                onExpand={handleExpand}
              />
              <h2 className="heading">More Information</h2>
              <p className="desc">
                This is additional information shown in the modal.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkCard;
