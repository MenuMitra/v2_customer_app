import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import PropTypes from "prop-types";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";

const categories = [
  /* ... same categories array ... */
];

const DEFAULT_IMAGE =
  "https://as2.ftcdn.net/jpg/02/79/12/03/1000_F_279120368_WzIoR2LV2Cgy33oxy6eEKQYSkaWr8AFU.jpg";

const CategorySwiper = ({
  onCategoryClick,
  containerClassName,
  containerStyle,
  categories: customCategories = categories,
  isLoading = false,
  activeCategoryId,
  onActiveCategoryChange,
}) => {
  const [selectedId, setSelectedId] = useState(activeCategoryId ?? "all");
  const currentId = activeCategoryId ?? selectedId;
  const handleClick = (category) => {
    setSelectedId(category.menuCatId);
    if (onActiveCategoryChange) {
      onActiveCategoryChange(category.menuCatId);
    }
    if (onCategoryClick) {
      onCategoryClick(category);
    }
  };

  if (isLoading) {
    return (
      <div className={`categories-box p-0 m-0 ${containerClassName || ""}`}>
        <style>{`
          .swiper-slide-auto {
            width: auto !important;
          }
          .swiper-wrapper {
            transform: translate3d(0, 0, 0) !important;
            will-change: transform;
            gap: 0;
          }
          .categorie-swiper {
            padding: 0 8px !important;
          }
        `}</style>
        <div className="swiper-btn-center-lr">
          <Swiper
            spaceBetween={2}
            slidesPerView="auto"
            className="categorie-swiper px-2"
            loop={false}
            grabCursor={true}
            cssMode={true}
            touchEventsTarget="container"
            touchRatio={1}
            touchAngle={45}
            resistance={true}
            resistanceRatio={0.85}
          >
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <SwiperSlide key={item} className="swiper-slide-auto">
                <div className="cursor-pointer inline-flex items-center rounded-full border h-8 px-3 py-1.5 bg-[#e9ecef] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] border-[#dee2e6]">
                  <div className="flex items-center">
                    <Skeleton
                      width={40}
                      height={16}
                      baseColor="#E9ECEF"
                      highlightColor="#F8F9FA"
                      className="rounded-xl leading-none inline-block"
                    />
                    <Skeleton
                      width={20}
                      height={16}
                      baseColor="#E9ECEF"
                      highlightColor="#F8F9FA"
                      className="rounded-xl ml-1.5 leading-none inline-block"
                    />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    );
  }

  return (
    <div className={`categories-box p-0 m-0 ${containerClassName || ""}`} style={containerStyle}>
      <style>{`
        .swiper-slide-auto {
          width: auto !important;
        }
        .swiper-wrapper {
          transform: translate3d(0, 0, 0) !important;
          will-change: transform;
          gap: 0;
        }
        .categorie-swiper {
          padding: 0 8px !important;
        }
      `}</style>
      <div className="swiper-btn-center-lr">
        <Swiper
          spaceBetween={2}
          slidesPerView="auto"
          className="categorie-swiper px-2"
          loop={false}
          grabCursor={true}
          cssMode={true}
          touchEventsTarget="container"
          touchRatio={1}
          touchAngle={45}
          resistance={true}
          resistanceRatio={0.85}
        >
          {customCategories.map((category) => {
            const isActive = currentId === category.menuCatId;
            return (
              <SwiperSlide key={category.menuCatId} className="swiper-slide-auto">
                <div
                  onClick={() => handleClick(category)}
                  className={`
                    cursor-pointer 
                    inline-flex 
                    items-center 
                    rounded-full 
                    border 
                    h-8 
                    px-3 
                    py-1.5 
                    text-sm
                    transition-all
                    duration-200
                    ease-in-out
                    ${isActive 
                      ? 'bg-[#e9ecef] border-[#ced4da] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.05)]' 
                      : 'bg-[#e9ecef] border-[#dee2e6] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-white hover:border-[#ced4da] hover:shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
                    }
                  `}
                >
                  <span className="text-[#212529] flex items-center gap-1.5">
                    {category.categoryName}
                    <span className="text-[#6c757d] text-[13px]">({category.menuCount || 0})</span>
                  </span>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </div>
  );
};

CategorySwiper.propTypes = {
  onCategoryClick: PropTypes.func,
  containerClassName: PropTypes.string,
  containerStyle: PropTypes.object,
  categories: PropTypes.array,
  isLoading: PropTypes.bool,
  activeCategoryId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onActiveCategoryChange: PropTypes.func,
};

export default CategorySwiper;
