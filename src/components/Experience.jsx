import { Environment, Float, OrbitControls } from "@react-three/drei";
import { Library } from "./Library";
export const Experience = () => {
  return (
    <>
   
        <Library position={[0,0.5,-2]}/>
 
      {/* <OrbitControls /> */}
      {/* <Environment preset="studio"></Environment> */}
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[2, 5, 2]}
        intensity={0.7}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <mesh position-y={-1.5} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
    </>
  );
};