import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const isCrossOriginImage = (url) => {
  if (!url || typeof url !== 'string') return true;

  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin !== window.location.origin;
  } catch {
    return true;
  }
};

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

  useEffect(() => {
    setIsLoaded(false);
    setError(false);
    setBlurDataUrl(null);
  }, [src]);

  // Canvas blur only works for same-origin images; skip for CDN/API media URLs.
  useEffect(() => {
    if (!blur || !src || isCrossOriginImage(src)) {
      setBlurDataUrl(null);
      return;
    }

    let cancelled = false;

    const createBlurPlaceholder = async () => {
      try {
        const img = new Image();
        img.src = src;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        if (cancelled) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 10;
        canvas.height = 10;
        ctx.drawImage(img, 0, 0, 10, 10);
        setBlurDataUrl(canvas.toDataURL('image/jpeg', 0.1));
      } catch {
        if (!cancelled) {
          setBlurDataUrl(null);
        }
      }
    };

    createBlurPlaceholder();

    return () => {
      cancelled = true;
    };
  }, [src, blur]);

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

  const imageSrc = error && fallbackSrc ? fallbackSrc : src;
  const showBrokenPlaceholder = error && !fallbackSrc;

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
        {!isLoaded && (
          <div className="shimmer-effect absolute inset-0" />
        )}

        {blur && blurDataUrl && !isLoaded && (
          <img
            src={blurDataUrl}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover blur-[10px] scale-110 transition-opacity duration-200 ease-out ${
              isLoaded ? 'opacity-0' : 'opacity-100'
            }`}
          />
        )}

        {showBrokenPlaceholder && isInView && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#f8f9fa]">
            <i className="fa-solid fa-utensils text-[#6c757d] text-4xl opacity-50" aria-hidden="true" />
          </div>
        )}

        {isInView && !showBrokenPlaceholder && (
          <img
            src={imageSrc}
            alt={alt}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
            decoding="async"
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
  fallbackSrc: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  aspectRatio: PropTypes.string,
  blur: PropTypes.bool
};

export default LazyImage;
