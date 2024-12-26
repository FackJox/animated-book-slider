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
  const [focusedMagazine, setFocusedMagazine] = useAtom(focusedMagazineAtom);

  const [highlighted, setHighlighted] = useState(false);

  // For page flips
  const groupRef = useRef();
  // Helper object to position/rotate relative to the camera in focus mode
  const helper = useRef(new THREE.Object3D()).current;

  // We'll need the camera and viewport size
  const { camera, size } = useThree();

  // UseCursor changes pointer if hovered & not focused
  useCursor(highlighted && focusedMagazine !== magazine);

  // Build the pages array from pictures
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

  // Play flip sound on page change
  useEffect(() => {
    const audio = new Audio("/audios/page-flip-01a.mp3");
    audio.play();
  }, [page]);

  // Distinguish between click vs. swipe
  const handleSwipeOrClick = (deltaX, deltaY, e) => {
    if (focusedMagazine && focusedMagazine !== magazine) return;
    const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (totalMovement < 5) {
      // Treat as click → toggle focus
      e.stopPropagation();
      setFocusedMagazine((prev) => (prev === magazine ? null : magazine));
    } else {
      // Horizontal swipes = page turns
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 50 && page > 0) {
          setPage((p) => p - 1);
        } else if (deltaX < -50 && page < pages.length ) {
          setPage((p) => p + 1);
        }
      }
      // vertical swipes ignored
    }
  };

  // unify pointer & touch events
  const bind = useGesture(
    {
      onDrag: ({ last, movement: [dx, dy], event }) => {
        if (event.preventDefault) event.preventDefault();
        if (last) handleSwipeOrClick(dx, dy, event);
      },
    },
    { eventOptions: { passive: false } }
  );

  // Smoothly animate page turning in delayed increments
  useEffect(() => {
    let timeout;
    const animatePageFlip = () => {
      setDelayedPage((current) => {
        if (current === page) return current;
        timeout = setTimeout(
          animatePageFlip,
          Math.abs(page - current) > 2 ? 50 : 150
        );
        return current < page ? current + 1 : current - 1;
      });
    };
    animatePageFlip();
    return () => clearTimeout(timeout);
  }, [page]);

  // Store initial transforms
  const initialPositionRef = useRef(null);
  const initialQuaternionRef = useRef(null);
  const initialCameraQuaternionRef = useRef(null);

  useEffect(() => {
    if (!groupRef.current) return;
    // Capture real-world initial position & rotation
    initialPositionRef.current = groupRef.current.position.clone();
    initialQuaternionRef.current = groupRef.current.quaternion.clone();

    // Also store camera's quaternion if you want to restore it
    initialCameraQuaternionRef.current = camera.quaternion.clone();
  }, [camera]);


  useFrame(() => {
    if (!groupRef.current || !initialPositionRef.current) return;
  
    if (focusedMagazine === magazine) {
      // 1) Compute zDist so box width = viewport width.
      const geometryWidth = 3.5; // your BoxGeometry is 2 wide
      const aspect = size.width / size.height;
      const fovRad = (camera.fov * Math.PI) / 180;
      const zDist = (geometryWidth / 2) / (aspect * Math.tan(fovRad / 2));
  
      // 2) Compute a position directly in front of the camera
      const newPos = new THREE.Vector3();
      newPos.copy(camera.position);
      // Camera looks forward along negative-Z in its local space, so:
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
      newPos.addScaledVector(forward, zDist);
  
      // 3) Lerp the group to that position
      groupRef.current.position.lerp(newPos, 0.1);
  
      // 4) Slerp the group rotation to match camera orientation
      groupRef.current.quaternion.slerp(camera.quaternion, 0.1);
  
      // 5) Gently rotate camera to look at the group
      const currentCamQuat = camera.quaternion.clone();
      camera.lookAt(groupRef.current.position);
      const targetCamQuat = camera.quaternion.clone();
      camera.quaternion.copy(currentCamQuat);
      camera.quaternion.slerp(targetCamQuat, 0.1);
    } else {
      // Unfocused => back to initial
      groupRef.current.position.lerp(initialPositionRef.current, 0.1);
      groupRef.current.quaternion.slerp(initialQuaternionRef.current, 0.1);
  
      // Also restore camera orientation
      if (initialCameraQuaternionRef.current) {
        camera.quaternion.slerp(initialCameraQuaternionRef.current, 0.1);
      }
    }
  });
  

  return (
    <group ref={groupRef} {...props}>
      <mesh
        geometry={new THREE.BoxGeometry(2.5, 1.5, 1)}
        material={new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.3 })}
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
        <group>
          <Float
            floatIntensity={1}
            speed={2}
            rotationIntensity={2}
            enabled={focusedMagazine !== magazine}
          >
            <group rotation={[0, -Math.PI / 2, 0]}>
              {pages.map((pageData, idx) => (
                <Page
                  key={idx}
                  page={delayedPage}
                  number={idx}
                  magazine={magazine}
                  opened={delayedPage > idx}
                  bookClosed={
                    delayedPage === 0 || delayedPage === pages.length
                  }
                  pages={pages}
                  setPage={setPage}
                  highlighted={highlighted}
                  isFocused={focusedMagazine === magazine}
                  {...pageData}
                />
              ))}
            </group>
          </Float>
        </group>
      </mesh>
    </group>
  );
};
