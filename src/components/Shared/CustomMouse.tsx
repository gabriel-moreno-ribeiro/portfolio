import { useEffect } from "react";

function CustomMouse() {
  useEffect(() => {
    const mouseMove = (e: MouseEvent) => {
      const customMouse = document.querySelector(
        ".custom-mouse"
      ) as HTMLElement;
      if (customMouse) {
        customMouse.style.top = `${e.pageY}px`;
        customMouse.style.left = `${e.pageX}px`;
      }
    };

    document.addEventListener("mousemove", mouseMove);

    return () => {
      document.removeEventListener("mousemove", mouseMove);
    };
  }, []);

  return <div className="custom-mouse" />;
}

export default CustomMouse;
