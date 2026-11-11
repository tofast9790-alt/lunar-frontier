import { useEffect, useState } from "react";
import { useSave } from "@/game/persistence/save";

/** Reveals text progressively unless the player chose instant text or reduced motion. */
export function useTypewriter(text: string, speedMs = 18) {
  const { settings } = useSave();
  const instant = settings.textSpeed === "instant" || settings.reducedMotion;
  const [count, setCount] = useState(instant ? text.length : 0);

  useEffect(() => {
    if (instant) {
      setCount(text.length);
      return;
    }
    setCount(0);
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          window.clearInterval(id);
          return c;
        }
        return c + 2;
      });
    }, speedMs);
    return () => window.clearInterval(id);
  }, [text, instant, speedMs]);

  const done = count >= text.length;
  return { shown: text.slice(0, count), done, finish: () => setCount(text.length) };
}
