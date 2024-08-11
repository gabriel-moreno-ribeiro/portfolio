import { useEffect, useState } from "react";

function useIsMobile(breakpoint: number = 600): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    window.innerWidth < breakpoint
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}

export default useIsMobile;
