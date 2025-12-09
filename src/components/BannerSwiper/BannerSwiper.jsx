import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import PropTypes from 'prop-types';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';

const styles = `
.recomand-swiper {
  padding: 0 16px !important;
  overflow: visible !important;
}

.recomand-swiper .swiper-wrapper {
  align-items: center;
}

.recomand-swiper .swiper-slide {
  transition: all 0.8s ease;
  opacity: 0.4;
  transform: scale(0.9);
}

.recomand-swiper .swiper-slide-active {
  opacity: 1;
  transform: scale(1);
  z-index: 1;
}

.recomand-swiper .swiper-slide-prev,
.recomand-swiper .swiper-slide-next {
  opacity: 0.6;
  transform: scale(0.85);
  z-index: 0;
}

.recomand-swiper .card.add-banner {
  width: 100%;
  height: 160px;
  background-size: cover;
  background-position: center;
  border-radius: 15px;
  transition: all 0.8s ease;
}

.recomand-swiper .card-info {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s ease;
}

.recomand-swiper .swiper-slide-active .card-info {
  opacity: 1;
  transform: translateY(0);
}

@media (min-width: 576px) {
  .recomand-swiper {
    padding: 0 24px !important;
  }
}

.circle-1,
.circle-2 {
  transition: all 0.8s ease;
  opacity: 0;
  transform: scale(0.8);
}

.swiper-slide-active .circle-1,
.swiper-slide-active .circle-2 {
  opacity: 1;
  transform: scale(1);
}
`;

const defaultBanners = [
  {
    id: 1,
    title: '20% OFF',
    subtitle: 'Happy Weekend',
    description: '*for All Menus',
    bgImage: 'assets/images/background/bg2.png'
  },
  {
    id: 2,
    title: '25% OFF',
    subtitle: 'Happy Weekend',
    description: '*for All Menus',
    bgImage: 'assets/images/background/bg3.png'
  },
  {
    id: 3,
    title: '15% OFF',
    subtitle: 'Happy Weekend',
    description: '*for All Menus',
    bgImage: 'assets/images/background/bg4.png'
  }
];

function BannerSwiper({ 
  banners = defaultBanners,
  onBannerClick,
  autoplayDelay = 3000,
  pauseOnHover = true,
  disableOnInteraction = false
}) {
  return (
    <>
      <style>{styles}</style>
      <div className="mb-2.5">
        <div className="swiper-btn-center-lr">
          <Swiper
            modules={[Autoplay]}
            centeredSlides={true}
            className="tag-group mt-4 recomand-swiper"
            loop={true}
            speed={800}
            autoplay={{
              delay: autoplayDelay,
              disableOnInteraction: disableOnInteraction,
              pauseOnMouseEnter: pauseOnHover,
            }}
            breakpoints={{
              320: {
                slidesPerView: 1.5,
                spaceBetween: 12,
              },
              576: {
                slidesPerView: 1.8,
                spaceBetween: 16,
              },
              768: {
                slidesPerView: 2.2,
                spaceBetween: 20,
              }
            }}
          >
            {banners.map((banner, index) => (
              <SwiperSlide key={banner.id}>
                <style>{`
                  .banner-bg-${index} {
                    background-image: url(${banner.bgImage});
                  }
                `}</style>
                <div 
                  className={`card add-banner banner-bg-${index} cursor-pointer`}
                  onClick={() => onBannerClick?.(banner)}
                >
                  <div className="circle-1"></div>
                  <div className="circle-2"></div>
                  <div className="card-body">
                    <div className="card-info">
                      <span className="text-xs font-medium text-dark">
                        {banner.subtitle}
                      </span>
                      <h1 
                        data-text={banner.title} 
                        className="title mb-2"
                      >
                        {banner.title}
                      </h1>
                      <small>{banner.description}</small>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </>
  );
}

BannerSwiper.propTypes = {
  banners: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      subtitle: PropTypes.string.isRequired,
      description: PropTypes.string,
      bgImage: PropTypes.string.isRequired
    })
  ),
  onBannerClick: PropTypes.func,
  autoplayDelay: PropTypes.number,
  pauseOnHover: PropTypes.bool,
  disableOnInteraction: PropTypes.bool
};

export default BannerSwiper;
