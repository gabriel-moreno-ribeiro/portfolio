import { useCallback, useEffect, useMemo, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import type { Book } from "../../../types/book";

const REST_YAW = 25;
const REST_PITCH = -9;
const YAW_RANGE = 16;
const PITCH_RANGE = 10;
const SPRING = { stiffness: 170, damping: 20, mass: 0.7 } as const;

const NOISE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='128' height='128' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E";

function thicknessFor(pages: number): number {
  return Math.round(Math.min(44, Math.max(15, pages / 13.5)));
}

function hashUnit(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

export interface Book3DProps {
  book: Book;
  width?: number;
  accent?: string;
  showcase?: boolean;
}

export function Book3D({ book, width = 176, accent = "#00d9ff", showcase = false }: Book3DProps) {
  const height = Math.round(width * 1.5);
  const thickness = thicknessFor(book.pages);
  const textColor = book.textColor ?? "#ffffff";

  const [interactive, setInteractive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (showcase) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setInteractive(mq.matches && !reduced);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [reduced, showcase]);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const yaw = useSpring(useTransform(px, [0, 1], [REST_YAW - YAW_RANGE, REST_YAW + YAW_RANGE]), SPRING);
  const pitch = useSpring(useTransform(py, [0, 1], [REST_PITCH + PITCH_RANGE, REST_PITCH - PITCH_RANGE]), SPRING);
  const lift = useSpring(0, SPRING);

  const glareX = useTransform(px, [0, 1], ["12%", "88%"]);
  const glareY = useTransform(py, [0, 1], ["8%", "92%"]);
  const glare = useMotionTemplate`radial-gradient(60% 55% at ${glareX} ${glareY}, rgba(255,255,255,0.30), rgba(255,255,255,0.07) 42%, rgba(255,255,255,0) 70%)`;

  const shadowX = useTransform(yaw, [REST_YAW - YAW_RANGE, REST_YAW + YAW_RANGE], [22, -14]);
  const shadowScale = useTransform(pitch, [REST_PITCH - PITCH_RANGE, REST_PITCH + PITCH_RANGE], [1.1, 0.88]);
  const shadowFade = useTransform(pitch, [REST_PITCH - PITCH_RANGE, REST_PITCH + PITCH_RANGE], [0.9, 0.55]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive) return;
      const r = e.currentTarget.getBoundingClientRect();
      px.set((e.clientX - r.left) / r.width);
      py.set((e.clientY - r.top) / r.height);
    },
    [interactive, px, py]
  );

  const onPointerLeave = useCallback(() => {
    setHovered(false);
    px.set(0.5);
    py.set(0.5);
    lift.set(0);
  }, [px, py, lift]);

  const onPointerEnter = useCallback(() => {
    if (!interactive) return;
    setHovered(true);
    lift.set(-10);
  }, [interactive, lift]);

  const grain = useMemo(() => hashUnit(book.id), [book.id]);
  const hasCover = Boolean(book.cover) && !coverFailed;

  const face: React.CSSProperties = {
    position: "absolute",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  };

  return (
    <div
      style={{ width, height, perspective: 1500, position: "relative", userSelect: "none" }}
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {/* Glow */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: width * 1.15,
          height: height * 0.8,
          x: "-50%",
          y: "-50%",
          background: accent,
          borderRadius: "40%",
          filter: "blur(30px)",
          zIndex: -1,
          pointerEvents: "none",
        }}
        animate={{ opacity: hovered ? 0.22 : 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />

      {/* Shadow */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          bottom: -14,
          width: width * 0.98,
          height: 30,
          marginLeft: -(width * 0.98) / 2,
          x: shadowX,
          scaleX: shadowScale,
          opacity: shadowFade,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(0,0,0,0.85), rgba(0,0,0,0))",
          filter: "blur(12px)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        style={{
          position: "relative",
          height: "100%",
          width: "100%",
          transformStyle: "preserve-3d",
          rotateY: showcase ? REST_YAW : yaw,
          rotateX: showcase ? REST_PITCH : pitch,
          y: showcase ? 0 : lift,
          willChange: hovered ? "transform" : "auto",
        }}
      >
        {/* Front */}
        <div
          style={{
            ...face,
            inset: 0,
            transform: `translateZ(${thickness / 2}px)`,
            borderRadius: "2px 5px 5px 2px",
            overflow: "hidden",
            background: book.coverColor,
            boxShadow: "inset 14px 0 22px -14px rgba(0,0,0,0.95), inset -1px 0 0 rgba(255,255,255,0.10), 0 0 0 1px rgba(255,255,255,0.09)",
          }}
        >
          {hasCover ? (
            <img
              src={book.cover}
              alt={`Cover of ${book.title}`}
              width={width}
              height={height}
              loading="lazy"
              decoding="async"
              onError={() => setCoverFailed(true)}
              draggable={false}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <GeneratedCover book={book} textColor={textColor} grain={grain} width={width} />
          )}

          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.22,
              mixBlendMode: "overlay",
              backgroundImage: `url("${NOISE}")`,
              backgroundSize: "128px 128px",
              pointerEvents: "none",
            }}
          />

          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: "0",
              left: 0,
              top: 0,
              bottom: 0,
              width: Math.max(10, thickness * 0.45),
              background: "linear-gradient(to right, rgba(0,0,0,0.55), rgba(0,0,0,0.18) 45%, rgba(255,255,255,0.07) 92%, rgba(0,0,0,0.28))",
              pointerEvents: "none",
            }}
          />

          <motion.div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              mixBlendMode: "soft-light",
              backgroundImage: glare,
              pointerEvents: "none",
            }}
            animate={{ opacity: hovered ? 1 : 0.35 }}
            transition={{ duration: 0.25 }}
          />
        </div>

        {/* Back */}
        <div
          style={{
            ...face,
            inset: 0,
            transform: `translateZ(${-thickness / 2}px) rotateY(180deg)`,
            borderRadius: "5px 2px 2px 5px",
            background: `linear-gradient(135deg, ${book.coverColor}, rgba(0,0,0,0.55))`,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        />

        {/* Spine */}
        <div
          style={{
            ...face,
            top: 0,
            left: "50%",
            width: thickness,
            height: "100%",
            marginLeft: -thickness / 2,
            transform: `rotateY(-90deg) translateZ(${width / 2}px)`,
            background: `linear-gradient(to right, rgba(0,0,0,0.62), ${book.coverColor} 38%, ${book.coverColor} 62%, rgba(0,0,0,0.45))`,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {thickness >= 22 && (
            <span
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                fontSize: Math.min(11, thickness * 0.34),
                letterSpacing: "0.04em",
                color: textColor,
                opacity: 0.82,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxHeight: height - 28,
                fontWeight: 500,
              }}
            >
              {book.title}
            </span>
          )}
        </div>

        {/* Fore edge */}
        <div
          style={{
            ...face,
            top: 2,
            left: "50%",
            width: thickness - 2,
            height: "calc(100% - 4px)",
            marginLeft: -(thickness - 2) / 2,
            transform: `rotateY(90deg) translateZ(${width / 2 - 1}px)`,
            borderRadius: 1,
            background: "repeating-linear-gradient(to right, #efe9dc 0px, #efe9dc 1px, #c9c1ad 1px, #c9c1ad 2px)",
            boxShadow: "inset 0 8px 14px -8px rgba(0,0,0,0.55), inset 0 -8px 14px -8px rgba(0,0,0,0.55)",
          }}
        />

        {/* Head */}
        <div
          style={{
            ...face,
            left: 0,
            top: "50%",
            width: "100%",
            height: thickness,
            marginTop: -thickness / 2,
            transform: `rotateX(90deg) translateZ(${height / 2}px)`,
            backgroundImage: [
              "linear-gradient(to right, rgba(0,0,0,0.55), rgba(0,0,0,0) 14%, rgba(0,0,0,0) 88%, rgba(0,0,0,0.35))",
              "repeating-linear-gradient(to bottom, #f7f2e8 0 1px, #d6cfbd 1px 2px)",
            ].join(","),
          }}
        />

        {/* Tail */}
        <div
          style={{
            ...face,
            left: 0,
            top: "50%",
            width: "100%",
            height: thickness,
            marginTop: -thickness / 2,
            transform: `rotateX(-90deg) translateZ(${height / 2}px)`,
            backgroundImage: [
              "linear-gradient(to top, rgba(0,0,0,0.75) 0 2px, rgba(0,0,0,0.35) 2px)",
              "repeating-linear-gradient(to top, #ded7c8 0 1px, #b8b09c 1px 2px)",
            ].join(","),
          }}
        />
      </motion.div>
    </div>
  );
}

