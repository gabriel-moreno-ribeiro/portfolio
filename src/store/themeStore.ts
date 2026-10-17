import { create } from "zustand";

// The mobile browser chrome follows the page background.
const setThemeColor = (isDark: boolean) =>
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", isDark ? "#14100d" : "#fff8f4");

// Storage can throw (cookies blocked, some private modes): never let that stop the app.
export const readStore = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
export const writeStore = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* not saved */ } };

// Utility function to get the initial theme
const getInitialTheme = () => {
  const savedTheme = readStore("darkMode");
  if (savedTheme !== null) {
    const isDark = savedTheme === "true";
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
      writeStore("darkMode", String(newMode));
      return { darkMode: newMode };
    }),
}));
