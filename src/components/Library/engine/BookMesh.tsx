import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Book } from "../../../types/book";
import { getBookDims, getBookFinish } from "./dims";
import { createSpineCanvas, createCoverCanvas } from "./spine";

const textureLoader = new THREE.TextureLoader();

// Shared geometry per thickness/height/depth combo would be ideal but
// books have unique dimensions, so we create per-book and share the box shape.
let fontReady = false;
const fontPromise = typeof document !== "undefined"
  ? document.fonts.ready.then(() => { fontReady = true; })
  : Promise.resolve();

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

interface BookMeshProps {
  book: Book;
  // Position in world space (slot position)
  slotX: number;
  rowY: number;
  // Presentation state
  isPresented: boolean;
  isDimmed: boolean;
  presentedZ: number;
  rotationLaneZ: number;
  shelvedZ: number;
  chorePhase: number; // 0-5 for the six phases, -1 = idle
  choreT: number;     // 0..1 within phase
  neighborOffset: number; // subtle x spread
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
  // Theme
  theme: "light" | "dark";
}

function smoothstep(t: number) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export function BookMesh({
  book, slotX, rowY,
  isPresented, isDimmed,
  presentedZ, rotationLaneZ, shelvedZ,
  chorePhase, choreT,
  neighborOffset,
  onClick, onPointerOver, onPointerOut,
  theme,
}: BookMeshProps) {
  const { gl } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const { thickness, height, depth, tiltDeg } = getBookDims(book);
  const finish = getBookFinish(book);
  const bookY = rowY + height / 2;

  const [fontsOk, setFontsOk] = useState(fontReady);
  const [spineTex, setSpineTex] = useState<THREE.Texture | null>(null);
  const [coverTex, setCoverTex] = useState<THREE.Texture | null>(null);
  const coverTexRef = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    if (!fontReady) fontPromise.then(() => setFontsOk(true));
  }, []);

  // Theme-aware spine text color
  const textColor = theme === "dark" ? "rgba(240,230,210,0.90)" : "rgba(255,255,255,0.92)";

  // Spine texture — regenerate when fonts load or theme changes
  useEffect(() => {
    if (!fontsOk) return;
    let cancelled = false;
    createSpineCanvas({ title: book.title, author: book.author, color: book.coverColor, height, thickness, textColor })
      .then(canvas => {
        if (cancelled) return;
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = gl.capabilities.getMaxAnisotropy();
        setSpineTex(prev => { prev?.dispose(); return tex; });
      });
    return () => { cancelled = true; };
  }, [fontsOk, book.title, book.author, book.coverColor, height, thickness, textColor, gl]);

  // Cover texture — lazy, loaded only when presented
  useEffect(() => {
    if (!isPresented) return;
    if (!book.cover) {
      // Procedural cover fallback
      if (!fontsOk) return;
      let cancelled = false;
      createCoverCanvas(book.title, book.author, book.coverColor).then(canvas => {
        if (cancelled) return;
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = gl.capabilities.getMaxAnisotropy();
        coverTexRef.current = tex;
        setCoverTex(tex);
      });
      return () => { cancelled = true; };
    }

    let cancelled = false;
    textureLoader.load(book.cover, tex => {
      if (cancelled) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.generateMipmaps = true;
      tex.anisotropy = gl.capabilities.getMaxAnisotropy();
      coverTexRef.current = tex;
      setCoverTex(tex);
    }, undefined, () => {
      // On error, generate procedural cover
      if (cancelled || !fontsOk) return;
      createCoverCanvas(book.title, book.author, book.coverColor).then(canvas => {
        if (cancelled) return;
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        coverTexRef.current = tex;
        setCoverTex(tex);
      });
    });
    return () => {
      cancelled = true;
      if (coverTexRef.current) {
        coverTexRef.current.dispose();
        coverTexRef.current = null;
        setCoverTex(null);
      }
    };
  }, [isPresented, book.cover, book.title, book.author, book.coverColor, fontsOk, gl]);

  // Dispose spine on unmount
  useEffect(() => () => { spineTex?.dispose(); }, []);

  // Materials — [+x back, -x front, +y top, -y bottom, +z spine, -z fore-edge]
  const materials = useMemo(() => {
    const page = new THREE.MeshStandardMaterial({ color: finish.pageColor, roughness: 0.88 });
    const backMat = new THREE.MeshStandardMaterial({ color: book.coverColor, roughness: finish.roughness });
    const spineMat = new THREE.MeshStandardMaterial({ color: book.coverColor, roughness: finish.roughness });
    if (spineTex) spineMat.map = spineTex;
    const frontOpts: ConstructorParameters<typeof THREE.MeshPhysicalMaterial>[0] = {
      color: book.coverColor, roughness: finish.roughness, clearcoat: finish.clearcoat,
    };
    if (coverTex) { frontOpts.map = coverTex; frontOpts.color = "#ffffff"; }
    const frontMat = new THREE.MeshPhysicalMaterial(frontOpts);
    return [backMat, frontMat, page.clone(), page.clone(), spineMat, page];
  }, [spineTex, coverTex, book.coverColor, finish.roughness, finish.clearcoat, finish.pageColor]);

  // Update front material when cover loads without remounting
  useEffect(() => {
    if (coverTex && materials[1] instanceof THREE.MeshPhysicalMaterial) {
      materials[1].map = coverTex;
      materials[1].color.set("#ffffff");
      materials[1].needsUpdate = true;
    }
  }, [coverTex, materials]);

  // Compute target pose from choreography state
  const targetPose = useMemo(() => {
    const ss = smoothstep(choreT);

    if (chorePhase === -1) {
      // Idle / shelved
      return { x: slotX + neighborOffset, y: bookY, z: shelvedZ, yaw: 0, scale: 1 };
    }

    // Six phases:
    // 0: recede current  (shelvedZ → rotationLaneZ, scale 1→1)
    // 1: rotate current  (yaw 0 → PI/2)
    // 2: store current   (rotationLaneZ → shelvedZ)
    // 3: extract next    (shelvedZ → rotationLaneZ)
    // 4: rotate next     (yaw PI/2 → 0)
    // 5: seat next       (rotationLaneZ → presentedZ, scale 1→1.18)

    if (isPresented) {
      if (chorePhase === 3) return { x: slotX, y: bookY + 0.10 * ss, z: lerp(shelvedZ, rotationLaneZ, ss), yaw: Math.PI / 2, scale: 1 };
      if (chorePhase === 4) return { x: slotX, y: bookY + 0.10, z: rotationLaneZ, yaw: lerp(Math.PI / 2, 0, ss), scale: 1 };
      if (chorePhase === 5) return { x: slotX, y: bookY + lerp(0.10, 0.22, ss), z: lerp(rotationLaneZ, presentedZ, ss), yaw: 0, scale: lerp(1, 1.18, ss) };
      // Fully seated
      return { x: slotX, y: bookY + 0.22, z: presentedZ, yaw: 0, scale: 1.18 };
    } else {
      if (chorePhase === 0) return { x: slotX + neighborOffset, y: bookY + 0.22 * (1 - ss), z: lerp(presentedZ, rotationLaneZ, ss), yaw: 0, scale: lerp(1.18, 1, ss) };
      if (chorePhase === 1) return { x: slotX, y: bookY, z: rotationLaneZ, yaw: lerp(0, Math.PI / 2, ss), scale: 1 };
      if (chorePhase === 2) return { x: slotX, y: bookY, z: lerp(rotationLaneZ, shelvedZ, ss), yaw: Math.PI / 2, scale: 1 };
      return { x: slotX + neighborOffset, y: bookY, z: shelvedZ, yaw: 0, scale: 1 };
    }
  }, [isPresented, chorePhase, choreT, slotX, bookY, shelvedZ, rotationLaneZ, presentedZ, neighborOffset]);

  // Smooth animation toward target
  const currentPose = useRef({ x: slotX, y: bookY, z: shelvedZ, yaw: 0, scale: 1 });

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    const lambda = chorePhase >= 0 ? 18 : 10;
    const a = 1 - Math.exp(-lambda * dt);
    const c = currentPose.current;
    c.x = lerp(c.x, targetPose.x, a);
    c.y = lerp(c.y, targetPose.y, a);
    c.z = lerp(c.z, targetPose.z, a);
    c.yaw = lerp(c.yaw, targetPose.yaw, Math.min(a * 1.2, 1));
    c.scale = lerp(c.scale, targetPose.scale, a);

    groupRef.current.position.set(c.x, c.y, c.z);
    groupRef.current.rotation.y = c.yaw;
    groupRef.current.rotation.z = (tiltDeg * Math.PI / 180) * (isPresented ? 0 : 1);
    groupRef.current.scale.setScalar(c.scale);

    // Dimming via emissive
    if (meshRef.current) {
      const targetDim = isDimmed ? 0.25 : 1.0;
      materials.forEach(m => {
        if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhysicalMaterial) {
          // Lerp color intensity via emissiveIntensity trick: darken roughness temporarily
          // Better: reduce diffuse by setting color. We use a separate opacity approach.
          // Simplest: material.color.multiplyScalar — but that's destructive.
          // Instead we track a dimAlpha and set transparent+opacity.
          m.transparent = isDimmed;
          m.opacity = lerp(m.opacity ?? 1, targetDim, a * 0.5);
          m.needsUpdate = false; // avoid GPU flush every frame
        }
      });
    }
  });

  const geo = useMemo(
    () => new THREE.BoxGeometry(thickness, height, depth),
    [thickness, height, depth]
  );

  return (
    <group ref={groupRef} position={[slotX, bookY, shelvedZ]}>
      <mesh
        ref={meshRef}
        geometry={geo}
        material={materials}
        castShadow
        receiveShadow
        onClick={e => { e.stopPropagation(); onClick(); }}
        onPointerOver={e => { e.stopPropagation(); onPointerOver(); }}
        onPointerOut={() => onPointerOut()}
      />
      {/* Pick proxy — same bounding box, invisible */}
      <mesh visible={false}>
        <boxGeometry args={[thickness + 0.02, height + 0.02, depth + 0.02]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}
