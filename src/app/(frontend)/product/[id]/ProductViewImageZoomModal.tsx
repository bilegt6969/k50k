'use client';

import { XMarkIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getHighResImageUrl, handleImageError } from './productViewUtils';

interface ImageZoomModalProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export function ImageZoomModal({
  images,
  initialIndex,
  onClose,
}: ImageZoomModalProps) {
  const [currentImageIndex] = useState(initialIndex);
  const closeCallbackRef = useRef(onClose);

  useEffect(() => {
    closeCallbackRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCallbackRef.current();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-white flex flex-col"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-60 p-2 rounded-full bg-black/10 hover:bg-black/20 transition-all duration-200"
        aria-label="Close zoom view"
      >
        <XMarkIcon className="h-6 w-6 text-black" />
      </button>
      <div className="hidden md:flex flex-col items-center w-full h-full overflow-y-auto">
        {images.map((img, index) => (
          <div
            key={index}
            className="w-full flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={getHighResImageUrl(img)}
              alt={`Product image ${index + 1}`}
              width={1500}
              height={1500}
              className="object-contain max-w-full"
              unoptimized
              onError={(e) => handleImageError(e)}
            />
          </div>
        ))}
      </div>
      <div className="md:hidden flex items-center justify-center w-full h-full relative">
        <div
          className="w-full h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={getHighResImageUrl(images[currentImageIndex])}
            alt={`Product image ${currentImageIndex + 1}`}
            fill
            className="object-contain"
            unoptimized
            onError={(e) => handleImageError(e)}
          />
        </div>
      </div>
    </motion.div>
  );
}
