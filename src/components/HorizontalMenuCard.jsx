import React, { useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { useModal } from "../contexts/ModalContext";
import { useAuth } from "../contexts/AuthContext";
import { useOutlet } from "../contexts/OutletContext";
import { useCart } from "../contexts/CartContext"; // Add this import
import apiService from "../api/apiService";
import "./HorizontalMenuCard.css"; // We'll create this CSS file next

// FoodTypeIcon component
const FoodTypeIcon = ({ foodType }) => {
  const getIcon = () => {
    switch (foodType?.toLowerCase()) {
      case "veg":
        return (
          <div
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "3px",
              border: "1px solid #4CAF50",
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              verticalAlign: "middle",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#4CAF50",
              }}
            ></div>
          </div>
        );
      case "nonveg":
        return (
          <div
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "3px",
              border: "1px solid #F44336",
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              verticalAlign: "middle",
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "3px solid transparent",
                borderRight: "3px solid transparent",
                borderBottom: "5px solid #F44336",
              }}
            ></div>
          </div>
        );
      case "vegan":
        return (
          <div
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "3px",
              border: "1px solid #4CAF50",
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              verticalAlign: "middle",
            }}
          >
            <i
              className="fa-solid fa-leaf"
              style={{
                color: "#4CAF50",
                fontSize: "10px",
                lineHeight: 1,
              }}
            ></i>
          </div>
        );
      case "egg":
        return (
          <div
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "3px",
              border: "1px solid #e0e0e0",
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              verticalAlign: "middle",
            }}
          >
            <i
              className="fa-solid fa-egg"
              style={{
                color: "#B0BEC5",
                fontSize: "10px",
                // transform: "rotate(-15deg)",
              }}
            ></i>
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

  // Add useNavigate hook from react-router-dom
  const navigate = useNavigate();

  // Convert isFavorite to boolean if it's a number
  const isFavoriteBoolean = typeof isFavorite === 'number' ? isFavorite === 1 : Boolean(isFavorite);

  // Removed unused cartItemsForMenu

  // Get the comment for this menu item
  const menuComment = menuItem?.menuId
    ? getCartItemComment(menuItem.menuId)
    : "";

  // Check if this menu item belongs to the current outlet
  const isCurrentOutlet = true;

  // Modify the click handler for the entire card
  const handleCardClick = (e) => {
    // Don't navigate if clicking on favorite button or cart button
    if (
      e.target.closest('.like-button') || 
      e.target.closest('.btn-primary')
    ) {
      return;
    }

    if (menuItem?.menuId && menuItem?.menuCatId) {
      // Check if this is a cross-outlet favorite
      const isCrossOutlet = menuItem.outletId && Number(menuItem.outletId) !== Number(outletId);
      
      // Navigate with outlet override state if cross-outlet
      const url = isCrossOutlet 
        ? `/product-detail/${menuItem.menuId}/${menuItem.menuCatId}?overrideOutletId=${menuItem.outletId}&notCurrentOutlet=true`
        : `/product-detail/${menuItem.menuId}/${menuItem.menuCatId}`;
      
      navigate(url, {
        state: isCrossOutlet
          ? { 
              outletIdOverride: menuItem.outletId, 
              notCurrentOutlet: true,
              outletName: menuItem.outletName 
            }
          : undefined
      });
    }
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

  const handleAddToCartClick = (e) => {
    e.preventDefault();

    if (!menuItem) return;

    // Check if user is authenticated
    if (!user) {
      setShowAuthOffcanvas(true);
      return;
    }

    openModal("addToCart", menuItem);
  };

  // Removed unused handleQuantityChange

  // Removed unused detailPageUrl

  return (
    <div 
      className="horizontal-menu-card card product-card position-relative shadow border border-1 border-light pb-0 my-3 pt-0"
      onClick={handleCardClick}  // Add onClick handler here
      style={{ 
        minHeight: 50, 
        // padding: "8px 0",
        width: "100%",
        overflowX: "auto",
        whiteSpace: "nowrap",
        WebkitOverflowScrolling: "touch",
        msOverflowStyle: "-ms-autohiding-scrollbar",
        cursor: 'pointer'  // Add cursor pointer to indicate clickable
      }}>
      <div 
        className="d-flex align-items-center" 
        style={{ 
          minHeight: 70,
          minWidth: "100%",
        }}>
        {/* Left side - Image and Icons */}
        <div 
          className="position-relative d-flex align-items-center justify-content-center rounded-3 border border-1 border-light"
          style={{
            width: imageSize.width,
            height: imageSize.height,
            background: "#f8f9fa",
            flexShrink: 0,
            overflow: "hidden",
          }}>
          {/* Background icon (centered) */}
          <i
            className={icons.placeholder}
            style={{
              fontSize: "55px",
              opacity: 0.5,
              color: "#6c757d",
              zIndex: 1,
              pointerEvents: "none",
              lineHeight: 1,
            }}
          ></i>
          
          {/* Menu Image */}
          {typeof image === 'string' && (
            <img
              src={image}
              alt={title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                left: 0,
                top: 0,
                zIndex: 2,
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          
          {/* Veg/Nonveg/Vegan/Egg icon */}
          {menuItem.menuFoodType && (
            <span
              style={{
                position: "absolute",
                left: 5,
                bottom: 5,
                zIndex: 3,
              }}
            >
              <FoodTypeIcon foodType={menuItem.menuFoodType} />
            </span>
          )}
          
          {/* Favorite icon */}
          {isCurrentOutlet && (
            <a
              href="javascript:void(0);"
              className={`${isLoading ? "disabled" : ""}`}
              onClick={handleFavoriteToggle}
              style={{
                position: "absolute",
                right: 2,
                bottom: 2,
                pointerEvents: isLoading ? "none" : "auto",
                cursor: "pointer",
                textDecoration: "none",
                zIndex: 3,
              }}
            >
              <div className={`like-button ${isFavoriteBoolean ? "active" : ""}`}>
                <i
                  className={`fa-${isFavoriteBoolean ? "solid" : "regular"} fa-heart`}
                  style={{
                    fontSize: "16px",
                    color: isFavoriteBoolean ? "#dc3545" : "#6c757d",
                    lineHeight: 1,
                    background: "#fff",
                    padding: "4px",
                    borderRadius: "50%",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                    border: "1.5px solid #fff",
                  }}
                />
              </div>
            </a>
          )}
        </div>
        {/* Right side - Content */}
        <div className="ms-2 flex-grow-1 pe-1">
          {/* Discount badge */}
          {discount && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                background: `linear-gradient(90deg, ${colors.discountGradient[0]}, ${colors.discountGradient[1]})`,
                color: colors.discountText,
                fontSize: fontSizes.discount,
                fontWeight: 600,
                borderRadius: "6px 0 8px 0",
                padding: "1px 7px",
                zIndex: 4,
              }}
            >
              {discount} Off
            </div>
          )}
          {/* Remove the Link component and just use plain text */}
          <h5
            className="mb-1"
            style={{ 
              fontSize: fontSizes.title, 
              fontWeight: 700, 
              marginBottom: 2 
            }}
          >
            {title}
          </h5>
          {/* Category name */}
          {menuItem.categoryName && (
            <div
              style={{
                color: colors.success,
                fontSize: fontSizes.category,
                fontWeight: 500,
                marginBottom: 1,
              }}
            >
              <i className={`${icons.category} me-1`}></i>
              {menuItem.categoryName}
            </div>
          )}

          {/* Price Section with Cart Button */}
          <div className="d-flex align-items-center mb-1 justify-content-between">
            <h6
              className="mb-0 me-1"
              style={{ 
                color: colors.primary, 
                fontSize: fontSizes.price, 
                fontWeight: 600 
              }}
            >
              ₹{currentPrice}
              {originalPrice && (
                <del className="ms-2 text-muted" style={{ fontSize: "12px" }}>
                  ₹{originalPrice}
                </del>
              )}
            </h6>

            {/* Add Spicy Index here */}
            <div className="d-flex align-items-center gap-2">
              {menuItem?.spicyIndex && Number(menuItem.spicyIndex) > 0 && (
                <div
                  className="spicy_index"
                  style={{
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {[...Array(3)].map((_, index) => {
                    const spicyIndex = Number(menuItem.spicyIndex);
                    let color = "#E0E0E0"; // default: white/grey
                    if (spicyIndex === 1) {
                      color = index === 0 ? "#22A45D" : "#E0E0E0"; // green, rest white
                    } else if (spicyIndex === 2) {
                      color = index < 2 ? "#FFA500" : "#E0E0E0"; // orange, last white
                    } else if (spicyIndex === 3) {
                      color = "#FF2D2D"; // all red
                    }
                    return (
                      <i
                        key={index}
                        className="fa-solid fa-pepper-hot"
                        style={{
                          color,
                          fontSize: "12px",
                          marginRight: index < 2 ? "2px" : "0",
                        }}
                      ></i>
                    );
                  })}
                </div>
              )}

              {/* Cart Button */}
              <button
                className="btn btn-primary rounded-circle p-2"
                onClick={handleAddToCartClick}
                style={{ 
                  width: "32px", 
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0
                }}
              >
                <i className="fa-solid fa-cart-shopping" style={{ fontSize: "14px" }}></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      {menuComment && (
        <div className="text-muted small mt-1" style={{ fontSize: "12px" }}>
          <i className="fas fa-comment-alt me-1"></i>
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
