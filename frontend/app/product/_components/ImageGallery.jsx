import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FALLBACK_IMAGE } from './constants';

export default function ImageGallery({ images, primaryImage, onImageClick }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Tạo array images với primary ở đầu
  const allImages = primaryImage 
    ? [primaryImage, ...(images || []).filter(img => img !== primaryImage)]
    : images || [];

  const validImages = allImages.filter(Boolean);

  const goToPrev = () => {
    setSelectedIndex(prev => prev === 0 ? validImages.length - 1 : prev - 1);
  };

  const goToNext = () => {
    setSelectedIndex(prev => prev === validImages.length - 1 ? 0 : prev + 1);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative bg-muted rounded-xl overflow-hidden aspect-square group">
        <img 
          src={validImages[selectedIndex] || FALLBACK_IMAGE}
          alt="Product"
          className="w-full h-full object-cover cursor-zoom-in"
          onClick={() => onImageClick(selectedIndex)}
          onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
        />
        
        {/* Navigation Arrows */}
        {validImages.length > 1 && (
          <>
            <button 
              onClick={goToPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image Counter Badge */}
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
          {selectedIndex + 1} / {validImages.length || 1}
        </div>
      </div>

      {/* Thumbnails */}
      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {validImages.map((img, idx) => (
            <button 
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition hover:opacity-80 ${
                selectedIndex === idx ? 'border-primary ring-2 ring-primary/30' : 'border-border'
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
