import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { FALLBACK_IMAGE } from './constants';

export default function ImageGallery({ images, primaryImage, onImageClick }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const allImages = primaryImage 
    ? [primaryImage, ...(images || []).filter(img => img !== primaryImage)]
    : images || [];

  const validImages = allImages.filter(Boolean);

  const goToPrev = (e) => {
    e.stopPropagation();
    setSelectedIndex(prev => prev === 0 ? validImages.length - 1 : prev - 1);
  };

  const goToNext = (e) => {
    e.stopPropagation();
    setSelectedIndex(prev => prev === validImages.length - 1 ? 0 : prev + 1);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div 
        className="relative bg-gray-100 rounded-2xl overflow-hidden aspect-[4/3] group shadow-inner"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onImageClick(selectedIndex)}
      >
        <img 
          src={validImages[selectedIndex] || FALLBACK_IMAGE}
          alt="Product"
          className="w-full h-full object-cover cursor-zoom-in transition-transform duration-700 group-hover:scale-110"
          onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

        {/* Navigation Arrows */}
        {validImages.length > 1 && (
          <>
            <button 
              onClick={goToPrev}
              className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur rounded-full text-gray-800 shadow-lg hover:bg-white transition-all transform ${isHovered ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={goToNext}
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur rounded-full text-gray-800 shadow-lg hover:bg-white transition-all transform ${isHovered ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
        
        {/* Zoom Hint */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col items-center gap-2`}>
            <div className="p-3 bg-black/40 backdrop-blur-md rounded-full">
                <ZoomIn className="w-8 h-8" />
            </div>
        </div>

        {/* Image Counter Badge */}
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
          {selectedIndex + 1} / {validImages.length || 1}
        </div>
      </div>

      {/* Thumbnails */}
      {validImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
          {validImages.map((img, idx) => (
            <button 
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                selectedIndex === idx 
                ? 'border-primary ring-2 ring-primary/30 shadow-lg scale-105 z-10' 
                : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
              }`}
            >
              <img 
                src={img || FALLBACK_IMAGE} 
                alt={`Thumbnail ${idx + 1}`} 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
