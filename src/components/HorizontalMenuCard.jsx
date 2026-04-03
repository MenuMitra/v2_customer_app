import { useState } from "react";
import PropTypes from "prop-types";
import { useModal } from "../contexts/ModalContext";
import { useAuth } from "../contexts/AuthContext";
import { useOutlet } from "../contexts/OutletContext";
import { useCart } from "../contexts/CartContext";
import apiService from "../api/apiService";

// FoodTypeIcon component
const FoodTypeIcon = ({ foodType }) => {
  const getIcon = () => {
    switch (foodType?.toLowerCase()) {
      case "veg":
        return (
          <div className="w-4 h-4 rounded-[3px] border border-[#4CAF50] bg-white flex items-center justify-center align-middle">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]"></div>
          </div>
        );
      case "nonveg":
        return (
          <div className="w-3.5 h-3.5 rounded-[3px] border border-[#F44336] bg-white flex items-center justify-center align-middle">
            <div className="nonveg-triangle"></div>
          </div>
        );
      case "vegan":
        return (
          <div className="w-3.5 h-3.5 rounded-[3px] border border-[#4CAF50] bg-white flex items-center justify-center align-middle">
            <i className="fa-solid fa-leaf text-[#4CAF50] text-[10px] leading-none"></i>
          </div>
        );
      case "egg":
        return (
          <div className="w-3.5 h-3.5 rounded-[3px] border border-[#e0e0e0] bg-white flex items-center justify-center align-middle">
            <i className="fa-solid fa-egg text-[#B0BEC5] text-[10px]"></i>
          </div>
        );
      default:
        return null;
    }
  };

  return getIcon();
};

