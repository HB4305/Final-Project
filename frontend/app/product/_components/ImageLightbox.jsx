import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { FALLBACK_IMAGE } from './constants';

export default function ImageLightbox({ isOpen, images, currentIndex, onClose, onPrev, onNext }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10"
        aria-label="Close"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <button 
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
          <button 
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        </>
      )}

      {/* Main image */}
      <img 
        src={images[currentIndex] || FALLBACK_IMAGE}
        alt={`Image ${currentIndex + 1}`}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
      />

      {/* Image counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
