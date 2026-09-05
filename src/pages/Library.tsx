import { Suspense, lazy } from "react";
import { useThemeStore } from "../store/themeStore";

const LibraryComponent = lazy(() => import("../components/Library/ShelfLibrary"));

function Fallback() {
  const { darkMode } = useThemeStore();
  return (
    <div style={{
      width: "100%", height: "100dvh",
      background: darkMode ? "#0a0a1a" : "#fff8f4",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <p style={{ color: darkMode ? "#a8a8b8" : "#5f5f5f", fontFamily: "DM Sans, sans-serif", fontSize: 14 }}>
        Loading library…
      </p>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <LibraryComponent />
    </Suspense>
  );
}
