import { atom, useAtom } from "jotai";
import { useEffect, useState, useRef } from "react";
import { Page } from "./Page";
import { Float, useCursor, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useGesture } from "@use-gesture/react";
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
  const groupRef = useRef();

  const [focusedMagazine, setFocusedMagazine] = useAtom(focusedMagazineAtom);
  const [highlighted, setHighlighted] = useState(false);

  // Use useCursor to change the cursor
  useCursor(highlighted && focusedMagazine !== magazine);

  const { camera } = useThree();

  // Build the pages array
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

  // You can keep your event logger if you still want to see details
  const logEventDetails = (e, eventName) => {
    console.log(`${eventName} event details:`, {
      type: e.type,
      pointerType: e.pointerType,
      target: e.target,
      currentTarget: e.currentTarget,
      clientX: e.clientX,
      clientY: e.clientY,
      touches: e.touches
        ? Array.from(e.touches).map((t) => ({
            clientX: t.clientX,
            clientY: t.clientY,
          }))
        : undefined,
      changedTouches: e.changedTouches
        ? Array.from(e.changedTouches).map((t) => ({
            clientX: t.clientX,
            clientY: t.clientY,
          }))
        : undefined,
    });
  };

  // Handle swipe or click logic
  const handleSwipeOrClick = (deltaX, deltaY, e) => {
    console.log("handleSwipeOrClick called");
    console.log("Delta:", { x: deltaX, y: deltaY });

      // If there's a focused magazine and it's not this one, ignore the interaction
  if (focusedMagazine && focusedMagazine !== magazine) {
    console.log("Ignoring interaction for non-focused magazine");
    return;
  }


    const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    console.log("Total movement:", totalMovement);

    // Very small movement → treat as click
    if (totalMovement < 5) {
      console.log("Treating as click");
      e.stopPropagation();
      if (focusedMagazine !== magazine) {
        setFocusedMagazine(magazine);
        console.log("Focusing magazine:", magazine);
      } else {
        setFocusedMagazine(null);
        console.log("Unfocusing magazine");
      }
    } else {
      console.log("Handling swipe");
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 50 && page > 0) {
          setPage(page - 1);
          console.log("Swiped right, new page:", page - 1);
        } else if (deltaX < -50 && page < pages.length - 1) {
          setPage(page + 1);
          console.log("Swiped left, new page:", page + 1);
        } else {
          console.log("Swipe not significant enough to change page");
        }
      } else {
        console.log("Vertical swipe detected, ignoring");
      }
    }
  };

  // UseGesture to unify pointer/touch events
  const bind = useGesture(
    {
      onDrag: ({ first, last, movement: [dx, dy], event }) => {
        // Prevent default to avoid scrolling on mobile
        if (event.preventDefault) event.preventDefault();

        if (first) {
          logEventDetails(event, "onDragStart");
        }
        if (last) {
          logEventDetails(event, "onDragEnd");
          handleSwipeOrClick(dx, dy, event);
        }
      },
      // onPointerDown: (event) => {
      //   // If this magazine is focused or there's no focused magazine, stop propagation
      //   if (focusedMagazine === magazine || !focusedMagazine) {
      //     event.stopPropagation();
      //   }
      // },
    },
    {
      eventOptions: { passive: false },
    }
  );

  // Delay page turning animation
  useEffect(() => {
    let timeout;
    const goToPage = () => {
      setDelayedPage((delayed) => {
        if (page === delayed) {
          return delayed;
        } else {
          timeout = setTimeout(() => {
            goToPage();
          }, Math.abs(page - delayed) > 2 ? 50 : 150);

          if (page > delayed) {
            return delayed + 1;
          }
          if (page < delayed) {
            return delayed - 1;
          }
        }
      });
    };
    goToPage();
    return () => {
      clearTimeout(timeout);
    };
  }, [page]);

  // Refs to store initial position/rotation
  const initialPositionRef = useRef();
  const initialRotationRef = useRef();
  const initialCameraQuaternionRef = useRef();

  useEffect(() => {
    if (props.position) {
      initialPositionRef.current = new THREE.Vector3(...props.position);
    } else {
      initialPositionRef.current = new THREE.Vector3(0, 0, 0);
    }
    initialRotationRef.current = new THREE.Euler(-0.2 * Math.PI, 0.5 * Math.PI, 0);
    initialCameraQuaternionRef.current = camera.quaternion.clone();

    return () => {
      initialPositionRef.current = undefined;
      initialRotationRef.current = undefined;
      initialCameraQuaternionRef.current = undefined;
    };
  }, [props.position, camera]);

  // Animate position/rotation based on focus
  useFrame(() => {
    if (groupRef.current && initialPositionRef.current) {
      if (focusedMagazine === magazine) {
        // Lerp magazine position to a position in front of the camera
        const targetPosition = camera.position
          .clone()
          .add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(-2))
          .add(new THREE.Vector3(0, -1.7, -2.5));

        groupRef.current.position.lerp(targetPosition, 0.1);

        // Face the camera
        const angleToCamera = Math.atan2(
          camera.position.x - groupRef.current.position.x,
          camera.position.z - groupRef.current.position.z
        );
        const targetRotation = new THREE.Euler(0, angleToCamera - Math.PI / 2, 0);
        const targetQuaternion = new THREE.Quaternion().setFromEuler(targetRotation);
        groupRef.current.quaternion.slerp(targetQuaternion, 0.1);

        // Smoothly adjust camera to look at the magazine center
        const magazinePosition = new THREE.Vector3();
        groupRef.current.getWorldPosition(magazinePosition);
        const currentCameraQuaternion = camera.quaternion.clone();
        camera.lookAt(magazinePosition);
        const targetCameraQuaternion = camera.quaternion.clone();
        camera.quaternion.copy(currentCameraQuaternion);
        camera.quaternion.slerp(targetCameraQuaternion, 0.1);
      } else {
        // If unfocused, reset page to 0
        setPage(0);

        // Lerp magazine back to initial position/rotation
        groupRef.current.position.lerp(initialPositionRef.current, 0.1);
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
        camera.quaternion.slerp(initialCameraQuaternionRef.current, 0.1);
      }
    }
  });

  // Render pages
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
        // Apply the useGesture binding here
        {...bind()}
        pointerEvents={focusedMagazine && focusedMagazine !== magazine ? 'none' : 'auto'}

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
