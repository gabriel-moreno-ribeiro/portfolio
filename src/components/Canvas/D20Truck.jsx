import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";

const ASSEMBLY_CONFIG = [
  { material: "tire", dir: [1.8, -1.5, 1.2], rotate: [0, 0, 0.8], phase: 0.0 },
  { material: "tire", index: 1, dir: [-1.8, -1.5, 1.2], rotate: [0, 0, -0.8], phase: 0.03 },
  { material: "tire", index: 2, dir: [1.8, -1.5, -1.2], rotate: [0, 0, 0.8], phase: 0.06 },
  { material: "tire", index: 3, dir: [-1.8, -1.5, -1.2], rotate: [0, 0, -0.8], phase: 0.09 },
  { material: "body", dir: [0, 2.5, 0], rotate: [0, 0, 0], phase: 0.2 },
  { material: "interior", dir: [0, 2.5, 0], rotate: [0, 0, 0], phase: 0.2 },
  { material: "glass", dir: [0, 3.5, -0.3], rotate: [-0.3, 0, 0], phase: 0.7 },
];

const EXPLOSION_STRENGTH = 200;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function D20Truck({ progressRef, groupRef, ...props }) {
  const { scene } = useGLTF("/assets/3d/D20_v2.glb");
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const meshDataRef = useRef([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (!clonedScene || initialized.current) return;

    const meshes = [];
    const tireCounts = {};

    clonedScene.traverse((child) => {
      if (!child.isMesh) return;

      child.userData.originalPosition = child.position.clone();
      child.userData.originalRotation = child.rotation.clone();

      const matName = child.material?.name || "";
      let config = null;

      if (matName === "tire") {
        const idx = tireCounts["tire"] || 0;
        tireCounts["tire"] = idx + 1;
        config = ASSEMBLY_CONFIG.find(
          (c) => c.material === "tire" && (c.index === idx || (c.index === undefined && idx === 0))
        );
        if (!config) {
          config = { dir: [idx % 2 === 0 ? 1.8 : -1.8, -1.5, idx < 2 ? 1.2 : -1.2], rotate: [0, 0, 0.5], phase: idx * 0.05 };
        }
      } else {
        config = ASSEMBLY_CONFIG.find((c) => c.material === matName);
      }

      if (!config) {
        const center = new Vector3();
        child.getWorldPosition(center);
        const dir = center.normalize();
        config = {
          dir: [dir.x || 0.1, dir.y + 1.5, dir.z || 0.1],
          rotate: [0, 0, 0],
          phase: 0.3,
        };
      }

      meshes.push({ mesh: child, config });
    });

    meshDataRef.current = meshes;
    initialized.current = true;
  }, [clonedScene]);

  useFrame(() => {
    const progress = progressRef.current;
    const data = meshDataRef.current;
    if (!data.length) return;

    for (let i = 0; i < data.length; i++) {
      const { mesh, config } = data[i];
      const { dir, rotate, phase } = config;
      const orig = mesh.userData.originalPosition;
      const origRot = mesh.userData.originalRotation;
      if (!orig || !origRot) continue;

      const phaseEnd = Math.min(phase + 0.4, 1.0);
      const localProgress = Math.max(0, Math.min(1, (progress - phase) / (phaseEnd - phase)));
      const eased = easeInOutCubic(localProgress);

      const displacement = (1 - eased) * EXPLOSION_STRENGTH;

      mesh.position.set(
        orig.x + dir[0] * displacement,
        orig.y + dir[1] * displacement,
        orig.z + dir[2] * displacement
      );

      mesh.rotation.set(
        origRot.x + rotate[0] * (1 - eased) * 2,
        origRot.y + rotate[1] * (1 - eased) * 2,
        origRot.z + rotate[2] * (1 - eased) * 2
      );
    }
  });

  return (
    <group ref={groupRef} {...props} dispose={null}>
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload("/assets/3d/D20_v2.glb");
