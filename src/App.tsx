import { ReactLenis } from "lenis/react";
import Home from "./pages/Home";

function App() {
  return (
    <ReactLenis root>
      <div className="app">
        <Home />
      </div>
    </ReactLenis>
  );
}

export default App;
