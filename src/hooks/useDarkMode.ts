import { useEffect, useState } from "react";

const STORAGE_KEY = "dce-theme";

function getInitial(): boolean {
  if (typeof document === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return document.documentElement.classList.contains("dark");
}

export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(getInitial);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
    } catch {
      /* no-op */
    }
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d), setDark };
}
