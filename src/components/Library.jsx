import { Float, useTexture } from "@react-three/drei";
import { atom } from "jotai";
import { Magazine } from "./Magazine";
import { useRef } from "react";


const smackAtom = atom(0);
const vagueAtom = atom(0);
const engineerAtom = atom(0);

const pictures = [
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
  "15SandroWeb",
  "16Tarot",
  "17Tarot",
  "18Tarot",
  "19Tarot",
  "20Events",
  "21Events",
];

export const pages = [
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
  useTexture.preload(`/textures/smack/${page.front}.png`);
  useTexture.preload(`/textures/smack/${page.back}.png`);
  useTexture.preload(`/textures/book-cover-roughness.png`);
});



export const Library = () => {

  return (
    <>
      <Float
        rotation-x={-Math.PI / 4}
        floatIntensity={0.5}
        speed={0.5}
        rotationIntensity={2}
      >
        <Magazine position={[-2, 0, 0]} pages={pages} pageAtom={smackAtom}/>
      </Float>

      <Float
        rotation-x={-Math.PI / 4}
        floatIntensity={0.5}
        speed={0.5}
        rotationIntensity={2}
      >
        <Magazine position={[2, 0, 0]} pages={pages} pageAtom={vagueAtom}/>
      </Float>

      <Float
        rotation-x={-Math.PI / 4}
        floatIntensity={0.5}
        speed={0.5}
        rotationIntensity={2}
      >
        <Magazine position={[0, -2, 0]} pages={pages} pageAtom={engineerAtom}/>
      </Float>

    </>
  )
}