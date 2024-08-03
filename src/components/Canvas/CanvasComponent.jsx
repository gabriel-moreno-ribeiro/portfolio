import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";

function Model(props) {
  const { nodes, materials } = useGLTF("assets/3d/cute_robot.glb");
  const group = useRef();

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useFrame(() => {
    group.current.rotation.y +=
      (mousePosition.x * 0.4 - group.current.rotation.y) * 0.2;
    group.current.rotation.x +=
      (mousePosition.y * 0.4 - group.current.rotation.x) * 0.2;
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <group position={[0, 0, 0]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_4.geometry}
          material={materials.Plastik}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_5.geometry}
          material={materials.Scratch_Metal}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_6.geometry}
          material={materials.Darker_Metal}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_7.geometry}
          material={materials.Layar}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_8.geometry}
          material={materials["Material.001"]}
        />
      </group>
    </group>
  );
}



useGLTF.preload("assets/3d/cute_robot.glb");

export default function CanvasComponent() {
  return (
    <Canvas
      camera={{ position: [0.4, 1.17, 11.35], fov: 25 }}
     className="robot-canvas"
    >
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 10]} intensity={2} />
      <Model />
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
}
