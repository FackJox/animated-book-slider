// Magazine.js
import { atom, useAtom } from "jotai";
import { useEffect, useState, useRef } from "react";
import { Page } from "./Page";
import { Float, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export const Magazine = ({
	pictures,
	magazine,
	pageAtom,
	focusedMagazineAtom,
	...props
}) => {
	const [page, setPage] = useAtom(pageAtom);
	const [delayedPage, setDelayedPage] = useState(page);
	const swipeRef = useRef({ startX: 0, startY: 0 });
	const groupRef = useRef();
  const magazineCenterRef = useRef(new THREE.Vector3());

	// Consume the focusedMagazineAtom
	const [focusedMagazine, setFocusedMagazine] = useAtom(focusedMagazineAtom);

	const { camera } = useThree();

	const pages = [
		{
			front: "01Front",
			back: pictures[0],
		},
	];

	for (let i = 1; i < pictures.length - 1; i += 2) {
		pages.push({
			front: pictures[i % pictures.length],
			back: pictures[(i + 1) % pictures.length],
		});
	}

	pages.push({
		front: pictures[pictures.length - 1],
		back: "01Front",
	});

	// Preload textures
	pages.forEach((page) => {
		useTexture.preload(`/textures/${magazine}/${page.front}.png`);
		useTexture.preload(`/textures/${magazine}/${page.back}.png`);
		useTexture.preload(`/textures/book-cover-roughness.png`);
	});

	useEffect(() => {
		const audio = new Audio("/audios/page-flip-01a.mp3");
		audio.play();
	}, [page]);

	const handlePointerDown = (e) => {
		swipeRef.current.startX = e.clientX;
		swipeRef.current.startY = e.clientY;
	};

	const handlePointerUp = (e) => {
		const deltaX = e.clientX - swipeRef.current.startX;
		const deltaY = e.clientY - swipeRef.current.startY;

		// Check if the movement is more horizontal than vertical
		if (Math.abs(deltaX) > Math.abs(deltaY)) {
			// Determine swipe direction and change page
			if (deltaX > 50 && page > 0) {
				// Swipe right, go to previous page
				setPage(page - 1);
			} else if (deltaX < -50 && page < pages.length - 1) {
				// Swipe left, go to next page
				setPage(page + 1);
			}
		}
	};

	useEffect(() => {
		let timeout;
		const goToPage = () => {
			setDelayedPage((delayedPage) => {
				if (page === delayedPage) {
					return delayedPage;
				} else {
					timeout = setTimeout(
						() => {
							goToPage();
						},
						Math.abs(page - delayedPage) > 2 ? 50 : 150
					);
					if (page > delayedPage) {
						return delayedPage + 1;
					}
					if (page < delayedPage) {
						return delayedPage - 1;
					}
				}
			});
		};
		goToPage();
		return () => {
			clearTimeout(timeout);
		};
	}, [page]);

	

	// Refs to store initial position and rotation
	const initialPositionRef = useRef();
	const initialRotationRef = useRef();

	// Set initial position and rotation
	useEffect(() => {
		initialPositionRef.current = new THREE.Vector3(...props.position);
		initialRotationRef.current = new THREE.Euler(
			-0.2 * Math.PI,
			0.5 * Math.PI,
			0
		);
	}, [props.position]);

	// useFrame to update position and rotation
	useFrame(() => {
		if (groupRef.current) {
			if (focusedMagazine === magazine) {
				// Lerp position to a position in front of the camera
				const targetPosition = camera.position
					.clone()
					.add(
						camera
							.getWorldDirection(new THREE.Vector3())
							.multiplyScalar(-1) // Adjust the scalar as needed
					)
					.add(new THREE.Vector3(1.5, -1.25, -1)); // Adjust these values as needed

				groupRef.current.position.lerp(targetPosition, 0.1);

		  // Calculate the angle to face the camera
      const angleToCamera = Math.atan2(
        camera.position.x - groupRef.current.position.x,
        camera.position.z - groupRef.current.position.z
      );
  
      // Set the rotation, subtracting 90 degrees (PI/2) from the y-rotation
      groupRef.current.rotation.set(
        0,
        angleToCamera - Math.PI / 2,
        0
      );

        


				// Make the magazine face the camera
				groupRef.current.quaternion.slerp(camera.quaternion, 0.1);
			} else {
				// Lerp back to initial position
				groupRef.current.position.lerp(initialPositionRef.current, 0.1);
				// Lerp rotation back to initial rotation
				groupRef.current.rotation.x = THREE.MathUtils.lerp(
					groupRef.current.rotation.x,
					initialRotationRef.current.x,
					0.1
				);
				groupRef.current.rotation.y = THREE.MathUtils.lerp(
					groupRef.current.rotation.y,
					initialRotationRef.current.y,
					0.1
				);
				groupRef.current.rotation.z = THREE.MathUtils.lerp(
					groupRef.current.rotation.z,
					initialRotationRef.current.z,
					0.1
				);
			}
		}
	});

  const pageElements = [...pages].map((pageData, index) => (
		<Page
			key={index}
			page={delayedPage}
			number={index}
			magazine={magazine}
			opened={delayedPage > index}
			bookClosed={delayedPage === 0 || delayedPage === pages.length}
			pages={pages}
			setPage={setPage}
			{...pageData}
		/>
	));

	return (
		<group
			{...props}
			ref={groupRef}
			rotation-y={0.5 * Math.PI}
			rotation-x={-0.2 * Math.PI}
		>
			<mesh
				// Increase the size to cover the magazine area
				// Adjust the size (args) as needed based on your magazine dimensions
				geometry={new THREE.BoxGeometry(2, 3, 0.5)}
				// Make the material invisible but pickable
				material={
					new THREE.MeshBasicMaterial({
						transparent: true,
						opacity: 0,
					})
				}
				onClick={(e) => {
					e.stopPropagation();
					if (focusedMagazine !== magazine) {
						setFocusedMagazine(magazine);
					} else {
						setFocusedMagazine(null);
					}
				}}
				onPointerDown={(e) => {
					e.stopPropagation();
					if (focusedMagazine === magazine) {
						handlePointerDown(e);
					}
				}}
				onPointerUp={(e) => {
					e.stopPropagation();
					if (focusedMagazine === magazine) {
						handlePointerUp(e);
					}
				}}
			>
				<group>
					{focusedMagazine === magazine ? (
						<>{pageElements}</>
					) : (
						<Float
							rotation={[4 * Math.PI, 1 * Math.PI, 1.8 * Math.PI]}
							floatIntensity={1}
							speed={2}
							rotationIntensity={2}
						>
							{pageElements}
						</Float>
					)}
				</group>
			</mesh>
		</group>
	);
};
