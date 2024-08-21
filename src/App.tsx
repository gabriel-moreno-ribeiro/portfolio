import { useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomMouse from "./components/Shared/CustomMouse";
import DarkModeButton from "./components/Shared/DarkModeButton";
import HorizontalScroller from "./components/Shared/HorizontalScroller";
import useIsMobile from "./hooks/useIsMobile";
import Home from "./pages/Home";
import { useThemeStore } from "./store/themeStore";

function App() {
  const { darkMode } = useThemeStore();
  const isMobile = useIsMobile();

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  useEffect(() => {
    if (!isMobile) {
      if (sessionStorage.getItem("showedToast")) return;
      setTimeout(() => {
        toast("Just for fun, try pressing Ctrl + K!", {
          position: "bottom-right",
          autoClose: 1000 * 10,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: darkMode ? "light" : "dark",
        });
        sessionStorage.setItem("showedToast", "true");
      }, 3000);
    }
  }, [isMobile]);

  return (
    // <ReactLenis root>
    <div className="app">
      <HorizontalScroller />
      <Home />
      <DarkModeButton />
      <CustomMouse />
      <ToastContainer />
    </div>
    // </ReactLenis>
  );
}

export default App;
