import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import LazyImage from "./Shared/LazyImage";
import { useModal } from "../contexts/ModalContext";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useMenuItems } from '../hooks/useMenuItems';

// FoodTypeIcon component
const FoodTypeIcon = ({ foodType }) => {
  const getIcon = () => {
    switch (foodType?.toLowerCase()) {
      case "veg":
        return (
          <div className="w-[14px] h-[14px] rounded-[3px] border border-[#4CAF50] bg-white flex items-center justify-center align-middle">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]"></div>
          </div>
        );
      case "nonveg":
        return (
          <div className="w-[14px] h-[14px] rounded-[3px] border border-[#F44336] bg-white flex items-center justify-center align-middle">
            <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-[#F44336]"></div>
          </div>
        );
      case "vegan":
        return (
          <div className="w-[14px] h-[14px] rounded-[3px] border border-[#4CAF50] bg-white flex items-center justify-center align-middle">
            <i className="fa-solid fa-leaf text-[#4CAF50] text-[10px] leading-none"></i>
          </div>
        );
      case "egg":
        return (
          <div className="w-[14px] h-[14px] rounded-[3px] border border-[#e0e0e0] bg-white flex items-center justify-center align-middle">
            <i className="fa-solid fa-egg text-[#B0BEC5] text-[10px]"></i>
          </div>
        );
      default:
        return null;
    }
  };

  return getIcon();
};

