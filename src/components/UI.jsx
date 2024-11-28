export const UI = () => {
  return (
    <>
      <main className=" pointer-events-none select-none z-10 fixed  inset-0  flex justify-between flex-col">
          {/* <a
            className="pointer-events-auto mt-10 ml-10"
            href="https://lessons.wawasensei.dev/courses/react-three-fiber"
          >
            <img className="w-20" src="/images/wawasensei-white.png" />
          </a> */}
          <div>   </div>
          {/* <div className="w-full overflow-auto pointer-events-auto flex justify-center">
            <div className="overflow-auto flex items-center gap-4 max-w-full p-10">
              {[...pages].map((_, index) => (
                <button
                  key={index}
                  className={`border-transparent hover:border-white transition-all duration-300  px-4 py-3 rounded-full  text-lg uppercase shrink-0 border ${
                    index === page
                      ? "bg-white/90 text-black"
                      : "bg-black/30 text-white"
                  }`}
                  onClick={() => setPage(index)}
                >
                  {index === 0 ? "Cover" : `Page ${index}`}
                </button>
              ))}
              <button
                className={`border-transparent hover:border-white transition-all duration-300  px-4 py-3 rounded-full  text-lg uppercase shrink-0 border ${
                  page === pages.length
                    ? "bg-white/90 text-black"
                    : "bg-black/30 text-white"
                }`}
                onClick={() => setPage(pages.length)}
              >
                Back Cover
              </button>
            </div> 
        </div>*/} 
      </main>

      <div className="fixed inset-0 flex items-center -rotate-2 select-none">
        <div className="relative">
          <div className="bg-white/0  animate-horizontal-scroll flex items-center gap-8 w-max px-8">
          <h1 className="shrink-0 text-white text-10xl font-black ">
              Jack Fox Dev
            </h1>
            <h2 className="shrink-0 text-white text-8xl italic font-light">
              Engineer
            </h2>
            <h2 className="shrink-0 text-white text-12xl font-bold">
              Creative
            </h2>
            <h2 className="shrink-0 text-transparent text-12xl font-bold italic outline-text">
              Coder
            </h2> 
          </div>
          <div className="absolute top-0 left-0 bg-white/0 animate-horizontal-scroll-2 flex items-center gap-8 px-8 w-max">
            <h1 className="shrink-0 text-white text-10xl font-black ">
              Jack Fox Dev
            </h1>
            <h2 className="shrink-0 text-white text-8xl italic font-light">
              Engineer
            </h2>
            <h2 className="shrink-0 text-white text-12xl font-bold">
              Creative
            </h2>
            <h2 className="shrink-0 text-transparent text-12xl font-bold italic outline-text">
              Coder
            </h2>
          </div>
        </div>
      </div>
    </>
  );
};