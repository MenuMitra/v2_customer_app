import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const LazyImage = ({
  src,
  alt,
  fallbackSrc,
  className = '',
  style = {},
  aspectRatio = '1/1',
  blur = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imageRef = useRef(null);
  const observerRef = useRef(null);
  const [blurDataUrl, setBlurDataUrl] = useState(null);

  // Generate low-quality placeholder
  useEffect(() => {
    if (blur && src) {
      createBlurPlaceholder(src);
    }
  }, [src, blur]);

  const createBlurPlaceholder = async (imageSrc) => {
    try {
      // Create a tiny version of the image (e.g., 10px wide)
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 10;
      canvas.height = 10;
      ctx.drawImage(img, 0, 0, 10, 10);
      const blurredDataUrl = canvas.toDataURL('image/jpeg', 0.1);
      setBlurDataUrl(blurredDataUrl);
    } catch (err) {
      console.error('Error creating blur placeholder:', err);
    }
  };

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observerRef.current.disconnect();
        }
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    );

    if (imageRef.current) {
      observerRef.current.observe(imageRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const handleImageError = () => {
    setError(true);
    setIsLoaded(true);
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .lazy-image-wrapper {
          aspect-ratio: ${aspectRatio};
        }
        .shimmer-effect {
          background: linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>
      <div
        ref={imageRef}
        className={`lazy-image-wrapper relative overflow-hidden bg-[#f0f0f0] ${className}`}
        style={style}
      >
        {/* Shimmer Effect */}
        {!isLoaded && (
          <div className="shimmer-effect absolute inset-0" />
        )}

        {/* Blur Placeholder */}
        {blur && blurDataUrl && !isLoaded && (
          <img
            src={blurDataUrl}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover blur-[10px] scale-110 transition-opacity duration-200 ease-out ${
              isLoaded ? 'opacity-0' : 'opacity-100'
            }`}
          />
        )}

        {/* Main Image */}
        {isInView && (
          <img
            src={error ? fallbackSrc : src}
            alt={alt}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ease-in-out will-change-[transform,opacity] ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
            }`}
          />
        )}
      </div>
    </>
  );
};

LazyImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  fallbackSrc: PropTypes.string.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  aspectRatio: PropTypes.string,
  blur: PropTypes.bool
};

export default LazyImage;
