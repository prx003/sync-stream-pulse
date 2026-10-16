import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => { setTheme(localStorage.getItem("sac:theme") === "light" ? "light" : "dark"); }, []);
  const pick = (t: "dark" | "light") => {
    setTheme(t);
    localStorage.setItem("sac:theme", t);
    const el = document.documentElement;
    el.classList.toggle("light", t === "light");
    el.classList.toggle("dark", t === "dark");
  };
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {(["light", "dark"] as const).map((t) => (
        <button key={t} onClick={() => pick(t)} aria-pressed={theme === t}
          className={cn("flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold", theme === t ? "border-primary bg-accent text-foreground" : "border-border text-muted-foreground")}>
          {t === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{t === "light" ? "Light mode" : "Dark mode"}
        </button>
      ))}
    </div>
  );
}
