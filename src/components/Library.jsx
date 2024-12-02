import { Float, useTexture } from "@react-three/drei";
import { atom, useAtom } from "jotai";
import { Magazine } from "./Magazine";
import { useEffect, useRef } from "react";
import { useThree } from '@react-three/fiber';

const smackAtom = atom(0);
const vagueAtom = atom(0);
const engineerAtom = atom(0);
const focusedMagazineAtom = atom(null); // Add this atom to track which magazine is focused

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

export const Library = ({ ...props }) => {
  const [focusedMagazine, setFocusedMagazine] = useAtom(focusedMagazineAtom);
  const { camera } = useThree();

  const handleMagazineClick = (magazineName) => {
    // setFocusedMagazine(focusedMagazine === magazineName ? null : magazineName);
  };

  const getFocusedPosition = () => {
    return [-0.75, -1, 3]; // Consistent focused position for all magazines
  };

  // const getUnfocusedPosition = (defaultPosition) => {
  //   return [defaultPosition[0] * 1.5, defaultPosition[1] * 1.5, -2];
  // };

  const getPosition = (defaultPosition, magazineName) => {
    if (focusedMagazine === null) {
      return defaultPosition;
    }
    if (focusedMagazine === magazineName) {
      return getFocusedPosition();
    }
    // return getUnfocusedPosition(defaultPosition);
  };

  // const getRotation = (magazineName) => {
  //   if (focusedMagazine === magazineName) {
  //     return [-Math.PI / 8, 0, 0]; // Consistent focused rotation
  //   }
  //   return [-Math.PI / 4, 0, 0]; // Default rotation
  // };

  useEffect(() => {
    if (focusedMagazine) {
      const focusedPosition = getFocusedPosition();
      // camera.position.set(focusedPosition[0], focusedPosition[1], focusedPosition[2] + 5); // Adjust the Z position to move the camera back
      camera.lookAt(focusedPosition[0], focusedPosition[1], focusedPosition[2]);
    }
      // console.log("🚀 ~ useEffect ~ camera.position:", camera.position)
  }, [focusedMagazine, camera]);

  return (
    <group {...props}>
      {Object.entries({
        [magazines.smack]: {
          position: [-2, 0, 0],
          pictures: picturesSmack,
          atom: smackAtom,
        },
        [magazines.vague]: {
          position: [2, 0, 0],
          pictures: picturesVague,
          atom: vagueAtom,
        },
        [magazines.engineer]: {
          position: [0, -2, 0],
          pictures: picturesEngineer,
          atom: engineerAtom,
        },
      }).map(([magazineName, config]) => (
   
          <Magazine
            key={magazineName}
            position={getPosition(config.position, magazineName)}
            pictures={config.pictures}
            pageAtom={config.atom}
            magazine={magazineName}
            onClick={() => handleMagazineClick(magazineName)}
            isFocused={focusedMagazine === magazineName}

          />
      
      ))}
    </group>
  );
};
