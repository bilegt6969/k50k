export function ProductPageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-white/10 backdrop-blur-2xl border border-white/10 p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl">
        <div className="h-fit w-full flex flex-col lg:flex-row gap-8">
          <div className="flex flex-col items-center w-full lg:w-1/2">
            <div className="relative h-[500px] sm:h-[600px] md:h-[700px] w-full flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20" />
            <div className="flex gap-2 mt-3 mb-4">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="border-2 p-1 rounded-lg border-white/20 bg-white/5 backdrop-blur-sm"
                >
                  <div className="w-[60px] h-[60px] bg-white/10 rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="text-white flex flex-col justify-start items-start w-full lg:w-1/2 p-4">
            <div className="flex space-x-2 mb-2 w-full">
              <div className="h-4 bg-white/20 backdrop-blur-sm rounded w-1/4" />
              <div className="h-4 bg-white/20 backdrop-blur-sm rounded w-1/12" />
              <div className="h-4 bg-white/20 backdrop-blur-sm rounded w-1/3" />
            </div>
            <div className="h-10 bg-white/20 backdrop-blur-sm rounded w-3/4 mb-4" />
            <div className="h-6 bg-white/20 backdrop-blur-sm rounded w-1/2 mb-6" />
            <div className="bg-white/20 backdrop-blur-sm w-full h-[1px] my-6 md:my-10" />
            <div className="relative text-left w-full space-y-4 mt-4">
              <div className="h-4 bg-white/20 backdrop-blur-sm rounded w-1/5 mb-2" />
              <div className="h-16 bg-black/30 backdrop-blur-sm border border-white/20 rounded-full w-full" />
            </div>
            <div className="w-full bg-black/30 backdrop-blur-xl border border-white/20 mt-8 p-6 rounded-2xl">
              <div className="h-5 bg-white/20 backdrop-blur-sm rounded w-1/3 mb-2" />
              <div className="h-8 bg-white/20 backdrop-blur-sm rounded w-1/2 mb-6" />
              <div className="h-12 bg-white/20 backdrop-blur-sm rounded-full w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
