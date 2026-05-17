'use client';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/solid';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { handleImageError } from './productViewUtils';

interface ImageGalleryProps {
  images: string[];
  productName: string;
  onImageClick: () => void;
}

export function ImageGallery({
  images,
  productName,
  onImageClick,
}: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const paginate = useCallback(
    (newDirection: number) => {
      if (images.length <= 1) return;
      const newIndex =
        (selectedImageIndex + newDirection + images.length) % images.length;
      setDirection(newDirection);
      setSelectedImageIndex(newIndex);
    },
    [selectedImageIndex, images.length]
  );

  const swipeConfidenceThreshold = 10000;
  const handleDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
      const swipePower = Math.abs(offset.x) * velocity.x;
      if (swipePower < -swipeConfidenceThreshold) paginate(1);
      else if (swipePower > swipeConfidenceThreshold) paginate(-1);
    },
    [paginate]
  );

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  return (
    <div className="flex flex-col items-center relative w-full lg:w-1/2">
      <div
        className="relative h-[500px] sm:h-[600px] md:h-[700px] w-full flex items-center justify-center bg-white backdrop-blur-sm rounded-4xl overflow-hidden group cursor-zoom-in border border-white/20 shadow-xl"
        onClick={onImageClick}
      >
        {images.length > 0 ? (
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={selectedImageIndex}
              className="absolute inset-0 w-full h-full"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={handleDragEnd}
            >
              <Image
                draggable={false}
                src={images[selectedImageIndex]}
                alt={`${productName} - Image ${selectedImageIndex + 1}`}
                fill
                style={{ objectFit: 'contain' }}
                priority={selectedImageIndex === 0}
                sizes="(max-width: 768px) 90vw, (max-width: 1024px) 50vw, 40vw"
                unoptimized
                className="w-full h-full pointer-events-none"
                onError={(e) => handleImageError(e)}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <p className="text-black">No image available</p>
        )}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                paginate(-1);
              }}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/20 backdrop-blur-md text-white/80 hover:bg-black/40 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 border border-white/20 shadow-lg"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                paginate(1);
              }}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/20 backdrop-blur-md text-white/80 hover:bg-black/40 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 border border-white/20 shadow-lg"
            >
              <ArrowRightIcon className="h-5 w-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10 p-2 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 shadow-lg">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    const newDirection =
                      index > selectedImageIndex ? 1 : index < selectedImageIndex ? -1 : 0;
                    setDirection(newDirection);
                    setSelectedImageIndex(index);
                  }}
                  aria-label={`Go to image ${index + 1}`}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ease-out ${
                    selectedImageIndex === index
                      ? 'bg-white/95 backdrop-blur-md shadow-lg shadow-white/30 ring-1 ring-white/40 scale-125'
                      : 'bg-white/25 backdrop-blur-sm hover:bg-white/50 hover:shadow-md hover:shadow-white/20 hover:scale-110 ring-1 ring-white/15'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mt-3 mb-4">
          {images.map((img: string, index: number) => (
            <button
              key={index}
              onClick={() => {
                const newDirection =
                  index > selectedImageIndex ? 1 : index < selectedImageIndex ? -1 : 0;
                setDirection(newDirection);
                setSelectedImageIndex(index);
              }}
              aria-label={`Select image ${index + 1}`}
              className={`border-2 p-1 rounded-lg transition-all duration-300 backdrop-blur-sm ${
                selectedImageIndex === index
                  ? 'border-white/80 bg-white/10 shadow-lg'
                  : 'border-white/20 hover:border-white/60 bg-white/5 hover:bg-white/10'
              }`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${index + 1}`}
                width={60}
                height={60}
                unoptimized
                className="rounded-md object-cover bg-white"
                onError={(e) => handleImageError(e)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
