import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Book } from "../../types/book";
import { getBookDims, BOOK_GAP, computeRowCount, splitIntoRows, computePositions } from "./engine/dims";
import { BookMesh } from "./engine/BookMesh";
import { Furniture } from "./engine/Furniture";

const BOARD_THICKNESS = 0.10;
const SHELF_DEPTH = 1.50;
const VERTICAL_CLEARANCE = 0.30;
const PRESENTED_SCALE = 1.18;
const SHELVED_Z = 0;

// Phase durations in ms
const PHASE_MS = [110, 140, 130, 130, 140, 110];

function smoothstep(t: number) { const c = Math.max(0, Math.min(1, t)); return c * c * (3 - 2 * c); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// Neighbor X spread: subtle push on adjacent books
function neighborSpread(delta: number): number {
  if (delta === 0) return 0;
  return Math.sign(delta) * 0.10 * Math.exp(-Math.abs(delta) / 2.0);
}

interface ChoreState {
  currentIdx: number;
  nextIdx: number | null;
  phase: number; // -1 = idle, 0-5 = active phases
  phaseT: number;
  phaseStart: number;
}

interface SceneProps {
  books: Book[];
  selectedIndex: number;
  onIndexChange: (i: number) => void;
  onFocus: (i: number) => void;
  panelWidthPx: number;
  theme: "light" | "dark";
}

function getThemeColors(theme: "light" | "dark") {
  if (theme === "dark") return {
    bg: "#0a0a1a",
    surface: "#16162e",
    fog: "#0a0a1a",
    wood: "#4a3020",
    woodDark: "#3a2416",
    wall: "#16162e",
    ambient: [0.3, 0.25, 0.22] as [number, number, number],
    dirIntensity: 3.2,
    dirColor: "#ffeedd",
  };
  return {
    bg: "#fff8f4",
    surface: "#ffffff",
    fog: "#fff8f4",
    wood: "#6b4c32",
    woodDark: "#4b3429",
    wall: "#f5ede4",
    ambient: [0.5, 0.42, 0.35] as [number, number, number],
    dirIntensity: 4.2,
    dirColor: "#fff5e0",
  };
}

function Scene({ books, selectedIndex, onIndexChange, onFocus, panelWidthPx, theme }: SceneProps) {
  const { camera, gl, size } = useThree();
  const themeColors = getThemeColors(theme);

  // Layout
  const rowCount = useMemo(() => computeRowCount(books), [books]);
  const rowIndices = useMemo(() => splitIntoRows(books, rowCount), [books, rowCount]);
  const allPositions = useMemo(() => {
    const pos = new Array(books.length).fill(0);
    rowIndices.forEach(row => {
      const rowPos = computePositions(books, row);
      row.forEach(i => { pos[i] = rowPos[i]; });
    });
    return pos;
  }, [books, rowIndices]);

  // Row Y positions and geometry
  const rowSpecs = useMemo(() => {
    const specs: { y: number; maxH: number; maxD: number; width: number }[] = [];
    let curY = BOARD_THICKNESS;
    rowIndices.forEach(row => {
      const maxH = Math.max(...row.map(i => getBookDims(books[i]).height));
      const maxD = Math.max(...row.map(i => getBookDims(books[i]).depth));
      const totalW = row.reduce((s, i) => s + getBookDims(books[i]).thickness + BOOK_GAP, -BOOK_GAP);
      specs.push({ y: curY, maxH, maxD, width: totalW });
      curY += maxH * PRESENTED_SCALE + BOARD_THICKNESS + VERTICAL_CLEARANCE;
    });
    return specs;
  }, [books, rowIndices]);

  const cabinetHeight = rowSpecs.reduce((s, r) => s + r.maxH * PRESENTED_SCALE + BOARD_THICKNESS + VERTICAL_CLEARANCE, 0);
  const cabinetWidth = Math.max(...rowSpecs.map(r => r.width));
  const maxDepth = Math.max(...rowSpecs.map(r => r.maxD), SHELF_DEPTH);

  // Z values per book (derived from row)
  const getRowForBook = useCallback((bi: number) => {
    return rowIndices.findIndex(row => row.includes(bi));
  }, [rowIndices]);

  const getPresentedZ = useCallback((bi: number): number => {
    const ri = getRowForBook(bi);
    if (ri < 0) return 2.0;
    const { maxH } = rowSpecs[ri];
    // Distance needed so book fills ~78% of viewport height
    const fovRad = (camera as THREE.PerspectiveCamera).fov * Math.PI / 180;
    const dist = (maxH * PRESENTED_SCALE) / (2 * 0.78 * Math.tan(fovRad / 2));
    return (camera as THREE.PerspectiveCamera).position.z - dist;
  }, [rowSpecs, camera, getRowForBook]);

  const getRotationLaneZ = useCallback((bi: number): number => {
    const ri = getRowForBook(bi);
    if (ri < 0) return 1.0;
    const { maxH, maxD } = rowSpecs[ri];
    const maxRadius = Math.hypot(maxD, 0.46) / 2 * PRESENTED_SCALE;
    return maxD / 2 + maxRadius + 0.15; // front of cabinet + radius + margin
  }, [rowSpecs, getRowForBook]);

  const getShelvedZ = (bi: number) => SHELVED_Z;

  // Choreography state
  const [chore, setChore] = useState<ChoreState>({ currentIdx: selectedIndex, nextIdx: null, phase: -1, phaseT: 0, phaseStart: 0 });
  const choreRef = useRef(chore);
  choreRef.current = chore;

  // Trigger choreography when selectedIndex changes
  useEffect(() => {
    const cur = choreRef.current;
    if (cur.currentIdx === selectedIndex && cur.phase === -1) return;
    if (cur.phase >= 0) {
      // Already animating — queue by jumping to next target
      // For simplicity: snap to selected immediately if already mid-chore
      setChore({ currentIdx: selectedIndex, nextIdx: null, phase: -1, phaseT: 0, phaseStart: 0 });
      return;
    }
    if (cur.currentIdx === selectedIndex) return;
    setChore({ currentIdx: cur.currentIdx, nextIdx: selectedIndex, phase: 0, phaseT: 0, phaseStart: performance.now() });
  }, [selectedIndex]);

  // Advance choreography
  useFrame(() => {
    const c = choreRef.current;
    if (c.phase < 0 || c.nextIdx === null) return;
    const elapsed = performance.now() - c.phaseStart;
    const dur = PHASE_MS[c.phase] ?? 140;
    const t = Math.min(elapsed / dur, 1);
    if (t < 1) {
      setChore(prev => ({ ...prev, phaseT: t }));
      return;
    }
    if (c.phase < 5) {
      setChore(prev => ({ ...prev, phase: prev.phase + 1, phaseT: 0, phaseStart: performance.now() }));
    } else {
      // Done — commit
      setChore({ currentIdx: c.nextIdx!, nextIdx: null, phase: -1, phaseT: 0, phaseStart: 0 });
    }
  });

  // Camera setup
  const camPosRef = useRef(new THREE.Vector3(0, cabinetHeight / 2, 6));
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const targetZ = cabinetHeight / 2;
    const fovRad = cam.fov * Math.PI / 180;
    const distH = (cabinetHeight * 0.55) / Math.tan(fovRad / 2);
    const distW = (cabinetWidth * 0.55) / Math.tan(fovRad / 2) / (size.width / size.height);
    const dist = Math.max(distH, distW, 3.5);
    camPosRef.current.set(0, targetZ, dist);
    cam.position.copy(camPosRef.current);
    cam.lookAt(0, targetZ, 0);
    cam.near = 0.1;
    cam.far = 60;
    cam.updateProjectionMatrix();
  }, [cabinetHeight, cabinetWidth, camera, size]);

  // Camera setViewOffset for panel offset
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (panelWidthPx === 0) {
      cam.clearViewOffset();
    } else {
      const vpW = size.width, vpH = size.height;
      if (panelWidthPx > vpW * 0.8) { cam.clearViewOffset(); return; }
      const offsetX = panelWidthPx / 2;
      cam.setViewOffset(vpW, vpH, -offsetX / 2, 0, vpW, vpH);
    }
    cam.updateProjectionMatrix();
  }, [panelWidthPx, camera, size]);

  // Fog and background
  const fogColor = new THREE.Color(themeColors.fog);

  const currentPresentedBook = chore.phase === -1 ? chore.currentIdx : (chore.nextIdx ?? chore.currentIdx);

  return (
    <>
      <fog attach="fog" args={[themeColors.fog, 8, 28]} />
      <color attach="background" args={[themeColors.bg]} />

      <hemisphereLight color={new THREE.Color(...themeColors.ambient)} groundColor={themeColors.wood} intensity={0.8} />
      <directionalLight
        position={[2, 5, 4]}
        intensity={themeColors.dirIntensity}
        color={themeColors.dirColor}
        castShadow
        shadow-mapSize-width={window.innerWidth > 700 ? 2048 : 1024}
        shadow-mapSize-height={window.innerWidth > 700 ? 2048 : 1024}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-2}
        shadow-bias={-0.001}
      />
      <pointLight position={[0, cabinetHeight * 0.6, 2.5]} intensity={0.35} color="#fff8f0" />

      <Furniture
        rows={rowSpecs.map((r, i) => ({ y: r.y, maxHeight: r.maxH, width: r.width }))}
        cabinetWidth={cabinetWidth}
        cabinetHeight={cabinetHeight}
        woodColor={themeColors.wood}
        woodDark={themeColors.woodDark}
        wallColor={themeColors.wall}
        boardThickness={BOARD_THICKNESS}
        depth={maxDepth + 0.1}
      />

      {books.map((book, bi) => {
        const ri = getRowForBook(bi);
        const rowSpec = rowSpecs[ri];
        if (!rowSpec) return null;
        const rowCenterY = rowSpec.y + rowSpec.maxH / 2;
        const isPresented = bi === chore.currentIdx && chore.phase === -1;
        const isDimmed = chore.phase === -1 && chore.currentIdx !== bi && currentPresentedBook !== bi;

        let chorePhase = -1;
        let choreT = chore.phaseT;
        if (chore.phase >= 0) {
          if (bi === chore.currentIdx) chorePhase = chore.phase;
          else if (bi === chore.nextIdx && chore.phase >= 3) chorePhase = chore.phase;
        }

        const neighborDelta = bi - chore.currentIdx;
        const neighborOffset = neighborSpread(neighborDelta);

        return (
          <BookMesh
            key={book.id}
            book={book}
            slotX={allPositions[bi]}
            rowY={rowSpec.y}
            isPresented={isPresented}
            isDimmed={isDimmed}
            presentedZ={getPresentedZ(bi)}
            rotationLaneZ={getRotationLaneZ(bi)}
            shelvedZ={getShelvedZ(bi)}
            chorePhase={chorePhase}
            choreT={choreT}
            neighborOffset={neighborOffset}
            onClick={() => { if (isPresented) onFocus(bi); else onIndexChange(bi); }}
            onPointerOver={() => { document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { document.body.style.cursor = ""; }}
            theme={theme}
          />
        );
      })}
    </>
  );
}

interface LibrarySceneProps {
  books: Book[];
  selectedIndex: number;
  onIndexChange: (i: number) => void;
  onFocus: (i: number) => void;
  panelWidthPx: number;
  theme: "light" | "dark";
  webglFailed: boolean;
  onWebglFailed: () => void;
}

export function LibraryScene({
  books, selectedIndex, onIndexChange, onFocus,
  panelWidthPx, theme, webglFailed, onWebglFailed,
}: LibrarySceneProps) {
  if (webglFailed) return null;

  const dpr: [number, number] = window.innerWidth < 700 ? [1, 1.5] : [1, 1.75];

  return (
    <Canvas
      shadows
      dpr={dpr}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ fov: 34, near: 0.1, far: 60 }}
      style={{ position: "absolute", inset: 0 }}
      onCreated={({ gl }) => {
        if (!gl.capabilities.isWebGL2 && !gl.getContext()) onWebglFailed();
      }}
    >
      <Scene
        books={books}
        selectedIndex={selectedIndex}
        onIndexChange={onIndexChange}
        onFocus={onFocus}
        panelWidthPx={panelWidthPx}
        theme={theme}
      />
    </Canvas>
  );
}
