import { lazy, Suspense } from "react";
import { useWindow, WindowId } from "../../store/windowManagerStore";
import useIsMobile from "../../hooks/useIsMobile";
import DraggableWindow from "./DraggableWindow";

const ReactPlayer = lazy(() => import("react-player/youtube"));

interface WorkCardMeta {
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
}

function WorkCardWindow({ windowId }: { windowId: WindowId }) {
  const win = useWindow(windowId);
  const isMobile = useIsMobile();

  if (!win || win.status === "minimized") return null;

  const meta = win.meta as WorkCardMeta | undefined;
  if (!meta) return null;

  const { cardData, modalData } = meta;
  const isMaximized = win.status === "maximized";

  return (
    <DraggableWindow
      windowId={windowId}
      title={modalData.title}
      className="workcard-window"
    >
      <div className="workcard-window__content">
        <h2 className="heading">{modalData.title}</h2>
        {cardData.url?.youtubeUrl && (
          <Suspense fallback={null}>
            <ReactPlayer
              url={cardData.url.youtubeUrl}
              controls
              width="100%"
              height={
                isMobile
                  ? isMaximized
                    ? 250
                    : 200
                  : isMaximized
                    ? 500
                    : 400
              }
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
      </div>
    </DraggableWindow>
  );
}

export default WorkCardWindow;
