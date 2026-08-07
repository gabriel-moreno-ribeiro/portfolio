import { useCallback, useEffect, useRef, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

interface ScrambleTextProps {
  texts: string[];
  speed?: number;
  pauseDuration?: number;
  style?: React.CSSProperties;
}

// Scramble decode: all chars random at once, reveals left-to-right.
// speed=40 → full decode in ~(word.length * 20ms) ≈ 120-160ms — always readable fast.
function ScrambleText({
  texts,
  speed = 40,
  pauseDuration = 2200,
  style,
}: ScrambleTextProps) {
  const [display, setDisplay] = useState(texts[0]);
  const indexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const scrambleTo = useCallback(
    (target: string) => {
      let iteration = 0;
      clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        setDisplay(
          target
            .split("")
            .map((char, i) => {
              if (i < iteration) return char;
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join("")
        );

        iteration += 1;
        if (iteration > target.length) {
          clearInterval(intervalRef.current);
          setDisplay(target);
        }
      }, speed / 2);
    },
    [speed]
  );

  useEffect(() => {
    const cycle = () => {
      indexRef.current = (indexRef.current + 1) % texts.length;
      scrambleTo(texts[indexRef.current]);
      timeoutRef.current = setTimeout(cycle, pauseDuration + texts[indexRef.current].length * (speed / 2));
    };

    timeoutRef.current = setTimeout(cycle, pauseDuration);

    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
    };
  }, [texts, speed, pauseDuration, scrambleTo]);

  return (
    <>
      <span aria-hidden="true" style={style}>{display}</span>
      <span className="sr-only">{texts[indexRef.current]}</span>
    </>
  );
}

export default ScrambleText;
