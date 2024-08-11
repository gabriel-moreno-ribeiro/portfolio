import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import useCanvasStore from "../../store/showCarStore";
import { Ball } from "../Home/Ball";
function CarCanvas() {
  const CameraPosition = () => {
    useFrame((state) => {
    console.log('Camera position:', state.camera.position);
    });
    return <></>;
  }
  return (
    <div className="car-canvas">
      <Canvas
        camera={{
          position: [-0.34,  0.24,  0.51],
          fov: 50,
        }}
      >
        <OrbitControls enableZoom={false} />
        <directionalLight position={[0, 10, 10]} intensity={1} />
        <ambientLight intensity={0.2} />
        <Suspense>
          <Ball />
        </Suspense>
        {/* <CameraPosition/> */}
      </Canvas>
      <div className="ball-text"
        initial={{ opacity: 0 ,y:50}}
        animate={{
          opacity: 1, y: 50, 
        }}
      >
        {/* <h1 className="heading">Avi Vashishta.</h1> */}
         <p className="desc">
          Use  <code>Arrow Keys</code> to control BB-8.
        </p>
        <p className="desc">
          Press <code>Esc</code> to close the window.
        </p>
        
        <p className="small-desc"></p>
      </div>
    </div>
  );
}

function BallComponent() {
  const { showCarCanvas, setShowCarCanvas } = useCanvasStore();

  useEffect(() => {
    if (showCarCanvas) {
      document.body.style.overflowY = "hidden";
    } else {
      document.body.style.overflowY = "auto";
    }

    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.code === "Enter") {
        setShowCarCanvas(true);
      } else if (event.code === "Escape" && showCarCanvas) {
        setShowCarCanvas(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showCarCanvas]);

  return <>{showCarCanvas && <CarCanvas />}</>;
}

export default BallComponent;
