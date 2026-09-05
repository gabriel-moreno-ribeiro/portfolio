import { Suspense, lazy } from "react";
import { useDocumentHead } from "../hooks/useDocumentHead";
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
  // ShelfLibrary manages the title as you browse; this sets description + canonical (was pointing at the home page)
  useDocumentHead({
    title: "Library — Gabriel Moreno Ribeiro",
    description: "The books on Gabriel Moreno Ribeiro's shelf, from Manual do Mundo to Zero to One. Drag, scroll or use the arrow keys to browse.",
    canonical: "https://gabrielmr.com/library",
  });
  return (
    <Suspense fallback={<Fallback />}>
      <LibraryComponent />
    </Suspense>
  );
}
