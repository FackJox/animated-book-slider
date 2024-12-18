import { atom, useAtom } from "jotai";
import { useEffect, useState, useRef } from "react";
import { Page } from "./Page";
import { Float, useCursor, useTexture } from "@react-three/drei";
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

  const [focusedMagazine, setFocusedMagazine] = useAtom(focusedMagazineAtom);
    // Add highlighted state
    const [highlighted, setHighlighted] = useState(false);

    // Use useCursor to change the cursor
    useCursor(highlighted && focusedMagazine !== magazine);

  // Consume the focusedMagazineAtom

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
    e.preventDefault(); // Prevent default behavior for touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    swipeRef.current.startX = clientX;
    swipeRef.current.startY = clientY;
  };
  
  const handlePointerUp = (e) => {
    e.preventDefault(); // Prevent default behavior for touch events
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const deltaX = clientX - swipeRef.current.startX;
    const deltaY = clientY - swipeRef.current.startY;
  
    const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
    if (totalMovement < 5) {
      // Treat as click
      e.stopPropagation(); // Stop propagation to prevent unintended interactions
      if (focusedMagazine !== magazine) {
        setFocusedMagazine(magazine);
      } else {
        setFocusedMagazine(null);
      }
    } else {
      // Handle swipe
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

  // New refs to store initial camera rotation and position
  const initialCameraQuaternionRef = useRef();

  useEffect(() => {
    if (props.position) {
      initialPositionRef.current = new THREE.Vector3(...props.position);
    } else {
      // Set a default position if props.position is not provided
      initialPositionRef.current = new THREE.Vector3(0, 0, 0);
    }
    initialRotationRef.current = new THREE.Euler(
      -0.2 * Math.PI,
      0.5 * Math.PI,
      0
    );
    initialCameraQuaternionRef.current = camera.quaternion.clone();
    return () => {
      // Cleanup function
      initialPositionRef.current = undefined;
      initialRotationRef.current = undefined;
      initialCameraQuaternionRef.current = undefined;
    };
  }, [props.position, camera]);

  // useFrame to update positions and rotations
  useFrame(() => {
    if (groupRef.current && initialPositionRef.current) {
      if (focusedMagazine === magazine) {
        // Lerp magazine position to a position in front of the camera
        const targetPosition = camera.position
          .clone()
          .add(
            camera
              .getWorldDirection(new THREE.Vector3())
              .multiplyScalar(-2) // Adjust the scalar as needed
          )
          .add(new THREE.Vector3(0, -1.7, -2.5)); // Adjust these values as needed

        groupRef.current.position.lerp(targetPosition, 0.1);

        // Calculate the angle to face the camera in the XZ plane
        const angleToCamera = Math.atan2(
          camera.position.x - groupRef.current.position.x,
          camera.position.z - groupRef.current.position.z
        );

        // Compute the target rotation (adjusted with initial rotation)
        const targetRotation = new THREE.Euler(
          0,
          angleToCamera - Math.PI / 2,
          0
        );

        // Convert the target rotation to a quaternion
        const targetQuaternion = new THREE.Quaternion().setFromEuler(
          targetRotation
        );

        // Slerp towards the target quaternion
        groupRef.current.quaternion.slerp(targetQuaternion, 0.1);

        // Smoothly adjust the camera to look at the magazine center
        const magazinePosition = new THREE.Vector3();
        groupRef.current.getWorldPosition(magazinePosition);

        // Save current camera quaternion
        const currentCameraQuaternion = camera.quaternion.clone();

        // Point the camera to the magazine
        camera.lookAt(magazinePosition);
        const targetCameraQuaternion = camera.quaternion.clone();

        // Restore the original camera quaternion
        camera.quaternion.copy(currentCameraQuaternion);

        // Slerp towards the target camera quaternion
        camera.quaternion.slerp(targetCameraQuaternion, 0.1);
      } else {
        setPage(0)

        // Lerp magazine back to initial position
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



        // Smoothly return the camera to its original rotation
        camera.quaternion.slerp(initialCameraQuaternionRef.current, 0.1);
      }
    }
  });

  const pageElements = pages.map((pageData, index) => (
    <Page
      key={index}
      page={delayedPage}
      number={index}
      magazine={magazine}
      opened={delayedPage > index}
      bookClosed={delayedPage === 0 || delayedPage === pages.length}
      pages={pages}
      setPage={setPage}
      highlighted={highlighted}
      isFocused={focusedMagazine === magazine}
      {...pageData}
    />
  ));

  return (
    <group {...props} ref={groupRef} rotation={[-20, -3, 0]}>
      <mesh
        geometry={new THREE.BoxGeometry(1, 1, 2)}
        material={
          new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
          })
        }
        onPointerEnter={(e) => {
          e.stopPropagation();
          setHighlighted(true);
        }}
        onPointerLeave={(e) => {
          e.stopPropagation();
          setHighlighted(false);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          handlePointerDown(e);
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          handlePointerUp(e);
        }}

        onTouchStart={(e) => {
          e.stopPropagation();
          handlePointerDown(e);
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          handlePointerUp(e);
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