import { atom, useAtom } from "jotai";
import { useEffect, useState } from "react";
import { Page } from "./Page";
import { Float, useTexture } from "@react-three/drei";

export const Magazine = ({
  pictures,
  magazine,
  pageAtom,
  onClick,
  isFocused,
  ...props
}) => {
  const [page, setPage] = useAtom(pageAtom);
  const [delayedPage, setDelayedPage] = useState(page);

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

  // console.log("position", magazine, props.position);

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
      rotation-y={ 0.5 * Math.PI }
      rotation-x={-0.2 * Math.PI}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {isFocused ? (
        pageElements
      ) : (
        <Float
          key={magazine}
          rotation={[4 * Math.PI, 1 * Math.PI, 1.8 * Math.PI]}
          floatIntensity={1}
          speed={2}
          rotationIntensity={2}
        >
          {pageElements}
        </Float>
      )}
    </group>
  );
};
