import { useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.bsTheme || "light");
  const dark = theme === "dark";
  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.bsTheme = next;
    document.documentElement.style.colorScheme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "dark" ? "#202936" : "#f6f8fa");
    try { localStorage.setItem("riccatiTema", next); } catch { /* Theme still works without storage. */ }
    setTheme(next);
  }
  return <button type="button" className="rp-icon-button" onClick={toggle} aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"} title={dark ? "Activar modo claro" : "Activar modo oscuro"}>
    {dark ? <Sun size={21} aria-hidden="true" /> : <Moon size={21} aria-hidden="true" />}
  </button>;
}
