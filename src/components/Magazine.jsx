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
  isPortrait,
  layoutPosition,
  ...props
}) => {
  

  // ------------------------------
  // Atoms & State
  // ------------------------------
  const [page, setPage] = useAtom(pageAtom);
  const [delayedPage, setDelayedPage] = useState(page);
  const [focusedMagazine, setFocusedMagazine] = useAtom(focusedMagazineAtom);
  const [highlighted, setHighlighted] = useState(false);

  // ------------------------------
  // Refs
  // ------------------------------
  const groupRef = useRef();
  const floatRef = useRef();
  const floatNullifyRef = useRef();
  const helper = useRef(new THREE.Object3D()).current;

  // For storing original transform:
  const initialPositionRef = useRef(null);
  const initialQuaternionRef = useRef(null);
  const initialCameraQuaternionRef = useRef(null);

  // ------------------------------
  // R3F Hooks
  // ------------------------------
  const { camera, size } = useThree();

  useEffect(() => {
    console.log(`Magazine ${magazine} position:`, layoutPosition);
    console.log("🚀 ~ camera.position:", camera.position )
  }, [layoutPosition, magazine, camera.position]);


  // Change pointer if hovered & not focused
  useCursor(highlighted && focusedMagazine !== magazine);

  // ------------------------------
  // Pages setup
  // ------------------------------
  // Build pages array
  const pages = [
    { front: "01Front", back: pictures[0] },
  ];
  for (let i = 1; i < pictures.length - 1; i += 2) {
    pages.push({
      front: pictures[i % pictures.length],
      back: pictures[(i + 1) % pictures.length],
    });
  }
  // Last page
  pages.push({
    front: pictures[pictures.length - 1],
    back: "01Front",
  });


  // Preload textures
  pages.forEach((p) => {
    useTexture.preload(`/textures/${magazine}/${p.front}.png`);
    useTexture.preload(`/textures/${magazine}/${p.back}.png`);
    useTexture.preload(`/textures/book-cover-roughness.png`);
  });

  // ------------------------------
  // Audio effect on page change
  // ------------------------------
  useEffect(() => {
    const audio = new Audio("/audios/page-flip-01a.mp3");
    audio.play();
  }, [page]);

  // ------------------------------
  // Gestures (swipe vs click)
  // ------------------------------
  const handleSwipeOrClick = (deltaX, deltaY, e) => {
    if (focusedMagazine && focusedMagazine !== magazine) return;

    const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (totalMovement < 5) {
      // Tiny movement => treat as click to focus/unfocus
      e.stopPropagation();
      setFocusedMagazine((prev) => (prev === magazine ? null : magazine));
    } else {
      // Horizontal swipe => page turn
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 50) {
          // Turn backward by 1 page (clamp to >= 0)
          setPage((p) => Math.max(p - 1, 0));
        } else if (deltaX < -50) {
          // Turn forward by 1 page (clamp to <= pages.length)
          // If you want the final “fully open back cover” at `page === pages.length`,
          // then clamp to `pages.length`. Otherwise, use `pages.length - 1`.
          setPage((p) => Math.min(p + 1, pages.length));
        }
      }
      // vertical swipes ignored
    }
  };

  const bind = useGesture(
    {
      onDrag: ({ last, movement: [dx, dy], event }) => {
        if (event.preventDefault) event.preventDefault();
        if (last) handleSwipeOrClick(dx, dy, event);
      },
    },
    { eventOptions: { passive: false } }
  );

  // ------------------------------
  // Delayed flip (one page at a time)
  // ------------------------------
  useEffect(() => {
    let timeout;
    const animatePageFlip = () => {
      setDelayedPage((current) => {
        if (current === page) return current;
        // Flip exactly 1 page at a time every 150ms
        timeout = setTimeout(animatePageFlip, 150);
        return current < page ? current + 1 : current - 1;
      });
    };
    animatePageFlip();
    return () => clearTimeout(timeout);
  }, [page]);

  // ------------------------------
  // Store initial transforms
  // ------------------------------
  useEffect(() => {
    if (!groupRef.current) return;
    initialPositionRef.current = groupRef.current.position.clone();
    initialQuaternionRef.current = groupRef.current.quaternion.clone();
    initialCameraQuaternionRef.current = camera.quaternion.clone();
  }, [camera]);

  // ------------------------------
  // Focus/unfocus animation
  // ------------------------------
  useFrame(() => {
    if (!groupRef.current || !initialPositionRef.current) return;

    if (focusedMagazine === magazine) {
      // Move + rotate the magazine in front of camera
      const geometryWidth = 3;
      const aspect = size.width / size.height;
      const fovRad = (camera.fov * Math.PI) / 180;
      const zDist = (geometryWidth / 2) / (aspect * Math.tan(fovRad / 2));

      const newPos = new THREE.Vector3().copy(camera.position);
      const forward = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(camera.quaternion)
        .normalize();
      newPos.addScaledVector(forward, zDist);

      // Apply layout-specific offset
      if (layoutPosition) {
        const [offsetX, offsetY, offsetZ] = layoutPosition;
        const layoutOffset = new THREE.Vector3(
          -offsetX,
          -offsetY,
          -offsetZ
        );
        newPos.add(layoutOffset);
      }

      // Lerp magazine to that position
      groupRef.current.position.lerp(newPos, 0.1);
      groupRef.current.quaternion.slerp(camera.quaternion, 0.1);

      // Gently rotate camera to look at the group
      const currentCamQuat = camera.quaternion.clone();
      camera.lookAt(groupRef.current.position);
      const targetCamQuat = camera.quaternion.clone();
      camera.quaternion.copy(currentCamQuat);
      camera.quaternion.slerp(targetCamQuat, 0.1);
    } else {
      // Unfocused => back to original transform
      groupRef.current.position.lerp(initialPositionRef.current, 0.1);
      groupRef.current.quaternion.slerp(initialQuaternionRef.current, 0.1);

      // Also restore camera orientation
      if (initialCameraQuaternionRef.current) {
        camera.quaternion.slerp(initialCameraQuaternionRef.current, 0.1);
      }
    }
  });

  // ------------------------------
  // Float nullification
  // ------------------------------
  useFrame(() => {
    if (!floatRef.current || !floatNullifyRef.current) return;

    // `floatRef.current` is a THREE.Group in your version of drei
    const floatGroup = floatRef.current;

    // If focused, invert the Float's transform
    if (focusedMagazine === magazine) {
      floatNullifyRef.current.matrix
        .copy(floatGroup.matrix)
        .invert();
      floatNullifyRef.current.matrixAutoUpdate = false;
    } else {
      // Not focused => identity matrix
      floatNullifyRef.current.matrix.identity();
      floatNullifyRef.current.matrixAutoUpdate = true;
    }
  });

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <group ref={groupRef} {...props}>
      {/* Transparent bounding box to detect pointer events */}
      <mesh
        geometry={new THREE.BoxGeometry(2.5, 1.5, 1)}
        material={new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
        })}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setHighlighted(true);
        }}
        onPointerLeave={(e) => {
          e.stopPropagation();
          setHighlighted(false);
        }}
        {...bind()}
        pointerEvents={
          focusedMagazine && focusedMagazine !== magazine ? "none" : "auto"
        }
      >
        {/* Use Float; store its ref in floatRef */}
        <Float
          ref={floatRef}
          floatIntensity={1}
          speed={2}
          rotationIntensity={2}
          enabled={focusedMagazine !== magazine}
        >
          {/* This group will invert the Float transform if focused */}
          <group ref={floatNullifyRef}>
            {/* Finally, rotate pages -90deg and render them */}
            <group rotation={[0, -Math.PI / 2, 0]}>
              {pages.map((pageData, idx) => (
                <Page
                  key={idx}
                  page={delayedPage}
                  number={idx}
                  magazine={magazine}
                  opened={delayedPage > idx}
                  // "bookClosed" if front cover or back cover fully closed:
                  bookClosed={delayedPage === 0 || delayedPage === pages.length}
                  pages={pages}
                  setPage={setPage}
                  highlighted={highlighted}
                  isFocused={focusedMagazine === magazine}
                  {...pageData}
                />
              ))}
            </group>
          </group>
        </Float>
      </mesh>
    </group>
  );
};
