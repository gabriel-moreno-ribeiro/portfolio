import { useEffect, useRef, useState } from "react";

interface ScrambleTextProps {
  texts: string[];
  pauseDuration?: number;
  style?: React.CSSProperties;
}

// Typewriter: types each word character by character, pauses, deletes, cycles.
// Always readable — no random characters.
function ScrambleText({ texts, pauseDuration = 2200, style }: ScrambleTextProps) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState(texts[0].slice(0, 1));
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const target = texts[index];
    clearTimeout(timerRef.current);

    if (phase === "typing") {
      if (displayed.length < target.length) {
        timerRef.current = setTimeout(
          () => setDisplayed(target.slice(0, displayed.length + 1)),
          55
        );
      } else {
        timerRef.current = setTimeout(() => setPhase("deleting"), pauseDuration);
      }
    } else if (phase === "deleting") {
      if (displayed.length > 0) {
        timerRef.current = setTimeout(
          () => setDisplayed((d) => d.slice(0, -1)),
          30
        );
      } else {
        setIndex((i) => (i + 1) % texts.length);
        setPhase("typing");
      }
    }

    return () => clearTimeout(timerRef.current);
  }, [displayed, phase, index, texts, pauseDuration]);

  return (
    <>
      <span aria-hidden="true" style={style}>
        {displayed}
        <span className="typewriter-cursor">|</span>
      </span>
      <span className="sr-only">{texts[index]}</span>
    </>
  );
}

export default ScrambleText;
