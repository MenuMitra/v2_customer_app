import PropTypes from "prop-types";
import LazyImage from "./Shared/LazyImage";
import { useModal } from "../contexts/ModalContext";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useOutlet } from "../contexts/OutletContext";
import { useMenuItems } from '../hooks/useMenuItems';
import apiService from "../api/apiService";

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
  const { user, setShowAuthOffcanvas, getUserId } = useAuth();
  const { outletId } = useOutlet();
  const userId = getUserId();

  // Check if any portion of this menu exists in cart with safety check
  const cartItemsForMenu = menuItem?.menuId
    ? cartItems.filter((item) => item.menuId == menuItem.menuId)
    : [];
  const totalQuantityForMenu = cartItemsForMenu.reduce(
    (sum, item) => sum + (Number(item?.quantity) || 0),
    0
  );

  // Get the comment for this menu item with safety check
  const menuComment = menuItem?.menuId
    ? getCartItemComment(menuItem.menuId)
    : "";

  const handleFavoriteToggle = async (e) => {
    e.preventDefault();

    if (menuItem?.isCombo) return;

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

  const handleAddToCartClick = async (e) => {
    e.preventDefault();

    if (!menuItem) return;

    // Check if user is authenticated
    if (!user) {
      setShowAuthOffcanvas(true);
      return;
    }

    openModal("addToCart", {
      ...menuItem,
      menuId: menuItem.menuId ?? menuItem.menu_id,
      menuCatId:
        menuItem.menuCatId ??
        menuItem.menu_cat_id ??
        menuItem.category_id,
      outlet_id: menuItem.outlet_id ?? menuItem.outletId ?? outletId,
      cartOnly: true,
    });
  };

  // Handle quantity changes
  const handleQuantityChange = async (increment) => {
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
      menuId: menuItem?.menuId ?? menuItem?.menu_id,
      menuCatId: menuItem?.menuCatId ?? menuItem?.menu_cat_id ?? menuItem?.category_id,
      outlet_id: menuItem?.outlet_id ?? menuItem?.outletId ?? outletId,
      action: increment ? 'increment' : 'decrement',
      // Add to cart in "cart-only" mode: do not create/update server order,
      // and do not redirect to /checkout from this modal.
      cartOnly: true
    });
  };

  return (
    <div className="card-item style-1">
      <div className="dz-media relative">
        <div
          className="block cursor-pointer"
          role="button"
          tabIndex={0}
          onKeyDown={(ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              handleAddToCartClick(ev);
            }
          }}
          onClick={handleAddToCartClick}
        >
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
        </div>
        {discount && (
          <>
            <style>{`
              @keyframes rainbow {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              .rainbow-off-label {
                background: linear-gradient(90deg, #a8e063, #f8ff00, #f7971e, #f857a6, #a8e063);
                background-size: 300% 300%;
                animation: rainbow 3s ease infinite;
              }
            `}</style>
            <div className="rainbow-off-label absolute top-0 left-0 py-[1px] px-2 pl-1.5 rounded-tl-[8px] rounded-br-[10px] text-xs font-bold text-white z-[2] min-w-[32px] text-center tracking-wide">
              {discount} Off
            </div>
          </>
        )}
      </div>
      <div className="dz-content">
        {/* Category name and food type icon */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FoodTypeIcon foodType={menuItem?.menuFoodType} />
            <span className="text-[#6c757d] text-xs">
              {menuItem?.categoryName || "Category"}
            </span>
          </div>
          <a
            href="javascript:void(0);"
            className={`${
              menuItem?.isCombo
                ? "pointer-events-none opacity-40"
                : isFavoriteLoading
                  ? "disabled pointer-events-none"
                  : "pointer-events-auto"
            } cursor-pointer no-underline`}
            onClick={handleFavoriteToggle}
            aria-hidden={menuItem?.isCombo ? true : undefined}
          >
            <div className={`like-button ${isFavoriteBoolean ? "active" : ""}`}>
              <i
                className={`fa-${isFavoriteBoolean ? "solid" : "regular"} fa-heart text-base leading-none ${isFavoriteBoolean ? "text-[#dc3545]" : "text-[#6c757d]"
                  }`}
              />
            </div>
          </a>
        </div>

        <h6 className="title mb-3 text-left">
          <span
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                handleAddToCartClick(ev);
              }
            }}
            onClick={handleAddToCartClick}
          >
            {title}
          </span>
        </h6>

        <div className="dz-meta mb-3">
          <ul className="flex justify-between items-center">
            {/* Spicy index with icon */}
            {menuItem?.spicyIndex && Number(menuItem.spicyIndex) > 0 && (
              <li className="spicy_index flex items-center">
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
                      className={`fa-solid fa-pepper-hot text-sm ${index < 2 ? 'mr-[2px]' : ''} ${colorClass}`}
                    ></i>
                  );
                })}
              </li>
            )}
            <li className="price text-[#3AB4F2] text-[15px] ml-auto">
              {menuItem.offer > 0 ? (
                <>
                  ₹{Math.round((menuItem.price || menuItem.portions?.[0]?.price) * (1 - menuItem.offer / 100))}
                  <del className="ml-2 text-gray-500">
                    ₹{menuItem.price || menuItem.portions?.[0]?.price}
                  </del>
                </>
              ) : (
                `₹${currentPrice || menuItem.price || 0}`
              )}
            </li>
          </ul>
        </div>
        <div className="mt-2 min-h-[38px] relative">
          <a
            className="bg-[var(--primary)] text-white py-2 px-3 sm:px-4 rounded-full w-full inline-flex items-center justify-center no-underline hover:bg-[#178027] transition-colors add-btn light text-xs sm:text-sm md:text-base"
            href="javascript:void(0);"
            onClick={handleAddToCartClick}
            style={{ display: !cartItemsForMenu.length ? 'inline-flex' : 'none' }}
          >
            <i className="fa-solid fa-cart-shopping mr-1 sm:mr-2 text-xs sm:text-sm"></i>
            <span className="whitespace-nowrap">Add to cart</span>
          </a>
          <div
            className={`dz-stepper rounded-stepper stepper-fill ${cartItemsForMenu.length ? "active" : ""}`}
            style={{ display: cartItemsForMenu.length ? 'block' : 'none' }}
          >
            <div className="flex items-center border-2 border-gray-300 rounded-lg justify-between gap-1 sm:gap-2 p-1">
              <button
                className="bg-[var(--primary)] text-white rounded-full p-1.5 sm:p-2 w-[30px] h-[30px] sm:w-[35px] sm:h-[35px] flex items-center justify-center border-0 hover:bg-[var(--primary-dark)] transition-colors flex-shrink-0 text-sm sm:text-base"
                type="button"
                onClick={() => handleQuantityChange(false)}
              >
                -
              </button>

              <div className="flex items-center justify-center flex-1 min-w-0 px-1">
                {cartItemsForMenu.length > 0 ? (
                  (() => {
                    const matchedPortions =
                      menuItem?.portions?.length
                        ? menuItem.portions
                            .map((portion) => {
                              const cartItem = cartItemsForMenu.find(
                                (item) => item.portionId === portion.portion_id
                              );
                              return {
                                ...portion,
                                quantity: cartItem?.quantity || 0,
                              };
                            })
                            .filter((portion) => portion.quantity > 0)
                        : [];

                    if (!matchedPortions.length) {
                      // Fallback: show total quantity even if portion_id mapping differs.
                      return (
                        <div className="text-center w-full">
                          <span className="font-bold text-sm sm:text-base">
                            {totalQuantityForMenu}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div className="flex gap-0 w-full">
                        {matchedPortions.map((portion, index, filteredArray) => (
                          <div
                            key={portion.portion_id}
                            className={`flex-1 text-center ${
                              index < filteredArray.length - 1
                                ? "border-r border-gray-300"
                                : ""
                            }`}
                          >
                            <div className="font-bold text-sm sm:text-base">
                              {portion.quantity}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center w-full">
                    <span className="font-bold text-sm sm:text-base">0</span>
                  </div>
                )}
              </div>

              <button
                className="bg-[var(--primary)] text-white rounded-full p-1.5 sm:p-2 w-[30px] h-[30px] sm:w-[35px] sm:h-[35px] flex items-center justify-center border-0 hover:bg-[var(--primary-dark)] transition-colors flex-shrink-0 text-sm sm:text-base"
                type="button"
                onClick={() => handleQuantityChange(true)}
              >
                +
              </button>
            </div>
          </div>
        </div>
        {menuComment && (
          <div className="text-gray-500 mt-1 text-xs">
            <i className="fas fa-comment-alt mr-1"></i>
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
