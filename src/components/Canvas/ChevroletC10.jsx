import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Vector3 } from "three";

const EXPLOSION_CONFIG = {
  "Hood": { dir: [0, 1.5, -1.2], rotate: [-0.6, 0, 0], phase: 0.0 },
  "Engine": { dir: [0, 2.0, -2.0], rotate: [0, 0, 0], phase: 0.1 },
  "Details.005": { dir: [0, 1.5, -1.8], rotate: [0, 0.2, 0], phase: 0.12 },
  "Paint.007": { dir: [0, 1.2, -1.5], rotate: [0, 0, 0.1], phase: 0.08 },
  "Details 2.003": { dir: [0.5, 1.0, -1.6], rotate: [0, 0, 0], phase: 0.15 },
  "Interior": { dir: [0, 1.8, 0], rotate: [0, 0, 0], phase: 0.25 },
  "Couch": { dir: [0, 2.5, 0.5], rotate: [0.2, 0, 0], phase: 0.3 },
  "Detail": { dir: [0, 2.2, 0.3], rotate: [0, 0.1, 0], phase: 0.32 },
  "Steer": { dir: [-0.8, 1.5, -0.5], rotate: [0.3, 0, 0.3], phase: 0.28 },
  "Window.002": { dir: [0, 2.0, 0], rotate: [0, 0, 0], phase: 0.35 },
  "Body": { dir: [0, 0.5, 0], rotate: [0, 0, 0], phase: 0.4 },
  "Paint": { dir: [0, 0.3, 0], rotate: [0, 0, 0], phase: 0.4 },
  "Details": { dir: [0.3, 0.4, 0.2], rotate: [0, 0, 0], phase: 0.42 },
  "Details_2.006": { dir: [-0.3, 0.4, 0.2], rotate: [0, 0, 0], phase: 0.42 },
  "Headlights": { dir: [0, 0.5, -1.5], rotate: [0, 0, 0], phase: 0.2 },
  "Tailights": { dir: [0, 0.5, 1.5], rotate: [0, 0, 0], phase: 0.2 },
  "Sidelights.002": { dir: [1.0, 0.3, 0], rotate: [0, 0, 0], phase: 0.22 },
  "Plates": { dir: [0, -0.5, 1.8], rotate: [0.3, 0, 0], phase: 0.18 },
  "Tire.000": { dir: [1.5, -0.5, 0], rotate: [0, 0, 0.4], phase: 0.45 },
  "Middle.000": { dir: [1.5, -0.3, 0], rotate: [0, 0, 0.4], phase: 0.47 },
  "Ring.001": { dir: [1.8, -0.4, 0], rotate: [0, 0, 0.5], phase: 0.46 },
};

const EXPLOSION_STRENGTH = 150;

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function ChevroletC10({ progressRef, groupRef, ...props }) {
  const { scene, materials } = useGLTF("/assets/3d/1965_chevrolet_c10.glb");
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const meshDataRef = useRef([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (!clonedScene || initialized.current) return;

    // Paint the car red
    clonedScene.traverse((child) => {
      if (!child.isMesh) return;
      if (child.material?.name === "Paint" || child.material?.name === "Paint.007") {
        child.material = child.material.clone();
        child.material.color = new Color(0xcc0000);
        child.material.needsUpdate = true;
      }
    });

    const meshes = [];
    clonedScene.traverse((child) => {
      if (!child.isMesh) return;

      child.userData.originalPosition = child.position.clone();
      child.userData.originalRotation = child.rotation.clone();

      let config = null;
      for (const [key, cfg] of Object.entries(EXPLOSION_CONFIG)) {
        if (child.name.includes(key)) {
          config = cfg;
          break;
        }
      }

      if (!config) {
        const center = new Vector3();
        child.getWorldPosition(center);
        const dir = center.normalize();
        config = {
          dir: [dir.x || 0.1, dir.y + 0.5, dir.z || 0.1],
          rotate: [0, 0, 0],
          phase: 0.35,
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

      const localProgress = Math.max(0, Math.min(1, (progress - phase) / (1 - phase)));
      const eased = easeOutCubic(localProgress);
      const strength = eased * EXPLOSION_STRENGTH;

      mesh.position.set(
        orig.x + dir[0] * strength,
        orig.y + dir[1] * strength,
        orig.z + dir[2] * strength
      );

      mesh.rotation.set(
        origRot.x + rotate[0] * eased * 2,
        origRot.y + rotate[1] * eased * 2,
        origRot.z + rotate[2] * eased * 2
      );
    }
  });

  return (
    <group ref={groupRef} {...props} dispose={null}>
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload("/assets/3d/1965_chevrolet_c10.glb");