const HorizontalMenuCard = ({
  title = "",
  currentPrice = 0,
  originalPrice = null,  // Add this line
  discount = "",
  menuItem = {},
  isFavorite = false,
  onFavoriteUpdate,
  image,
  // Add new props for customization
  imageSize = {
    width: "100px",
    height: "100px"
  },
  colors = {
    primary: "#2d9cdb",
    success: "#27ae60",
    danger: "#dc3545",
    secondary: "#6c757d",
    discountGradient: ["#ffe066", "#ffd700"],
    discountText: "#5a5a00"
  },
  fontSizes = {
    title: "15px",
    category: "11px",
    price: "14px",
    discount: "10px"
  },
  icons = {
    category: "fa fa-cutlery",
    placeholder: "fa-solid fa-utensils"
  }
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { openModal } = useModal();
  const { user, setShowAuthOffcanvas, getUserId } = useAuth();
  const { outletId } = useOutlet();
  const { getCartItemComment } = useCart(); // Add this
  const userId = getUserId();

  // Convert isFavorite to boolean if it's a number
  const isFavoriteBoolean = typeof isFavorite === 'number' ? isFavorite === 1 : Boolean(isFavorite);

  // Removed unused cartItemsForMenu

  // Get the comment for this menu item
  const menuComment = menuItem?.menuId
    ? getCartItemComment(menuItem.menuId)
    : "";

  // Check if this menu item belongs to the current outlet
  const isCurrentOutlet = true;

  const openAddToCartModal = () => {
    if (!menuItem?.menuId) return;
    if (!user) {
      setShowAuthOffcanvas(true);
      return;
    }
    openModal("addToCart", {
      ...menuItem,
      menuId: menuItem?.menuId ?? menuItem?.menu_id,
      menuCatId: menuItem?.menuCatId ?? menuItem?.menu_cat_id ?? menuItem?.category_id,
      outlet_id: menuItem?.outlet_id ?? menuItem?.outletId ?? outletId,
      cartOnly: true,
    });
  };

  // Match vertical cards: tap row opens add-to-cart modal (no product-detail page).
  const handleCardClick = (e) => {
    if (
      e.target.closest(".like-button") ||
      e.target.closest("button")
    ) {
      return;
    }
    openAddToCartModal();
  };

  const handleFavoriteToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setShowAuthOffcanvas(true);
      return;
    }

    if (isLoading || !menuItem?.menuId) return;

    try {
      setIsLoading(true);

      const targetOutletId = menuItem?.outletId ?? outletId;

      if (isFavoriteBoolean) {
        await apiService.favorites.remove({
          outletId: targetOutletId,
          userId,
          menuId: menuItem.menuId
        });
      } else {
        await apiService.favorites.add({
          outletId: targetOutletId,
          userId,
          menuId: menuItem.menuId
        });
      }

      onFavoriteUpdate(menuItem.menuId, !isFavoriteBoolean, targetOutletId);
    } catch (error) {
      console.error("Error updating favorite status:", error);
      openModal("ERROR", {
        message: error.message || "Failed to update favorite status",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCartClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!menuItem) return;

    if (!user) {
      setShowAuthOffcanvas(true);
      return;
    }

    openModal("addToCart", {
      ...menuItem,
      menuId: menuItem?.menuId ?? menuItem?.menu_id,
      menuCatId: menuItem?.menuCatId ?? menuItem?.menu_cat_id ?? menuItem?.category_id,
      outlet_id: menuItem?.outlet_id ?? menuItem?.outletId ?? outletId,
      cartOnly: true,
    });
  };

  // Removed unused handleQuantityChange

  // Removed unused detailPageUrl

  return (
    <div
      className="horizontal-menu-card bg-white rounded-lg relative shadow border border-gray-200 pb-0 my-3 pt-0 min-h-[50px] w-full overflow-x-auto whitespace-nowrap cursor-pointer"
      onClick={handleCardClick}
      style={{
        '--image-width': imageSize.width,
        '--image-height': imageSize.height,
        '--discount-gradient-start': colors.discountGradient[0],
        '--discount-gradient-end': colors.discountGradient[1],
        '--discount-text-color': colors.discountText,
        '--discount-font-size': fontSizes.discount,
        '--title-font-size': fontSizes.title,
        '--category-color': colors.success,
        '--category-font-size': fontSizes.category,
        '--price-color': colors.primary,
        '--price-font-size': fontSizes.price,
      }}
    >
      <style>{`
        .horizontal-menu-card {
          flex: 0 0 auto;
          min-width: 200px;
          scroll-snap-align: start;
          transition: transform 0.2s ease;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          margin-right: 0.5rem;
          -webkit-overflow-scrolling: touch;
          -ms-overflow-style: -ms-autohiding-scrollbar;
        }
        .horizontal-menu-card:last-child {
          margin-right: 0.5rem;
        }
        .nonveg-triangle {
          width: 0;
          height: 0;
          border-left: 3px solid transparent;
          border-right: 3px solid transparent;
          border-bottom: 5px solid #F44336;
        }
        .menu-image-container {
          width: var(--image-width);
          height: var(--image-height);
        }
        .discount-badge {
          background: linear-gradient(90deg, var(--discount-gradient-start), var(--discount-gradient-end));
          color: var(--discount-text-color);
          font-size: var(--discount-font-size);
        }
        .menu-title {
          font-size: var(--title-font-size);
        }
        .menu-category {
          color: var(--category-color);
          font-size: var(--category-font-size);
        }
        .menu-price {
          color: var(--price-color);
          font-size: var(--price-font-size);
        }
        @media screen and (min-width: 768px) {
          .horizontal-menu-card {
            width: calc(50vw - 1rem);
          }
        }
        @media screen and (min-width: 1024px) {
          .horizontal-menu-card {
            width: calc(33.333vw - 1rem);
          }
        }
      `}</style>
      <div className="flex items-center min-h-[70px] min-w-full">
        {/* Left side - Image and Icons */}
        <div className="menu-image-container relative flex items-center justify-center rounded border border-gray-200 bg-[#f8f9fa] shrink-0 overflow-hidden">
          {/* Background icon (centered) */}
          <i
            className={`${icons.placeholder} text-[55px] opacity-50 text-gray-600 z-[1] pointer-events-none leading-none`}
          ></i>

          {/* Menu Image */}
          {typeof image === 'string' && (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover absolute left-0 top-0 z-[2]"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}

          {/* Veg/Nonveg/Vegan/Egg icon */}
          {menuItem.menuFoodType && (
            <span className="absolute left-[5px] bottom-[5px] z-[3]">
              <FoodTypeIcon foodType={menuItem.menuFoodType} />
            </span>
          )}

          {/* Favorite icon */}
          {isCurrentOutlet && (
            <a
              href="javascript:void(0);"
              className={`absolute right-[2px] bottom-[2px] z-[3] no-underline ${isLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
              onClick={handleFavoriteToggle}
            >
              <div className={`like-button ${isFavoriteBoolean ? "active" : ""}`}>
                <i
                  className={`fa-${isFavoriteBoolean ? "solid" : "regular"} fa-heart text-base leading-none bg-white p-1 rounded-full shadow-sm border-[1.5px] border-white ${isFavoriteBoolean ? "text-[#dc3545]" : "text-gray-600"
                    }`}
                />
              </div>
            </a>
          )}
        </div>
        {/* Right side - Content */}
        <div className="ml-2 flex-grow pr-1">
          {/* Discount badge */}
          {discount && (
            <div className="discount-badge absolute top-0 left-0 font-semibold rounded-tl-[6px] rounded-br-lg px-[7px] py-[1px] z-[4]">
              {discount} Off
            </div>
          )}
          {/* Remove the Link component and just use plain text */}
          <h5 className="menu-title mb-1 font-bold">
            {title}
          </h5>
          {/* Category name */}
          {menuItem.categoryName && (
            <div className="menu-category font-medium mb-[1px]">
              <i className={`${icons.category} mr-1`}></i>
              {menuItem.categoryName}
            </div>
          )}

          {/* Price Section with Cart Button */}
          <div className="flex items-center mb-1 justify-between">
            <h6 className="menu-price mb-0 mr-1 font-semibold">
              ₹{currentPrice || menuItem.price || menuItem.portions?.[0]?.price || 0}
              {originalPrice ? (
                <del className="ml-2 text-gray-500 text-xs">
                  ₹{originalPrice}
                </del>
              ) : (menuItem.offer > 0 && (menuItem.price || menuItem.portions?.[0]?.price)) ? (
                <del className="ml-2 text-gray-500 text-xs">
                  ₹{menuItem.price || menuItem.portions?.[0]?.price}
                </del>
              ) : null}
            </h6>

            {/* Add Spicy Index here */}
            <div className="flex items-center gap-2">
              {menuItem?.spicyIndex && Number(menuItem.spicyIndex) > 0 && (
                <div className="spicy_index flex items-center">
                  {[...Array(3)].map((_, index) => {
                    const spicyIndex = Number(menuItem.spicyIndex);
                    let colorClass = "text-[#E0E0E0]"; // default: white/grey
                    if (spicyIndex === 1) {
                      colorClass = index === 0 ? "text-[#22A45D]" : "text-[#E0E0E0]"; // green, rest white
                    } else if (spicyIndex === 2) {
                      colorClass = index < 2 ? "text-[#FFA500]" : "text-[#E0E0E0]"; // orange, last white
                    } else if (spicyIndex === 3) {
                      colorClass = "text-[#FF2D2D]"; // all red
                    }
                    return (
                      <i
                        key={index}
                        className={`fa-solid fa-pepper-hot text-xs ${index < 2 ? "mr-[2px]" : ""} ${colorClass}`}
                      ></i>
                    );
                  })}
                </div>
              )}

              {/* Cart Button */}
              <button
                className="bg-primary text-white rounded-full p-0 w-8 h-8 flex items-center justify-center hover:bg-primary-hover transition-colors duration-200"
                onClick={handleAddToCartClick}
              >
                <i className="fa-solid fa-cart-shopping text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      {menuComment && (
        <div className="text-gray-500 text-xs mt-1">
          <i className="fas fa-comment-alt mr-1"></i>
          {menuComment}
        </div>
      )}
    </div>
  );
};

HorizontalMenuCard.propTypes = {
  title: PropTypes.string,
  currentPrice: PropTypes.number,
  discount: PropTypes.string,
  menuItem: PropTypes.shape({
    menuId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    menuCatId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    menuName: PropTypes.string,
    menuFoodType: PropTypes.string,
    categoryName: PropTypes.string,
    spicyIndex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    portions: PropTypes.array,
    rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    offer: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isSpecial: PropTypes.bool,
    isFavourite: PropTypes.bool,
    isActive: PropTypes.bool,
    image: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    outletName: PropTypes.string,
    outletId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  isFavorite: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
  onFavoriteUpdate: PropTypes.func.isRequired,
  image: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  // Add new prop types
  imageSize: PropTypes.shape({
    width: PropTypes.string,
    height: PropTypes.string
  }),
  colors: PropTypes.shape({
    primary: PropTypes.string,
    success: PropTypes.string,
    danger: PropTypes.string,
    secondary: PropTypes.string,
    discountGradient: PropTypes.arrayOf(PropTypes.string),
    discountText: PropTypes.string
  }),
  fontSizes: PropTypes.shape({
    title: PropTypes.string,
    category: PropTypes.string,
    price: PropTypes.string,
    discount: PropTypes.string
  }),
  icons: PropTypes.shape({
    category: PropTypes.string,
    placeholder: PropTypes.string
  }),
  originalPrice: PropTypes.number,
};

export default HorizontalMenuCard;