function GeneratedCover({ book, textColor, grain, width }: { book: Book; textColor: string; grain: number; width: number }) {
  const scale = width / 190;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: `${20 * scale}px ${16 * scale}px`,
        background: `linear-gradient(${140 + grain * 60}deg, rgba(255,255,255,0.13), rgba(0,0,0,0.32))`,
      }}
    >
      <div style={{ width: 26 * scale, height: 2, background: textColor, opacity: 0.75 }} />
      <div>
        <p style={{ color: textColor, fontSize: Math.max(11, 15 * scale), lineHeight: 1.22, fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
          {book.title}
        </p>
        {book.subtitle && (
          <p style={{ color: textColor, opacity: 0.62, fontSize: Math.max(8, 9.5 * scale), lineHeight: 1.35, margin: `${6 * scale}px 0 0` }}>
            {book.subtitle}
          </p>
        )}
      </div>
      <div>
        <div style={{ height: 1, background: textColor, opacity: 0.3, marginBottom: 8 * scale }} />
        <p style={{ color: textColor, opacity: 0.85, fontSize: Math.max(8, 9.5 * scale), letterSpacing: "0.09em", textTransform: "uppercase", margin: 0 }}>
          {book.author}
        </p>
      </div>
    </div>
  );
}

export default Book3D;
