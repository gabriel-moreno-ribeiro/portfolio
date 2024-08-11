import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";


export function Ball(props) {
   const group = useRef();
  const { nodes, materials, animations } = useGLTF("/assets/3d/ball.glb");
  const { actions } = useAnimations(animations, group);
  const [targetRotation, setTargetRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const rollingAction = actions["Rolling"];
    rollingAction.play();
    rollingAction.setEffectiveTimeScale(0.75);
    return () => rollingAction.stop();
  }, [actions]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const rotationSpeed = 0.5;
      if (event.code === "ArrowLeft") {
        setTargetRotation((prev) => ({ ...prev, y: prev.y + rotationSpeed }));
      } else if (event.code === "ArrowRight") {
        setTargetRotation((prev) => ({ ...prev, y: prev.y - rotationSpeed }));
      } else if (event.code === "ArrowUp") {
        setTargetRotation((prev) => ({ ...prev, x: prev.x - rotationSpeed }));
      } else if (event.code === "ArrowDown") {
        setTargetRotation((prev) => ({ ...prev, x: prev.x + rotationSpeed }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  const Controller = () => {
    useFrame(() => {
    if (group.current) {
      // Smoothly interpolate between current and target rotation
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        targetRotation.x,
        0.1
      );
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        targetRotation.y,
        0.1
      );
    }
  });
    return <></>;
  }

  return (
    <>
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <group
          name="Sketchfab_model"
          rotation={[-Math.PI / 2, 0, 0]}
          scale={0.004}
        >
          <group
            name="a8c2a0ad529f4d52a8f6a90a24c3f120fbx"
            rotation={[Math.PI / 2, 0, 0]}
          >
            <group name="Object_2">
              <group name="RootNode">
                <group
                  name="Main_Ctrl"
                  position={[0, 0, 0.006]}
                  rotation={[-Math.PI / 2, 0, Math.PI]}
                >
                  <group
                    name="Body_Pos_Ctrl"
                    position={[0, 0.065, 0]}
                    rotation={[0, 0, -Math.PI]}
                    scale={0.665}
                  >
                    <group
                      name="Body_Rot_Ctrl"
                      position={[0, 0, 24.123]}
                      scale={1.503}
                    >
                      <group
                        name="Sphere002"
                        rotation={[Math.PI / 4, 0, Math.PI / 4]}
                      >
                        <mesh
                          name="Sphere002_07_-_Default_0"
                          geometry={nodes["Sphere002_07_-_Default_0"].geometry}
                          material={materials["07_-_Default"]}
                        />
                      </group>
                    </group>
                    <group
                      name="Head_Rot_Ctrl"
                      position={[0, 0, 24.851]}
                      rotation={[0.012, -0.088, 0.001]}
                      scale={0.957}
                    >
                      <group
                        name="Head_Pos_Ctrl"
                        position={[0.402, 0, 45.056]}
                        rotation={[0, 0, 0.015]}
                        scale={0.563}
                      >
                        <group
                          name="Capsule003"
                          position={[-0.713, 0.011, -38.042]}
                          rotation={[0, 0, -1.586]}
                          scale={4.547}
                        >
                          <group name="Object_12" position={[0, 0, -7.206]}>
                            <mesh
                              name="Capsule003_07_-_Default_0"
                              geometry={
                                nodes["Capsule003_07_-_Default_0"].geometry
                              }
                              material={materials["07_-_Default"]}
                            />
                          </group>
                          <group
                            name="Cylinder005"
                            position={[2.652, -4.59, 3.434]}
                            rotation={[1.274, 0.501, 0.146]}
                            scale={[1.261, 1.261, 0.838]}
                          >
                            <mesh
                              name="Cylinder005_07_-_Default_0"
                              geometry={
                                nodes["Cylinder005_07_-_Default_0"].geometry
                              }
                              material={materials["07_-_Default"]}
                            />
                          </group>
                          <group
                            name="Cylinder004"
                            position={[0, -4.539, 4.562]}
                            rotation={[1.061, 0, 0]}
                          >
                            <mesh
                              name="Cylinder004_07_-_Default_0"
                              geometry={
                                nodes["Cylinder004_07_-_Default_0"].geometry
                              }
                              material={materials["07_-_Default"]}
                            />
                          </group>
                          <group
                            name="Capsule005"
                            position={[2.818, -4.885, 3.524]}
                            rotation={[1.274, 0.501, 0.146]}
                            scale={[0.317, 0.317, 0.182]}
                          >
                            <mesh
                              name="Capsule005_07_-_Default_0"
                              geometry={
                                nodes["Capsule005_07_-_Default_0"].geometry
                              }
                              material={materials["07_-_Default"]}
                            />
                          </group>
                          <group
                            name="Capsule004"
                            position={[0.905, 3.154, 5.171]}
                          >
                            <mesh
                              name="Capsule004_07_-_Default_0"
                              geometry={
                                nodes["Capsule004_07_-_Default_0"].geometry
                              }
                              material={materials["07_-_Default"]}
                            />
                          </group>
                          <group
                            name="Capsule004_1"
                            position={[0.001, -3.244, 3.836]}
                            rotation={[1.061, 0, 0]}
                            scale={[1, 1, 0.635]}
                          >
                            <mesh
                              name="Capsule004_07_-_Default_0_1"
                              geometry={
                                nodes["Capsule004_07_-_Default_0_1"].geometry
                              }
                              material={materials["07_-_Default"]}
                            />
                          </group>
                          <group
                            name="Capsule003_1"
                            position={[-0.306, 3.154, 5.171]}
                          >
                            <mesh
                              name="Capsule003_07_-_Default_0_1"
                              geometry={
                                nodes["Capsule003_07_-_Default_0_1"].geometry
                              }
                              material={materials["07_-_Default"]}
                            />
                          </group>
                        </group>
                      </group>
                    </group>
                  </group>
                  <group
                    name="Shadow_Ctrl"
                    position={[-0.668, -0.006, 0]}
                    rotation={[0, 0, -Math.PI]}
                    scale={[0.421, 0.384, 0.421]}
                  >
                    <group
                      name="Shadow"
                      position={[3.924, 0, 0.788]}
                      scale={[1.25, 1.25, 1]}
                    >
                      <mesh
                        name="Shadow_07_-_Default_0"
                        geometry={nodes["Shadow_07_-_Default_0"].geometry}
                        material={materials["07_-_Default"]}
                      />
                    </group>
                  </group>
                </group>
                <group
                  name="Dust_Ctrl"
                  position={[0.668, 0, 0.535]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  scale={0.795}
                >
                  <group
                    name="Dust_14"
                    position={[25.924, 0.113, -1.398]}
                    rotation={[0, 1.519, 0]}
                  >
                    <group
                      name="Object_36"
                      position={[0, 0, 5.523]}
                      scale={[1, 0.39, 2.11]}
                    >
                      <mesh
                        name="Dust_14_07_-_Default_0"
                        geometry={nodes["Dust_14_07_-_Default_0"].geometry}
                        material={materials["07_-_Default"]}
                      />
                    </group>
                  </group>
                  <group
                    name="Dust_13"
                    position={[38.474, -0.595, -4.219]}
                    rotation={[0, 0.559, 0]}
                  >
                    <group
                      name="Object_39"
                      position={[0, 0, 1.906]}
                      scale={[0.609, 0.313, 0.728]}
                    >
                      <mesh
                        name="Dust_13_07_-_Default_0"
                        geometry={nodes["Dust_13_07_-_Default_0"].geometry}
                        material={materials["07_-_Default"]}
                      />
                    </group>
                  </group>
                  <group
                    name="Dust_12"
                    position={[40.748, 2.367, -0.423]}
                    rotation={[-0.063, 0.716, -2.879]}
                  >
                    <group
                      name="Object_42"
                      position={[0, 0, 1.358]}
                      scale={[0.479, 0.39, 0.519]}
                    >
                      <mesh
                        name="Dust_12_07_-_Default_0"
                        geometry={nodes["Dust_12_07_-_Default_0"].geometry}
                        material={materials["07_-_Default"]}
                      />
                    </group>
                  </group>
                  <group
                    name="Dust_11"
                    position={[38.628, 2.587, 0.046]}
                    rotation={[-Math.PI / 2, 1.134, -Math.PI / 2]}
                  >
                    <group
                      name="Object_45"
                      position={[0, 0, 1.358]}
                      scale={[0.479, 0.39, 0.519]}
                    >
                      <mesh
                        name="Dust_11_07_-_Default_0"
                        geometry={nodes["Dust_11_07_-_Default_0"].geometry}
                        material={materials["07_-_Default"]}
                      />
                    </group>
                  </group>
                  <group
                    name="Dust_10"
                    position={[25.267, 1.31, 0.046]}
                    rotation={[-Math.PI / 2, 1.134, -Math.PI / 2]}
                  >
                    <group
                      name="Object_48"
                      position={[0, 0, 1.358]}
                      scale={[0.479, 0.39, 0.519]}
                    >
                      <mesh
                        name="Dust_10_07_-_Default_0"
                        geometry={nodes["Dust_10_07_-_Default_0"].geometry}
                        material={materials["07_-_Default"]}
                      />
                    </group>
                  </group>
                  <group
                    name="Dust_09"
                    position={[30.601, -1.763, 0.046]}
                    rotation={[Math.PI / 2, 1.134, Math.PI / 2]}
                  >
                    <group
                      name="Object_51"
                      position={[0, 0, 1.797]}
                      scale={[0.479, 0.39, 0.686]}
                    >
                      <mesh
                        name="Dust_09_07_-_Default_0"
                        geometry={nodes["Dust_09_07_-_Default_0"].geometry}
                        material={materials["07_-_Default"]}
                      />
                    </group>
                  </group>
                  <group
                    name="Dust_08"
                    position={[21.308, -0.343, 0.046]}
                    rotation={[Math.PI / 2, 1.134, Math.PI / 2]}
                  >
                    <group
                      name="Object_54"
                      position={[0, 0, 1.797]}
                      scale={[0.479, 0.39, 0.686]}
                    >
                      <mesh
                        name="Dust_08_07_-_Default_0"
                        geometry={nodes["Dust_08_07_-_Default_0"].geometry}
                        material={materials["07_-_Default"]}
                      />
                    </group>
                  </group>
                  <group
                    name="Dust_07"
                    position={[34.818, -2.553, -4.972]}
                    rotation={[0, 0.559, 0]}
                  >
                    <group
                      name="Object_57"
                      position={[0, 0, 2.278]}
                      scale={[0.629, 0.386, 0.87]}
                    >
                      <mesh
                        name="Dust_07_07_-_Default_0"
                        geometry={nodes["Dust_07_07_-_Default_0"].geometry}
                        material={materials["07_-_Default"]}
                      />
                    </group>
                  </group>
                  <group
                    name="Dust_06"
                    position={[28.441, 2.044, -3.096]}
                    rotation={[0, 0.559, 0]}
                  >
                    <group
                      name="Object_60"
                      position={[0, 0, 2.069]}
                      scale={[0.679, 0.39, 0.79]}
                    >
                      <mesh
                        name="Dust_06_07_-_Default_0"
                        geometry={nodes["Dust_06_07_-_Default_0"].geometry}
                        material={materials["07_-_Default"]}
                      />
                    </group>
                  </group>
                  <group
                    name="Dust_05"
                    position={[35.448, 3.007, -5.593]}
                    rotation={[0, 0.559, 0]}
                  >
                    <group
                      name="Object_63"
                      position={[0, 0, 1.906]}
                      scale={[0.609, 0.313, 0.728]}
                    >
                      <mesh
                        name="Dust_05_07_-_Default_0"
                        geometry={nodes["Dust_05_07_-_Default_0"].geometry}
                        material={materials["07_-_Default"]}
                      />
                    </group>
                  </group>
                  <group
                    name="Dust_04"
                    position={[30.756, -0.592, -5.097]}
                    rotation={[0, 0.559, 0]}
                  >
                    <group
                      name="Object_66"
                      position={[0, 0, 2.37]}
                      scale={[0.679, 0.39, 0.905]}
                    >
                      <mesh
                        name="Dust_04_07_-_Default_0"
                        geometry={nodes["Dust_04_07_-_Default_0"].geometry}
                        material={materials["07_-_Default"]}
                      />
                    </group>
                  </group>
                  <group
                    name="Dust_03"
                    position={[22.73, -1.68, -5.097]}
                    rotation={[0, 0.559, 0]}
                  >
                    <group
                      name="Object_69"
                      position={[0, 0, 3.409]}
                      scale={[1, 0.39, 1.302]}
                    >
                      <mesh
                        name="Dust_03_07_-_Default_0"
                        geometry={nodes["Dust_03_07_-_Default_0"].geometry}
                        material={materials["07_-_Default"]}
                      />
                    </group>
                  </group>
                  <group
                    name="Dust_02"
                    position={[17.767, 0.187, -5.124]}
                    rotation={[0, 0.559, 0]}
                  >
                    <group
                      name="Object_72"
                      position={[0, 0, 2.063]}
                      scale={[0.692, 0.39, 0.788]}
                    >
                      <mesh
                        name="Dust_02_07_-_Default_0"
                        geometry={nodes["Dust_02_07_-_Default_0"].geometry}
                        material={materials["07_-_Default"]}
                      />
                    </group>
                  </group>
                  <group name="Dust_01" position={[15.496, 0, -0.748]}>
                    <group
                      name="Object_75"
                      position={[6.555, 0, 0.75]}
                      scale={[1, 1, 0.239]}
                    >
                      <mesh
                        name="Dust_01_07_-_Default_0"
                        geometry={nodes["Dust_01_07_-_Default_0"].geometry}
                        material={materials["07_-_Default"]}
                      />
                    </group>
                  </group>
                </group>
                <group name="BG">
                  <mesh
                    name="BG_07_-_Default_0"
                    geometry={nodes["BG_07_-_Default_0"].geometry}
                    material={materials["07_-_Default"]}
                  />
                </group>
                <group
                  name="Floor"
                  rotation={[-Math.PI / 2, 0, 0]}
                  scale={2.299}
                >
                  <group name="Object_32">
                    <mesh
                      name="Floor_07_-_Default_0"
                      geometry={nodes["Floor_07_-_Default_0"].geometry}
                      material={materials["07_-_Default"]}
                    />
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
      </group>
      <Controller/>
      </>
  );
}

useGLTF.preload("/assets/3d/ball.glb");
