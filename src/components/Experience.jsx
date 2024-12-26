import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

import { Library } from "./Library";
export const Experience = () => {
	const cameraRef = useRef();
	const libraryRef = useRef();
	const { size } = useThree();
  
	useEffect(() => {
	  if (libraryRef.current) {
		const box = new THREE.Box3().setFromObject(libraryRef.current);
		const center = box.getCenter(new THREE.Vector3());
		const size = box.getSize(new THREE.Vector3());
  
		const maxDim = Math.max(size.x, size.y, size.z);
		const fov = cameraRef.current.fov * (Math.PI / 180);
		let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
  
		cameraZ *= 1.5; // Adjust this value to change the zoom level
  
		cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
		cameraRef.current.updateProjectionMatrix();
  
		// Look at the center of the library
		cameraRef.current.lookAt(center);
	  }
	}, [size]);
  
	useFrame(() => {
	  if (libraryRef.current && cameraRef.current) {
		const box = new THREE.Box3().setFromObject(libraryRef.current);
		const center = box.getCenter(new THREE.Vector3());
		
		// Update camera position to always look at the center of the library
		cameraRef.current.lookAt(center);
	  }
	});
	return (
		<>
			      <PerspectiveCamera ref={cameraRef} makeDefault />
      
      <group ref={libraryRef}>
        <Library />
      </group>

			{/* <OrbitControls /> */}
			<Environment
				preset="studio"
				environmentIntensity={0.5} // optional intensity factor (default: 1, only works with three 0.163 and up)
				// environmentRotation={[0, Math.PI / 2, 0]} // optional rotation (default: 0, only works with three 0.163 and up)
			></Environment>
			{/* <ambientLight intensity={0.2} /> */}
			<directionalLight
				position={[2, 5, 2]}
				intensity={0.7}
				castShadow
				shadow-mapSize-width={2048}
				shadow-mapSize-height={2048}
				shadow-bias={-0.0001}
			/>
			{/* <mesh
				position-y={-2}
				rotation-x={-Math.PI / 2}
				receiveShadow
			>
				<planeGeometry args={[100, 100]} />
				<shadowMaterial
					transparent
					opacity={0.2}
				/>
			</mesh> */}
		</>
	);
};