const VerticalMenuCard = ({
  image,
  title,
  currentPrice,
  isFavorite = false,
  discount,
  menuItem = {},
  onFavoriteUpdate,
}) => {
  // Convert isFavorite to boolean if it's a number
  const isFavoriteBoolean = typeof isFavorite === 'number' ? isFavorite === 1 : Boolean(isFavorite);

  const { toggleFavorite, isFavoriteLoading } = useMenuItems();
  const { openModal } = useModal();
  const { cartItems, getCartItemComment } = useCart();
  const { user, setShowAuthOffcanvas } = useAuth();

  // Generate the product URL from menuItem data with safety checks
  const detailPageUrl =
    menuItem?.menuId && menuItem?.menuCatId
      ? `/product-detail/${menuItem.menuId}/${menuItem.menuCatId}`
      : "#";

  // Check if any portion of this menu exists in cart with safety check
  const cartItemsForMenu = menuItem?.menuId
    ? cartItems.filter((item) => item.menuId === menuItem.menuId)
    : [];

  // Get the comment for this menu item with safety check
  const menuComment = menuItem?.menuId
    ? getCartItemComment(menuItem.menuId)
    : "";

  const handleFavoriteToggle = async (e) => {
    e.preventDefault();

    if (!user) {
      setShowAuthOffcanvas(true);
      return;
    }

    if (isFavoriteLoading || !menuItem?.menuId) return;

    try {
      const authData = localStorage.getItem("auth");
      const auth = authData ? JSON.parse(authData) : null;

      if (!auth || !auth.userId || !auth.accessToken) {
        openModal("LOGIN_REQUIRED");
        return;
      }

      // Use the mutation instead of direct API call
      toggleFavorite(
        {
          menuId: menuItem.menuId,
          isFavorite: isFavoriteBoolean,
          userId: auth.userId
        },
        {
          onSuccess: () => {
            onFavoriteUpdate(menuItem.menuId, !isFavoriteBoolean);
          },
          onError: (error) => {
            console.error("Error updating favorite status:", error);
            openModal("ERROR", {
              message: error.message || "Failed to update favorite status",
            });
          }
        }
      );
    } catch (error) {
      console.error("Error updating favorite status:", error);
      openModal("ERROR", {
        message: error.message || "Failed to update favorite status",
      });
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

  // Handle quantity changes
  const handleQuantityChange = (increment) => {
    if (!menuItem) return;

    // Check if user is authenticated
    const authData = localStorage.getItem("auth");
    if (!authData || !user) {
      setShowAuthOffcanvas(true);
      return;
    }

    // Pass the action information to the modal
    openModal("addToCart", {
      ...menuItem,
      action: increment ? 'increment' : 'decrement'
    });
  };

  return (
    <div className="card-item style-1">
      <div className="dz-media relative">
        <Link to={detailPageUrl}>
          {typeof image === "string" ? (
            <LazyImage
              src={image}
              alt={title}
              blur={true}
              className="menu-image rounded-3xl w-full"
            />
          ) : (
            <div className="flex justify-center items-center w-full aspect-square bg-[#f8f9fa]">
              {image}
            </div>
          )}
        </Link>
        {discount && (
          <div
            className="rainbow-off-label absolute top-0 left-0 py-[1px] px-2 pl-1.5 rounded-tl-[8px] rounded-br-[10px] text-xs font-bold text-white z-[2] min-w-[32px] text-center tracking-wide"
            style={{
              background: "linear-gradient(90deg, #a8e063, #f8ff00, #f7971e, #f857a6, #a8e063)",
              backgroundSize: "300% 300%",
              animation: "rainbow 3s ease infinite",
            }}
          >
            {discount} Off
          </div>
        )}
      </div>
      <div className="dz-content">
        {/* Category name and food type icon */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FoodTypeIcon foodType={menuItem?.menuFoodType} />
            <span className="text-muted small text-xs">
              {menuItem?.categoryName || "Category"}
            </span>
          </div>
          <a
            href="javascript:void(0);"
            className={`${isFavoriteLoading ? "disabled pointer-events-none" : "pointer-events-auto"} cursor-pointer no-underline`}
            onClick={handleFavoriteToggle}
          >
            <div className={`like-button ${isFavoriteBoolean ? "active" : ""}`}>
              <i
                className={`fa-${isFavoriteBoolean ? "solid" : "regular"} fa-heart text-base leading-none`}
                style={{
                  color: isFavoriteBoolean ? "#dc3545" : "#6c757d",
                }}
              />
            </div>
          </a>
        </div>

        <h6 className="title mb-3 text-left">
          <Link to={detailPageUrl}>{title}</Link>
        </h6>

        <div className="dz-meta mb-3">
          <ul className="flex justify-between items-center">
            {/* Spicy index with icon */}
            {menuItem?.spicyIndex && Number(menuItem.spicyIndex) > 0 && (
              <li className="spicy_index flex items-center">
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
                      className={`fa-solid fa-pepper-hot text-sm ${index < 2 ? 'mr-[2px]' : ''}`}
                      style={{ color }}
                    ></i>
                  );
                })}
              </li>
            )}
            <li className="price text-[#3AB4F2] text-[15px] ml-auto">
              {menuItem.offer > 0 ? (
                <>
                  ₹{Math.round(menuItem.portions?.[0]?.price * (1 - menuItem.offer / 100))}
                  <del className="ms-2 text-muted">
                    ₹{menuItem.portions?.[0]?.price}
                  </del>
                </>
              ) : (
                `₹${currentPrice}`
              )}
            </li>
          </ul>
        </div>
        <div className="mt-2 min-h-[38px]">
          {!cartItemsForMenu.length ? (
            <a
              className="btn btn-primary add-btn light w-100 rounded-3xl"
              href="javascript:void(0);"
              onClick={handleAddToCartClick}
            >
              <i className="fa-solid fa-cart-shopping me-2"></i>
              Add to cart
            </a>
          ) : null}
          <div
            className={`dz-stepper border-1 rounded-stepper stepper-fill ${cartItemsForMenu.length ? "active" : ""
              }`}
          >
            <div className="input-group bootstrap-touchspin bootstrap-touchspin-injected flex items-center">
              <button
                className="btn btn-primary rounded-3xl p-2 w-[35px] h-[35px]"
                type="button"
                onClick={() => handleQuantityChange(false)}
              >
                -
              </button>

              <div className="flex items-center justify-center mx-2 flex-1">
                {cartItemsForMenu.length > 0 && menuItem?.portions ? (
                  <div className="row g-0 w-100">
                    {menuItem.portions
                      .map((portion) => {
                        const cartItem = cartItemsForMenu.find(
                          (item) => item.portionId === portion.portion_id
                        );
                        return {
                          ...portion,
                          quantity: cartItem?.quantity || 0,
                          comment: cartItem?.comment || "",
                        };
                      })
                      .filter((portion) => portion.quantity > 0)
                      .map((portion, index, filteredArray) => (
                        <div
                          key={portion.portion_id}
                          className={`col text-center ${index < filteredArray.length - 1 ? "border-end" : ""
                            }`}
                        >
                          <div className="fw-bold">{portion.quantity}</div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center w-100">
                    <span className="fw-bold">0</span>
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary rounded-3xl p-2 w-[35px] h-[35px]"
                type="button"
                onClick={() => handleQuantityChange(true)}
              >
                +
              </button>
            </div>
          </div>
        </div>
        {menuComment && (
          <div className="text-muted small mt-1 text-xs">
            <i className="fas fa-comment-alt me-1"></i>
            {menuComment}
          </div>
        )}
      </div>
    </div>
  );
};

VerticalMenuCard.propTypes = {
  image: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  title: PropTypes.string.isRequired,
  currentPrice: PropTypes.number.isRequired,
  isFavorite: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
  discount: PropTypes.string,
  menuItem: PropTypes.object,
  onFavoriteUpdate: PropTypes.func.isRequired,
};

export default VerticalMenuCard;
