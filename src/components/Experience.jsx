import { Environment, Float, OrbitControls } from "@react-three/drei";
import { Library } from "./Library";
export const Experience = () => {
	return (
		<>
			<Library position={[0, 0.5, -2]} />

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
			<mesh
				position-y={-1.5}
				rotation-x={-Math.PI / 2}
				receiveShadow
			>
				<planeGeometry args={[100, 100]} />
				<shadowMaterial
					transparent
					opacity={0.2}
				/>
			</mesh>
		</>
	);
};
