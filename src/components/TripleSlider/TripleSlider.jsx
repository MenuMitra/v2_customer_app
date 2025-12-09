// src/components/TripleSlider/TripleSlider.jsx
import PropTypes from 'prop-types';
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles in correct order
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// Import required modules
import { EffectFade, Pagination, Navigation } from 'swiper/modules';

const TripleSlider = ({
  slides,
  className = '',
}) => {
  const limitedSlides = slides.slice(0, 5);

  return (
    <div className={`w-full relative touch-pan-y ${className}`}>
      <style>{`
        .triple-swiper .swiper-button-next,
        .triple-swiper .swiper-button-prev {
          color: #fff;
          background: rgba(0, 0, 0, 0.3);
          width: 35px;
          height: 35px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }
        
        .triple-swiper .swiper-button-next:after,
        .triple-swiper .swiper-button-prev:after {
          font-size: 18px;
        }
        
        .triple-swiper .swiper-pagination {
          position: absolute;
          bottom: 40px;
          left: 0;
          right: 0;
          z-index: 20;
        }
        
        .triple-swiper .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: #fff;
          opacity: 0.5;
          border-radius: 50%;
          display: inline-block;
          margin: 0 4px;
          transition: transform 0.3s ease;
        }
        
        .triple-swiper .swiper-pagination-bullet-active {
          opacity: 1;
          transform: scale(1.2);
        }
      `}</style>
      <Swiper
        modules={[EffectFade, Pagination, Navigation]}
        effect={'fade'} // Add fade effect for smooth transitions
        slidesPerView={1}
        spaceBetween={0}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        navigation={true}
        grabCursor={true} // Makes it clear the slider is interactive
        touchRatio={1} // Makes touch/swipe more responsive
        touchAngle={45} // Makes swiping easier
        touchEventsTarget="wrapper" // Improves touch detection
        className="triple-swiper w-full h-full"
      >
        {limitedSlides.map((slide, index) => (
          <SwiperSlide key={index} className="w-full h-full relative">
            <div className="w-full aspect-square relative overflow-hidden">
              <div className="absolute left-0 right-0 bottom-0 h-[100px] bg-gradient-to-b from-transparent to-black/50 pointer-events-none" />
              <img 
                src={slide.backgroundImage}
                alt={slide.title || `Slide ${index + 1}`}
                className="w-full h-full object-cover block"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

TripleSlider.propTypes = {
  slides: PropTypes.arrayOf(
    PropTypes.shape({
      backgroundImage: PropTypes.string.isRequired,
      title: PropTypes.string,
    })
  ).isRequired,
  className: PropTypes.string,
};

export default TripleSlider;
