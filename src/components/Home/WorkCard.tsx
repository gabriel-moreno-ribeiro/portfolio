import {
  AnimatePresence,
  motion,
  useAnimation,
  useInView,
} from "motion/react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { FiGithub, FiPlayCircle } from "react-icons/fi";
import useIsMobile from "../../hooks/useIsMobile";
import { useWindowManagerStore } from "../../store/windowManagerStore";
import MacButtons from "./MacButtons";

const ReactPlayer = lazy(() => import("react-player/youtube"));

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
  cardIndex?: number;
}

const WorkCard = ({ data, cardIndex = 0 }: WorkCardInterface) => {
  const { cardData, modalData } = data;
  const isMobile = useIsMobile();
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { margin: "0px 0px 200px 0px", once: true });

  const openWindow = useWindowManagerStore((s) => s.openWindow);

  // Mobile-only modal state
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (inView) {
      controls.start({
        scale: 1,
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 },
      });
    }
  }, [controls, inView]);

  const handleOpen = () => {
    if (isMobile) {
      setIsOpen(true);
      setIsExpanded(true);
      setIsMinimized(false);
    } else {
      const windowId = `workcard-${cardIndex}`;
      openWindow({
        id: windowId,
        title: modalData.title,
        type: "workcard",
        status: "open",
        position: {
          x: Math.max(20, window.innerWidth / 2 - 400),
          y: Math.max(20, window.innerHeight / 2 - 250),
        },
        size: { width: 800, height: 0 },
        meta: { cardData, modalData },
      });
    }
  };

  const handleClose = () => setIsOpen(false);

  const handleMinimize = () => {
    setIsMinimized(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsMinimized(false);
    }, 400);
  };

  const handleExpand = () => setIsExpanded((prev) => !prev);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isMobile) {
          setIsOpen(false);
        } else {
          const state = useWindowManagerStore.getState();
          Object.values(state.windows).forEach((win) => {
            if (win.type === "workcard") {
              state.closeWindow(win.id);
            }
          });
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isMobile]);

  return (
    <div className="card-modal-component">
      <motion.div
        className="main-card"
        initial={{ scale: 0.99, opacity: 0, y: 100 }}
        animate={controls}
        transition={{ duration: 0.5 }}
        ref={ref}
      >
        <motion.img
          src={cardData.imgUrl}
          alt="card"
          className="card-img"
          onClick={handleOpen}
          whileTap={{ scale: 0.95 }}
          data-click-me={"true"}
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

      {isMobile && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                className="modal-content"
                initial={{ width: "400px", opacity: 0 }}
                animate={
                  isMinimized
                    ? {
                        width: "300px",
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
                        width: "400px",
                        opacity: 1,
                        transition: {
                          type: "spring",
                          stiffness: 200,
                          damping: 20,
                        },
                      }
                    : {
                        width: "300px",
                        opacity: 1,
                        transition: {
                          type: "spring",
                          stiffness: 200,
                          damping: 20,
                        },
                      }
                }
                exit={{ width: "400px", opacity: 0 }}
              >
                <MacButtons
                  onClose={handleClose}
                  onMinimise={handleMinimize}
                  onExpand={handleExpand}
                  isExpanded={isExpanded}
                />
                <h2 className="heading">{modalData.title}</h2>
                {cardData.url?.youtubeUrl && (
                  <Suspense fallback={null}>
                    <ReactPlayer
                      url={cardData.url.youtubeUrl}
                      controls
                      width="100%"
                      height={isExpanded ? 200 : 150}
                    />
                  </Suspense>
                )}
                <p
                  className="desc"
                  dangerouslySetInnerHTML={{ __html: modalData.desc }}
                />
                {modalData.infoHeading && (
                  <h2 className="heading-2">{modalData.infoHeading}</h2>
                )}
                {modalData.infoArr && (
                  <p className="desc">{modalData.infoArr.join(", ")}</p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default WorkCard;
