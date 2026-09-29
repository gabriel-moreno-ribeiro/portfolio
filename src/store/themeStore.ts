import { create } from "zustand";

// The mobile browser chrome follows the page background.
const setThemeColor = (isDark: boolean) =>
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", isDark ? "#0a0a1a" : "#fff8f4");

// Utility function to get the initial theme
const getInitialTheme = () => {
  // Check local storage
  const savedTheme = localStorage.getItem("darkMode");
  if (savedTheme !== null) {
    const isDark = JSON.parse(savedTheme);
    // Apply data-theme synchronously to prevent FOUC
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light"
    );
    setThemeColor(isDark);
    return isDark;
  }

  return false;
};

interface ThemeState {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  darkMode: getInitialTheme(),
  toggleDarkMode: () =>
    set((state) => {
      const newMode = !state.darkMode;
      document.documentElement.setAttribute(
        "data-theme",
        newMode ? "dark" : "light"
      );
      setThemeColor(newMode);
      localStorage.setItem("darkMode", JSON.stringify(newMode));
      return { darkMode: newMode };
    }),
}));
