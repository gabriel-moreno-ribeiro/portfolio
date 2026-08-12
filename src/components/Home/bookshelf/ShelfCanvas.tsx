import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Book } from "../../../types/book";
import { BookMesh } from "./BookMesh";
import type { ShelfMode } from "./useShelfState";
import {
  SHELF_COLOR,
  SHELF_EDGE_COLOR,
  WALL_COLOR,
  BG_COLOR,
  SHELF_Y,
  SHELF_THICKNESS,
  SHELF_DEPTH,
  CAMERA_POS,
  CAMERA_TARGET,
  CAMERA_FOV,
  BOOK_GAP,
  bookDimensions,
  computeBookPositions,
  visibleHeightAtDistance,
  presentedZForBook,
} from "./shelfConfig";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// ── Shelf plank ──
function ShelfPlank({ totalWidth }: { totalWidth: number }) {
  const plankWidth = totalWidth + 6;
  return (
    <group position={[0, SHELF_Y - SHELF_THICKNESS / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[plankWidth, SHELF_THICKNESS, SHELF_DEPTH]} />
        <meshPhysicalMaterial
          color={SHELF_COLOR}
          roughness={0.6}
          clearcoat={0.08}
          clearcoatRoughness={0.4}
        />
      </mesh>
      <mesh position={[0, 0, SHELF_DEPTH / 2 - 0.02]}>
        <boxGeometry args={[plankWidth, SHELF_THICKNESS, 0.04]} />
        <meshStandardMaterial color={SHELF_EDGE_COLOR} roughness={0.5} />
      </mesh>
    </group>
  );
}

// ── Back wall ──
function BackWall() {
  return (
    <mesh position={[0, 2, -SHELF_DEPTH / 2]} receiveShadow>
      <planeGeometry args={[24, 6]} />
      <meshStandardMaterial color={WALL_COLOR} roughness={1} />
    </mesh>
  );
}

// ── Animated books group ──
function BooksGroup({
  books,
  positions,
  currentIndex,
  mode,
  focusOffsetX,
  dragOffset,
  totalWidth,
  onBookClick,
}: {
  books: Book[];
  positions: number[];
  currentIndex: number;
  mode: ShelfMode;
  focusOffsetX: number;
  dragOffset: number;
  totalWidth: number;
  onBookClick: (index: number) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Clamp displacement: don't let any book go beyond the viewport edge.
  // When shelf < viewport, all positions are valid (shelf always visible).
  // When shelf > viewport, limit so edges don't reveal empty space.
  const aspect = typeof window !== "undefined" ? window.innerWidth / window.innerHeight : 16 / 9;
  const visW = visibleHeightAtDistance(CAMERA_POS[2]) * aspect;
  const halfShelf = totalWidth / 2;
  const halfVisible = visW / 2;
  const maxDisplacement = halfShelf > halfVisible
    ? halfShelf - halfVisible
    : halfShelf;

  const rawTargetX = -(positions[currentIndex] || 0) + (mode === "focus" ? focusOffsetX : 0) + dragOffset;
  const targetX = Math.max(-maxDisplacement, Math.min(maxDisplacement, rawTargetX));

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Use faster lerp during active drag for responsiveness
    const speed = dragOffset !== 0 ? 12 * delta : 6 * delta;
    groupRef.current.position.x = lerp(groupRef.current.position.x, targetX, speed);
  });

  return (
    <group ref={groupRef}>
      {books.map((book, i) => (
        <BookMesh
          key={book.id}
          book={book}
          xPos={positions[i]}
          index={i}
          presentedIndex={currentIndex}
          isPresented={i === currentIndex}
          onClick={() => onBookClick(i)}
        />
      ))}
    </group>
  );
}

// ── Lighting ──
function Lighting() {
  return (
    <>
      <hemisphereLight
        color="#fdf8ef"
        groundColor="#5a4132"
        intensity={0.7}
      />
      <directionalLight
        position={[3, 5, 4]}
        intensity={4.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-1}
        shadow-bias={-0.001}
      />
      <directionalLight
        position={[-2, 3, -1]}
        intensity={0.6}
        color="#ffeedd"
      />
      <pointLight position={[0, 0.5, 3]} intensity={0.4} color="#fff5e6" />
    </>
  );
}

// ── Main canvas component ──
interface ShelfCanvasProps {
  books: Book[];
  currentIndex: number;
  mode: ShelfMode;
  panelWidthPx: number;
  dragOffset: number;
  onBookClick: (index: number) => void;
}

export function ShelfCanvas({ books, currentIndex, mode, panelWidthPx, dragOffset, onBookClick }: ShelfCanvasProps) {
  const [webglFailed, setWebglFailed] = useState(false);
  const positions = useMemo(() => computeBookPositions(books), [books]);

  const totalWidth = useMemo(() => {
    let w = 0;
    books.forEach((b) => {
      w += bookDimensions(b.pages, b.id).thickness + BOOK_GAP;
    });
    return w;
  }, [books]);

  // Convert panel pixel width to world units at presented Z plane
  // On mobile (panel ≥ 80% viewport width), skip horizontal offset
  const focusOffsetX = useMemo(() => {
    if (mode !== "focus" || panelWidthPx === 0) return 0;
    const vpW = typeof window !== "undefined" ? window.innerWidth : 1920;
    if (panelWidthPx > vpW * 0.8) return 0;
    const currentBook = books[currentIndex];
    if (!currentBook) return 0;
    const { height } = bookDimensions(currentBook.pages, currentBook.id);
    const pZ = presentedZForBook(height);
    const dist = CAMERA_POS[2] - pZ;
    const visH = visibleHeightAtDistance(dist);
    const vpH = typeof window !== "undefined" ? window.innerHeight : 900;
    const worldPerPx = visH / vpH;
    return -(panelWidthPx / 2) * worldPerPx;
  }, [mode, books, currentIndex, panelWidthPx]);

  if (webglFailed) {
    return (
      <div className="shelf-fallback">
        {books.map((book, i) => (
          <button key={book.id} className="shelf-fallback__book" onClick={() => onBookClick(i)}>
            {book.cover && <img src={book.cover} alt={book.title} loading="lazy" />}
            <span>{book.title}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.03,
      }}
      camera={{
        position: CAMERA_POS,
        fov: CAMERA_FOV,
        near: 0.1,
        far: 50,
      }}
      style={{ position: "absolute", inset: 0 }}
      onCreated={({ camera, gl: renderer }) => {
        camera.lookAt(...CAMERA_TARGET);
        if (!renderer.capabilities.isWebGL2 && !renderer.getContext()) {
          setWebglFailed(true);
        }
      }}
      onError={() => setWebglFailed(true)}
    >
      <fog attach="fog" args={[BG_COLOR, 10, 26]} />
      <color attach="background" args={[BG_COLOR]} />

      <Lighting />
      <BackWall />
      <ShelfPlank totalWidth={totalWidth} />
      <BooksGroup
        books={books}
        positions={positions}
        currentIndex={currentIndex}
        mode={mode}
        focusOffsetX={focusOffsetX}
        dragOffset={dragOffset}
        totalWidth={totalWidth}
        onBookClick={onBookClick}
      />
    </Canvas>
  );
}
