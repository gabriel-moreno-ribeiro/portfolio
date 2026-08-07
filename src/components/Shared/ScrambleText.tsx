import { useEffect, useRef, useState } from "react";

interface ScrambleTextProps {
  texts: string[];
  pauseDuration?: number;
  style?: React.CSSProperties;
}

// Cycles through texts with a fast fade — no scramble chars, always readable.
// Screen readers get the real word via sr-only; the visible span is aria-hidden.
function ScrambleText({
  texts,
  pauseDuration = 2500,
  style,
}: ScrambleTextProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const cycle = () => {
      // fade out
      setVisible(false);
      timerRef.current = setTimeout(() => {
        setIndex((i) => (i + 1) % texts.length);
        // fade in
        setVisible(true);
        timerRef.current = setTimeout(cycle, pauseDuration);
      }, 300);
    };

    timerRef.current = setTimeout(cycle, pauseDuration);
    return () => clearTimeout(timerRef.current);
  }, [texts, pauseDuration]);

  return (
    <>
      <span
        aria-hidden="true"
        style={{
          ...style,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease",
          display: "inline-block",
        }}
      >
        {texts[index]}
      </span>
      <span className="sr-only">{texts[index]}</span>
    </>
  );
}

export default ScrambleText;
