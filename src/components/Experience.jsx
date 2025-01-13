import { useRef, useEffect, useLayoutEffect, useState, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

import { Library } from "./Library";
export const Experience = () => {
	const cameraRef = useRef();
	const libraryRef = useRef();
	const initialCameraZRef = useRef(null);
	const { viewport } = useThree();
	const isPortrait = viewport.width < viewport.height;

	

	return (
		<>
			<PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 10]} />
			
			<group ref={libraryRef}>
				<Library />
			</group>

			<Environment
				preset="studio"
				environmentIntensity={0.5}
			/>
			<directionalLight
				position={[2, 5, 2]}
				intensity={0.7}
				castShadow
				shadow-mapSize-width={2048}
				shadow-mapSize-height={2048}
				shadow-bias={-0.0001}
			/>
		</>
	);
};
