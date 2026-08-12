import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Book } from "../../../types/book";
import {
  bookDimensions,
  bookFinish,
  pageColor,
  SHELF_Y,
  PRESENTED_SCALE,
  PRESENTED_Y_OFFSET,
  presentedZForBook,
  neighborOffsetX,
  createSpineCanvas,
  createProceduralCover,
} from "./shelfConfig";

const loader = new THREE.TextureLoader();

let fontReady = false;
const fontPromise = document.fonts.ready.then(() => { fontReady = true; });

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

interface BookMeshProps {
  book: Book;
  xPos: number;
  index: number;
  presentedIndex: number;
  isPresented: boolean;
  onClick?: () => void;
}

export function BookMesh({ book, xPos, index, presentedIndex, isPresented, onClick }: BookMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [coverTexture, setCoverTexture] = useState<THREE.Texture | null>(null);
  const coverTexRef = useRef<THREE.Texture | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(fontReady);
  const { gl } = useThree();

  const { width, height, thickness } = bookDimensions(book.pages, book.id);
  const bookY = SHELF_Y + height / 2;
  const finish = bookFinish(book.id);
  const pgColor = pageColor(book.id);

  useEffect(() => {
    if (!fontReady) {
      fontPromise.then(() => setFontsLoaded(true));
    }
  }, []);

  // Load cover texture within ±5 window (network resource)
  const coverWindow = Math.abs(index - presentedIndex) <= 5;
  useEffect(() => {
    if (!book.cover || !coverWindow) return;
    let cancelled = false;
    loader.load(
      book.cover,
      (tex) => {
        if (cancelled) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.generateMipmaps = true;
        tex.anisotropy = gl.capabilities.getMaxAnisotropy();
        coverTexRef.current = tex;
        setCoverTexture(tex);
      },
      undefined,
      () => {}
    );
    return () => {
      cancelled = true;
      if (coverTexRef.current) {
        coverTexRef.current.dispose();
        coverTexRef.current = null;
        setCoverTexture(null);
      }
    };
  }, [book.cover, coverWindow]);

  // Procedural cover (fallback for books without cover image)
  const proceduralCoverTex = useMemo(() => {
    if (book.cover) return null;
    if (!fontsLoaded) return null;
    const canvas = createProceduralCover(book.title, book.author, book.coverColor, width, height);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = gl.capabilities.getMaxAnisotropy();
    return tex;
  }, [book.title, book.author, book.coverColor, book.cover, width, height, fontsLoaded]);

  // Spine texture — always generated (procedural, no network cost)
  const spineTex = useMemo(() => {
    if (!fontsLoaded) return null;
    const canvas = createSpineCanvas(book.title, book.author, book.coverColor, height, thickness);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = gl.capabilities.getMaxAnisotropy();
    return tex;
  }, [book.title, book.author, book.coverColor, height, thickness, fontsLoaded]);

  // Multi-material array: [+x, -x, +y, -y, +z, -z]
  const materials = useMemo(() => {
    const page = new THREE.MeshStandardMaterial({
      color: pgColor,
      roughness: 0.9,
    });
    const spineOpts: ConstructorParameters<typeof THREE.MeshStandardMaterial>[0] = {
      color: book.coverColor,
      roughness: finish.roughness,
    };
    if (spineTex) {
      spineOpts.map = spineTex;
    }
    const spine = new THREE.MeshStandardMaterial(spineOpts);

    const frontOpts: ConstructorParameters<typeof THREE.MeshPhysicalMaterial>[0] = {
      color: book.coverColor,
      roughness: finish.roughness,
      clearcoat: finish.clearcoat,
    };
    const tex = coverTexture || proceduralCoverTex;
    if (tex) {
      frontOpts.map = tex;
      frontOpts.color = "#ffffff";
    }
    const front = new THREE.MeshPhysicalMaterial(frontOpts);
    const back = new THREE.MeshStandardMaterial({
      color: book.coverColor,
      roughness: finish.roughness,
    });

    return [
      back,          // +x (back cover)
      front,         // -x (front cover — faces camera at rot PI/2)
      page.clone(),  // +y (head)
      page.clone(),  // -y (tail)
      spine,         // +z (spine — faces camera at rot 0)
      page,          // -z (fore-edge)
    ];
  }, [coverTexture, proceduralCoverTex, spineTex, book.coverColor, finish.roughness, finish.clearcoat, pgColor]);

  // Update front material when cover texture loads
  useEffect(() => {
    if (coverTexture && materials[1] instanceof THREE.MeshPhysicalMaterial) {
      materials[1].map = coverTexture;
      materials[1].color.set("#ffffff");
      materials[1].needsUpdate = true;
    }
  }, [coverTexture, materials]);

  // Animation targets
  const pZ = presentedZForBook(height);
  const targetPos = useMemo(() => {
    const spreadX = neighborOffsetX(index, presentedIndex);
    const z = isPresented ? pZ : 0;
    const y = isPresented ? bookY + PRESENTED_Y_OFFSET : bookY;
    return new THREE.Vector3(xPos + spreadX, y, z);
  }, [xPos, bookY, isPresented, pZ, index, presentedIndex]);

  const targetRotY = isPresented ? Math.PI / 2 : 0;
  const targetRotX = isPresented ? -0.08 : 0;
  const targetScale = isPresented ? PRESENTED_SCALE : 1;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const speed = 8 * delta;

    groupRef.current.position.x = lerp(groupRef.current.position.x, targetPos.x, speed);
    groupRef.current.position.y = lerp(groupRef.current.position.y, targetPos.y, speed);
    groupRef.current.position.z = lerp(groupRef.current.position.z, targetPos.z, speed);

    groupRef.current.rotation.y = lerp(groupRef.current.rotation.y, targetRotY, speed);
    groupRef.current.rotation.x = lerp(groupRef.current.rotation.x, targetRotX, speed);

    const s = lerp(groupRef.current.scale.x, targetScale, speed);
    groupRef.current.scale.set(s, s, s);
  });

  return (
    <group
      ref={groupRef}
      position={[xPos, bookY, 0]}
    >
      <mesh
        material={materials}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <boxGeometry args={[thickness, height, width]} />
      </mesh>
    </group>
  );
}
