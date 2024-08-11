import useMediaQuery from "@mui/material/useMediaQuery";

function useIsMobile(breakpoint: number = 600): boolean {
  const isMobile = useMediaQuery(`(max-width: ${breakpoint}px)`);

  return isMobile;
}

export default useIsMobile;
