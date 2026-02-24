import {
  motion,
  useAnimation,
  useInView,
} from "motion/react";
import { useEffect, useRef } from "react";
import { FiGithub, FiPlayCircle } from "react-icons/fi";
import useIsMobile from "../../hooks/useIsMobile";
import { useWindowManagerStore } from "../../store/windowManagerStore";

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
    const windowId = `workcard-${cardIndex}`;
    openWindow({
      id: windowId,
      title: modalData.title,
      type: "workcard",
      status: "open",
      position: {
        x: Math.max(20, window.innerWidth / 2 - (isMobile ? 200 : 400)),
        y: Math.max(20, window.innerHeight / 2 - 250),
      },
      size: { width: isMobile ? 400 : 800, height: 600 },
      meta: { cardData, modalData },
    });
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Close all workcard windows
        const state = useWindowManagerStore.getState();
        Object.values(state.windows).forEach((win) => {
          if (win.type === "workcard") {
            state.closeWindow(win.id);
          }
        });
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

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
    </div>
  );
};

export default WorkCard;
