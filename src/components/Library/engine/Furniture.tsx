import { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

interface RowSpec {
  y: number;        // bottom of plank
  maxHeight: number;
  width: number;
}

interface FurnitureProps {
  rows: RowSpec[];
  cabinetWidth: number;
  cabinetHeight: number;
  woodColor: string;
  woodDark: string;
  wallColor: string;
  boardThickness: number;
  depth: number; // cabinet depth
}

const SIDE_W = 0.12;

export function Furniture({
  rows,
  cabinetWidth,
  cabinetHeight,
  woodColor,
  woodDark,
  wallColor,
  boardThickness,
  depth,
}: FurnitureProps) {
  const woodMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: woodColor, roughness: 0.55, clearcoat: 0.08, clearcoatRoughness: 0.4,
  }), [woodColor]);
  const woodDarkMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: woodDark, roughness: 0.65,
  }), [woodDark]);
  const backMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: wallColor, roughness: 0.9,
  }), [wallColor]);

  const totalW = cabinetWidth + SIDE_W * 2;

  return (
    <group>
      {/* Shelving planks — one per row bottom + a top plank */}
      {rows.map((row, i) => (
        <mesh key={`plank-${i}`} position={[0, row.y - boardThickness / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[totalW, boardThickness, depth]} />
          <primitive object={woodMat} />
        </mesh>
      ))}
      {/* Top board */}
      <mesh position={[0, cabinetHeight + boardThickness / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[totalW, boardThickness, depth]} />
        <primitive object={woodMat} />
      </mesh>
      {/* Bottom board */}
      <mesh position={[0, -boardThickness / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[totalW, boardThickness, depth]} />
        <primitive object={woodMat} />
      </mesh>
      {/* Left side */}
      <mesh position={[-(cabinetWidth / 2 + SIDE_W / 2), cabinetHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[SIDE_W, cabinetHeight + boardThickness * 2, depth]} />
        <primitive object={woodMat} />
      </mesh>
      {/* Right side */}
      <mesh position={[(cabinetWidth / 2 + SIDE_W / 2), cabinetHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[SIDE_W, cabinetHeight + boardThickness * 2, depth]} />
        <primitive object={woodMat} />
      </mesh>
      {/* Back panel */}
      <mesh position={[0, cabinetHeight / 2, -(depth / 2 - 0.02)]} receiveShadow>
        <planeGeometry args={[totalW, cabinetHeight + boardThickness * 2]} />
        <primitive object={backMat} />
      </mesh>
      {/* Front edge strips on planks */}
      {rows.map((row, i) => (
        <mesh key={`edge-${i}`} position={[0, row.y - boardThickness / 2, depth / 2 - 0.015]}>
          <boxGeometry args={[totalW, boardThickness, 0.03]} />
          <primitive object={woodDarkMat} />
        </mesh>
      ))}
    </group>
  );
}
