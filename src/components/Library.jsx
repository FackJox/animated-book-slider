// Library.js
import { Float, useTexture } from "@react-three/drei";
import { atom, useAtom } from "jotai";
import { Magazine } from "./Magazine";
import React, { useEffect, useState, useMemo, useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";

// Atoms for page states
const smackAtom = atom(0);
const vagueAtom = atom(0);
const engineerAtom = atom(0);

// Atom to track the focused magazine
export const focusedMagazineAtom = atom(null);

const picturesSmack = [
  "02Contents",
  "03Contents",
  "04Editorial",
  "05Editorial",
  "06Graphics",
  "07Graphics",
  "08Scout",
  "09Scout",
  "10Bunker",
  "11Bunker",
  "12AI",
  "13AI",
  "14Sandro",
  "15Sandro",
  "16Tarot",
  "17Tarot",
  "18Tarot",
  "19Tarot",
  "20Events",
  "21Events",
];

const picturesEngineer = [
  "02Contents",
  "03Contents",
  "04Editorial",
  "05Editorial",
  "06DigitalTwins",
  "07DigitalTwins",
  "08DigitalTwins",
  "09DigitalTwins",
  "10WindTurbines",
  "11WindTurbines",
  "12HPC",
  "13HPC",
  "14Modelling",
  "15Modelling",
  "16Transformation",
  "17Transformation",
  "18Transformation",
  "19Transformation",
];

const picturesVague = [
  "02Contents",
  "03Contents",
  "04Editorial",
  "05Editorial",
  "06Timeline",
  "07Timeline",
  "08About",
  "09About",
  "10Contributers",
  "11Contributers",
];

const magazines = {
  vague: "vague",
  engineer: "engineer",
  smack: "smack",
};

export const Library = (props) => {
  const { viewport } = useThree();
  const [isPortrait, setIsPortrait] = useState(false);
  
  useLayoutEffect(() => {
    setIsPortrait(viewport.width < viewport.height);
  }, [viewport.width, viewport.height]);

  const [smackPage] = useAtom(smackAtom);
  const [vaguePage] = useAtom(vagueAtom);
  const [engineerPage] = useAtom(engineerAtom);

  const positions = useMemo(
    () => ({
      [magazines.smack]: isPortrait 
        ? [-0.65 + (smackPage > 0 ? 0.65 : 0), 2, 3]   // Portrait: top
        : [-2.5 + (smackPage > 0 ? 0.65 : 0), 1, 5], // Landscape: left
      [magazines.vague]: isPortrait
        ? [-0.65 + (vaguePage > 0 ? 0.65 : 0), 0, 3]  // Portrait: bottom
        : [1.5 + (vaguePage > 0 ? 0.65 : 0), 1, 5],  // Landscape: right
      [magazines.engineer]: isPortrait
        ? [-0.65 + (engineerPage > 0 ? 0.65 : 0), -2, 3]  // Portrait: further down
        : [-0.5 + (engineerPage > 0 ? 0.65 : 0), -1, 5], // Landscape: bottom
    }),
    [isPortrait, smackPage, vaguePage, engineerPage]
  );

  return (
    <group {...props}>
      {Object.entries({
        [magazines.smack]: {
          position: positions[magazines.smack],
          pictures: picturesSmack,
          atom: smackAtom,
        },
        [magazines.vague]: {
          position: positions[magazines.vague],
          pictures: picturesVague,
          atom: vagueAtom,
        },
        [magazines.engineer]: {
          position: positions[magazines.engineer],
          pictures: picturesEngineer,
          atom: engineerAtom,
        },
      }).map(([magazineName, config]) => (
        <animated.group key={magazineName} position={config.position}>
          <Magazine
            pictures={config.pictures}
            pageAtom={config.atom}
            magazine={magazineName}
            focusedMagazineAtom={focusedMagazineAtom}
            isPortrait={isPortrait}
            layoutPosition={positions[magazineName]}
          />
        </animated.group>
      ))}
    </group>
  );
};
