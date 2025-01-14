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
  const [viewingRightPage, setViewingRightPage] = useState(false);

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

  // Add new refs for boundary checking
  const boundingBoxRef = useRef(new THREE.Box3());
  const frustumRef = useRef(new THREE.Frustum());
  const projScreenMatrixRef = useRef(new THREE.Matrix4());
  const targetZDistRef = useRef(null);

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

  // Set initial right page view when focusing
  useEffect(() => {
    if (focusedMagazine === magazine) {
      setViewingRightPage(true);
    }
  }, [focusedMagazine, magazine]);

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
      // Horizontal swipe => page turn or view shift
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (isPortrait) {
          if (deltaX > 50) {
            // Swipe right (going backward)
            if (viewingRightPage) {
              // If on right page, shift focus to left page
              setViewingRightPage(false);
            } else {
              // If on left page and not at the start, turn page backward
              if (page > 0) {
                setPage(page - 1);
                setViewingRightPage(true); // Focus on right page after turning back
              }
            }
          } else if (deltaX < -50) {
            // Swipe left (going forward)
            if (!viewingRightPage) {
              // If on left page, shift focus to right page
              setViewingRightPage(true);
            } else {
              // If on right page and not at the end, turn page forward
              if (page < pages.length) {
                setPage(page + 1);
                setViewingRightPage(false); // Focus on left page after turning
              }
            }
          }
        } else {
          // Regular landscape mode behavior
          if (deltaX > 50) {
            setPage((p) => Math.max(p - 1, 0));
          } else if (deltaX < -50) {
            setPage((p) => Math.min(p + 1, pages.length));
          }
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

  // Add helper function to get corners from bounding box
  const getBoxCorners = (box) => {
    return [
      new THREE.Vector3(box.min.x, box.min.y, box.min.z), // 000
      new THREE.Vector3(box.min.x, box.min.y, box.max.z), // 001
      new THREE.Vector3(box.min.x, box.max.y, box.min.z), // 010
      new THREE.Vector3(box.min.x, box.max.y, box.max.z), // 011
      new THREE.Vector3(box.max.x, box.min.y, box.min.z), // 100
      new THREE.Vector3(box.max.x, box.min.y, box.max.z), // 101
      new THREE.Vector3(box.max.x, box.max.y, box.min.z), // 110
      new THREE.Vector3(box.max.x, box.max.y, box.max.z), // 111
    ];
  };

  // ------------------------------
  // Focus/unfocus animation
  // ------------------------------
  useFrame(() => {
    if (!groupRef.current || !initialPositionRef.current) return;

    if (focusedMagazine === magazine) {
      const geometryWidth = 3;
      const geometryHeight = 2;
      // Reduce minimum safety margin
      const minSafetyMargin = 1.02; // Reduced from 1.1
      const aspect = size.width / size.height;
      const fovRad = (camera.fov * Math.PI) / 180;

      // Calculate initial zDist with tighter margins
      const zDistH = (geometryWidth / 2) / (aspect * Math.tan(fovRad / 2));
      const zDistV = (geometryHeight / 2) / Math.tan(fovRad / 2);
      let zDist = Math.max(zDistH, zDistV) * minSafetyMargin;

      // Update bounding box
      boundingBoxRef.current.setFromObject(groupRef.current);
      
      // Update projection matrix
      camera.updateMatrixWorld();
      projScreenMatrixRef.current.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      );
      frustumRef.current.setFromProjectionMatrix(projScreenMatrixRef.current);

      const corners = getBoxCorners(boundingBoxRef.current);
      
      // Convert corners to NDC space
      const ndcCorners = corners.map(corner => {
        corner.project(camera);
        return corner;
      });

      // More aggressive clipping check
      const isClipping = ndcCorners.some(
        corner => 
          Math.abs(corner.x) > 0.98 || // Reduced from 1
          Math.abs(corner.y) > 0.98 || // Reduced from 1
          corner.z < -1 || 
          corner.z > 1
      );

      // Adjust target zDist if clipping
      if (isClipping) {
        zDist *= 1.05; // Smaller increase (from 1.1)
      } else {
        // More aggressive approach to moving closer
        const testZDist = zDist * 0.98; // Try 2% closer (from 0.95)
        const testPos = camera.position.clone().add(
          new THREE.Vector3(0, 0, -testZDist)
            .applyQuaternion(camera.quaternion)
        );
        
        // More lenient clipping test when moving closer
        const wouldClip = ndcCorners.some(corner => {
          const testCorner = corner.clone();
          testCorner.project(camera);
          return Math.abs(testCorner.x) > 0.97 || // Reduced from 0.95
                 Math.abs(testCorner.y) > 0.97;    // Reduced from 0.95
        });

        if (!wouldClip) {
          zDist = testZDist;
        }
      }

      // Faster interpolation for distance changes
      if (targetZDistRef.current === null) {
        targetZDistRef.current = zDist;
      } else {
        targetZDistRef.current = THREE.MathUtils.lerp(
          targetZDistRef.current,
          zDist,
          0.15 // Increased from 0.1 for faster response
        );
      }

      const newPos = new THREE.Vector3().copy(camera.position);
      const forward = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(camera.quaternion)
        .normalize();
      
      const portraitZoomFactor = isPortrait ? 0.45 : 1;
      newPos.addScaledVector(forward, targetZDistRef.current * portraitZoomFactor);

      // Calculate base position before horizontal offset
      const basePos = newPos.clone();

      // Add horizontal offset in portrait mode based on which page we're viewing
      if (isPortrait) {
        const right = new THREE.Vector3(1, 0, 0)
          .applyQuaternion(camera.quaternion)
          .normalize();
        const horizontalOffset = viewingRightPage ? -geometryWidth / 4.75 : geometryWidth / 4.75;
        newPos.addScaledVector(right, horizontalOffset);
      }

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

      // Use different lerp speeds for horizontal and other movements
      const currentPos = groupRef.current.position.clone();
      const horizontalLerpFactor = 0.03; // Slower horizontal movement
      const normalLerpFactor = 0.1; // Original speed for other movements

      if (isPortrait) {
        // Separate horizontal and vertical movements
        const horizontalDelta = new THREE.Vector3(
          newPos.x - currentPos.x,
          0,
          0
        );
        const otherDelta = new THREE.Vector3(
          0,
          newPos.y - currentPos.y,
          newPos.z - currentPos.z
        );

        // Apply different lerp speeds
        currentPos.add(horizontalDelta.multiplyScalar(horizontalLerpFactor));
        currentPos.add(otherDelta.multiplyScalar(normalLerpFactor));
        groupRef.current.position.copy(currentPos);
      } else {
        // Use normal lerp for landscape mode
        groupRef.current.position.lerp(newPos, normalLerpFactor);
      }

      // Quaternion lerp remains the same speed
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
      
      // Reset target zDist when unfocused
      targetZDistRef.current = null;
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
          floatIntensity={0.5}
          speed={1.5}
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
