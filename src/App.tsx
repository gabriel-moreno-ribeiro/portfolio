import { initializeAnalytics } from "avi-analytics-sdk";
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
    initializeAnalytics({
      apiKey: "aba66723-638a-43bb-963d-58ad97960a5c",
    });
    fetch("https://jsonplaceholder.typicode.com/posts/1")
      .then((res) => res.json())
      .then((data) => console.log(data));

    /* updating title of product with id 1 */
    fetch(
      "https://dummyjson.com/products?limit=10&skip=-sakisuaxsa&select=title,price",
      {
        method: "PUT" /* or PATCH */,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: "iPhone Galaxy +1",
        }),
      }
    )
      .then((res) => res.json())
      .then(console.log);

    fetch("https://dummyjson.com/products/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: null,
    })
      .then((res) => res.json())
      .then(console.log);
  }, []);

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
