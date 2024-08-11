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

    const mouseDown = () => {
      const customMouse = document.querySelector(
        ".custom-mouse"
      ) as HTMLElement;
      if (customMouse) {
        customMouse.style.width = "50px";
        customMouse.style.height = "50px";
        customMouse.style.backgroundColor = "var(--black)";
        customMouse.style.opacity = "0.5";
      }
    };

    const mouseUp = () => {
      const customMouse = document.querySelector(
        ".custom-mouse"
      ) as HTMLElement;
      if (customMouse) {
        customMouse.style.width = "10px";
        customMouse.style.height = "10px";
        customMouse.style.backgroundColor = "var(--black)";
        customMouse.style.opacity = "1";
      }
    };

    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mousedown", mouseDown);
    document.addEventListener("mouseup", mouseUp);

    return () => {
      document.removeEventListener("mousemove", mouseMove);
      document.removeEventListener("mousedown", mouseDown);
    };
  }, []);

  return <div className="custom-mouse" />;
}

export default CustomMouse;
