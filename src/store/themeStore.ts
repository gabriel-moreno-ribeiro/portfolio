import { create } from "zustand";

// Utility function to get the initial theme
const getInitialTheme = () => {
  // Check local storage
  const savedTheme = localStorage.getItem("darkMode");
  if (savedTheme !== null) {
    return JSON.parse(savedTheme);
  }

  // Check system settings
  // const prefersDarkMode =
  //   window.matchMedia &&
  //   window.matchMedia("(prefers-color-scheme: dark)").matches;
  // if (prefersDarkMode) {
  //   return true;
  // }

  // Default to light mode
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
      localStorage.setItem("darkMode", JSON.stringify(newMode));
      return { darkMode: newMode };
    }),
}));
