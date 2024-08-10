import { useEffect } from "react";
import CustomMouse from "./components/Shared/CustomMouse";
import DarkModeButton from "./components/Shared/DarkModeButton";
import Home from "./pages/Home";
import { useThemeStore } from "./store/themeStore";

function App() {
  const { darkMode } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  return (
    // <ReactLenis root>
    <div className="app">
      <Home />
      <DarkModeButton />
      <CustomMouse />
    </div>
    // </ReactLenis>
  );
}

export default App;
