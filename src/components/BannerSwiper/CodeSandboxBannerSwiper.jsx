import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, EffectFade } from 'swiper/modules';
import PropTypes from 'prop-types';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
import 'swiper/css/effect-fade';

const CodeSandboxBannerSwiper = ({ 
  banners = [],
  onBannerClick,
  autoplayDelay = 3000,
  pauseOnHover = true,
  disableOnInteraction = false
}) => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const handleBannerClick = (banner) => {
    if (onBannerClick) {
      onBannerClick(banner);
    }
  };

  return (
    <div className="codesandbox-banner-swiper">
      <style jsx>{`
        .codesandbox-banner-swiper {
          position: relative;
          width: 100%;
          height: 250px;
          margin: 20px 0;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .codesandbox-banner-swiper .swiper {
          width: 100%;
          height: 100%;
        }

        .codesandbox-banner-swiper .swiper-slide {
          position: relative;
          background-position: center;
          background-size: cover;
          background-repeat: no-repeat;
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .codesandbox-banner-swiper .banner-slide {
          width: 100%;
          height: 100%;
          background-position: center;
          background-size: cover;
          background-repeat: no-repeat;
          position: relative;
        }

        .codesandbox-banner-swiper .swiper-slide:hover {
          transform: scale(1.02);
        }

        /* Removed banner overlay styles - no text overlay */

        /* Navigation Buttons */
        .codesandbox-banner-swiper .swiper-button-next,
        .codesandbox-banner-swiper .swiper-button-prev {
          color: white;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 50%;
          width: 50px;
          height: 50px;
          margin-top: -25px;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .codesandbox-banner-swiper .swiper-button-next:hover,
        .codesandbox-banner-swiper .swiper-button-prev:hover {
          background: rgba(0, 0, 0, 0.8);
          transform: scale(1.1);
        }

        .codesandbox-banner-swiper .swiper-button-next:after,
        .codesandbox-banner-swiper .swiper-button-prev:after {
          font-size: 20px;
          font-weight: bold;
        }

        /* Removed pagination styles */

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .codesandbox-banner-swiper {
            height: 200px;
            margin: 15px 0;
            border-radius: 15px;
          }

          .banner-title {
            font-size: 1.8rem;
          }

          .banner-subtitle {
            font-size: 1rem;
          }

          .banner-description {
            font-size: 0.9rem;
          }

          .codesandbox-banner-swiper .swiper-button-next,
          .codesandbox-banner-swiper .swiper-button-prev {
            width: 40px;
            height: 40px;
            margin-top: -20px;
          }

          .codesandbox-banner-swiper .swiper-button-next:after,
          .codesandbox-banner-swiper .swiper-button-prev:after {
            font-size: 16px;
          }

          /* Removed banner overlay mobile styles */
        }

        @media (max-width: 480px) {
          .codesandbox-banner-swiper {
            height: 250px;
            margin: 10px 0;
            border-radius: 12px;
          }

          .banner-title {
            font-size: 1.5rem;
          }

          .banner-subtitle {
            font-size: 0.9rem;
          }

          .banner-description {
            font-size: 0.8rem;
          }

          .codesandbox-banner-swiper .swiper-button-next,
          .codesandbox-banner-swiper .swiper-button-prev {
            width: 35px;
            height: 35px;
            margin-top: -17.5px;
          }

          .codesandbox-banner-swiper .swiper-button-next:after,
          .codesandbox-banner-swiper .swiper-button-prev:after {
            font-size: 14px;
          }

          /* Removed banner overlay mobile styles */
        }

        /* Touch optimizations */
        .codesandbox-banner-swiper .swiper {
          touch-action: pan-x pan-y;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }

        .codesandbox-banner-swiper .swiper-wrapper {
          touch-action: pan-x pan-y;
        }

        .codesandbox-banner-swiper .swiper-slide {
          touch-action: pan-x pan-y;
        }
      `}</style>

      <Swiper
        modules={[Navigation, Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        centeredSlides={true}
        loop={banners.length > 1}
        effect="fade"
        fadeEffect={{
          crossFade: true
        }}
        autoplay={{
          delay: autoplayDelay,
          disableOnInteraction: disableOnInteraction,
          pauseOnMouseEnter: pauseOnHover,
        }}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        speed={800}
        // Touch parameters for better responsiveness
        touchRatio={1}
        touchAngle={45}
        threshold={5}
        allowTouchMove={true}
        touchStartPreventDefault={false}
        touchMoveStopPropagation={false}
        touchReleaseOnEdges={false}
        simulateTouch={true}
        resistanceRatio={0.85}
        // Additional parameters for smooth experience
        watchSlidesProgress={true}
        preventInteractionOnTransition={false}
        allowSlideNext={true}
        allowSlidePrev={true}
        // Accessibility
        a11y={{
          enabled: true,
          prevSlideMessage: 'Previous banner',
          nextSlideMessage: 'Next banner',
          firstSlideMessage: 'This is the first banner',
          lastSlideMessage: 'This is the last banner',
        }}
      >
        {banners.map((banner) => (
          <SwiperSlide 
            key={banner.banner_id || banner.id}
            onClick={() => handleBannerClick(banner)}
          >
            <div 
              className="banner-slide"
              style={{
                backgroundImage: `url(${banner.bgImage || banner.image})`,
              }}
              alt={`${banner.title || banner.heading || banner.subtitle || 'Banner'} - ${banner.description || banner.subtitle || ''}`}
              title={`${banner.title || banner.heading || banner.subtitle || 'Banner'}`}
              role="img"
              aria-label={`${banner.title || banner.heading || banner.subtitle || 'Banner'} - ${banner.description || banner.subtitle || ''}`}
            >
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

   
    </div>
  );
};

CodeSandboxBannerSwiper.propTypes = {
  banners: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      banner_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      title: PropTypes.string,
      heading: PropTypes.string,
      subtitle: PropTypes.string,
      description: PropTypes.string,
      bgImage: PropTypes.string,
      image: PropTypes.string
    })
  ),
  onBannerClick: PropTypes.func,
  autoplayDelay: PropTypes.number,
  pauseOnHover: PropTypes.bool,
  disableOnInteraction: PropTypes.bool
};

export default CodeSandboxBannerSwiper;
