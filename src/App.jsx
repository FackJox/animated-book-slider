import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";

function App() {
  return (
    <>
      <UI />
      <Loader />
      <Canvas shadows camera={{ position: [0, 0, 8], fov: 50 }}>
        <group position-y={0.5}>
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </group>
      </Canvas>
    </>
  );
}

export default App;
