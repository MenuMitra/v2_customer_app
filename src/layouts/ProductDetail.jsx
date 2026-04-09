import { useParams, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../contexts/CartContext";
import { useModal } from "../contexts/ModalContext";
import { useOutlet } from "../contexts/OutletContext";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../api/apiService";
import { useMenuItems } from "../hooks/useMenuItems";
import TripleSlider from "../components/TripleSlider/TripleSlider";

// FoodTypeIcon component
const FoodTypeIcon = ({ foodType }) => {
  const getIcon = () => {
    switch (foodType?.toLowerCase()) {
      case "veg":
        return (
          <div className="w-3.5 h-3.5 rounded-sm border border-[#4CAF50] bg-white flex items-center justify-center align-middle">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]"></div>
          </div>
        );
      case "nonveg":
        return (
          <div className="w-3.5 h-3.5 rounded-sm border border-[#F44336] bg-white flex items-center justify-center align-middle">
            <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-[#F44336]"></div>
          </div>
        );
      case "vegan":
        return (
          <div className="w-3.5 h-3.5 rounded-sm border border-[#4CAF50] bg-white flex items-center justify-center align-middle">
            <i className="fa-solid fa-leaf text-[#4CAF50] text-[10px] leading-none"></i>
          </div>
        );
      case "egg":
        return (
          <div className="w-3.5 h-3.5 rounded-sm border border-[#e0e0e0] bg-white flex items-center justify-center align-middle">
            <i className="fa-solid fa-egg text-[#B0BEC5] text-[10px]"></i>
          </div>
        );
      default:
        return null;
    }
  };

  return getIcon();
};

function ProductDetail() {
  const { menuId, menuCatId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openModal } = useModal();
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const { outletId, orderSettings } = useOutlet();
  const { user, getUserId, setShowAuthOffcanvas } = useAuth();
  const userId = getUserId();
  const { toggleFavorite, isFavoriteLoading } = useMenuItems();

  // Derive effective outlet ID from override (state or URL) or context
  const outletIdOverride = state?.outletIdOverride ?? searchParams.get('overrideOutletId');
  const effectiveOutletId = outletIdOverride ?? outletId;
  const isCrossOutlet = state?.notCurrentOutlet ?? searchParams.get('notCurrentOutlet') === 'true';
  const crossOutletName = state?.outletName ?? (isCrossOutlet ? `Outlet ${outletIdOverride}` : null);

  // Replace useEffect with useQuery
  const {
    data: menuDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["menuDetails", "menu_view", effectiveOutletId, menuId, userId],
    queryFn: () =>
      apiService.menus.viewDetails({
        outletId: effectiveOutletId,
        menuId: Number(menuId),
        userId,
      }),
    enabled: !!effectiveOutletId && !!menuId,
  });

  const defaultPortionId = (() => {
    const portions = menuDetails?.portions || [];
    const flagged = portions.find((p) => Number(p?.flag) === 1);
    return (
      flagged?.portion_id ??
      portions?.[0]?.portion_id ??
      null
    );
  })();

  // Check if item exists in cart with proper menuId comparison
  const cartItem = cartItems.find(
    (item) =>
      item.menuId == Number(menuId) &&
      item.portionId == defaultPortionId
  );

  const handleAddToCart = async () => {
    // Check if user is authenticated
    if (!user) {
      setShowAuthOffcanvas(true);
      return;
    }

    const formattedMenuDetails = {
      ...menuDetails,
      menuId: Number(menuId),
      menu_cat_id: Number(menuCatId),
      outlet_id: Number(effectiveOutletId), // Ensure we pass the outletId we used for fetching
      menuName: menuDetails.menu_name,
      image: menuDetails.images?.[0] || null,
      portions: (menuDetails.portions ?? []).map((portion) => ({
        ...portion,
        portion_id: portion.portion_id,
        portion_name: portion.portion_name,
        price: portion.price,
        unit_value: portion.unit_value,
      })),
    };

    // Add to cart only (no create_order / no redirect to /checkout)
    openModal("addToCart", { ...formattedMenuDetails, cartOnly: true });
  };

  const handleFavoriteToggle = async (e) => {
    e.preventDefault();

    if (!user) {
      setShowAuthOffcanvas(true);
      return;
    }

    if (isFavoriteLoading || !menuId) return;

    try {
      const authData = localStorage.getItem("auth");
      const auth = authData ? JSON.parse(authData) : null;

      if (!auth || !auth.userId || !auth.accessToken) {
        openModal("LOGIN_REQUIRED");
        return;
      }

      // Use the mutation
      toggleFavorite(
        {
          menuId: Number(menuId),
          isFavorite: menuDetails?.is_favourite === 1, // Changed from is_favorite to is_favourite
          userId: auth.userId,
          outletId: effectiveOutletId,
        },
        {
          onSuccess: () => {
            // The query will automatically refetch and update the UI
          },
          onError: (error) => {
            console.error("Error updating favorite status:", error);
            openModal("ERROR", {
              message: error.message || "Failed to update favorite status",
            });
          },
        }
      );
    } catch (error) {
      console.error("Error updating favorite status:", error);
      openModal("ERROR", {
        message: error.message || "Failed to update favorite status",
      });
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="page-content">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="text-center p-5 text-[#6c757d]">Loading...</div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="page-content">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="bg-[#f8d7da] border border-[#f5c2c7] text-[#842029] px-4 py-3 rounded-lg">
              {error.message || "Failed to load menu details"}
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!menuDetails) {
    return (
      <>
        <Header />
        <div className="page-content">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="bg-[#fff3cd] border border-[#ffecb5] text-[#664d03] px-4 py-3 rounded-lg mt-3">
              Menu details not available.
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // In many outlets `get_menu_details` returns pricing fields (default_price, dine_in_price, parcel_price, etc.)
  // and may not include `portions`. Prefer these fields for display (with fallback to default_price).
  const orderType = orderSettings?.order_type || null;
  const defaultPrice = menuDetails?.default_price;
  const rawBasePrice = (() => {
    if (orderType === "dine-in") return menuDetails?.dine_in_price ?? defaultPrice;
    if (orderType === "parcel" || orderType === "takeaway")
      return menuDetails?.parcel_price ?? defaultPrice;
    if (orderType === "delivery") return menuDetails?.delivery_price ?? defaultPrice;
    if (orderType === "drive_through")
      return menuDetails?.drive_through_price ?? defaultPrice;
    return defaultPrice;
  })();

  const basePrice =
    rawBasePrice != null
      ? Number(rawBasePrice)
      : Number(menuDetails?.portions?.[0]?.price);

  const offerPercent = Number(menuDetails?.offer || 0);
  const discountedPrice =
    basePrice != null && !Number.isNaN(basePrice) && offerPercent > 0
      ? Math.round(basePrice * (1 - offerPercent / 100))
      : null;

  return (
    <>
      <Header />
      <div className="page-content">
        {/* Scroll container (body scroll is not reliable in this template, especially on desktop) */}
        <div className="max-h-[calc(100vh-140px)] overflow-y-auto overscroll-contain pb-[220px]">
          {/* Cross-outlet info (compact) */}
          {isCrossOutlet && (
            <div className="mx-3 mt-2">
              <div className="flex items-center text-sm mb-2 bg-[#dc3545] text-white rounded-xl p-2">
                <i className="fa-solid fa-circle-info mr-2"></i>
                <span>
                  This item is from <strong>{crossOutletName}</strong>. Ordering is disabled for your current outlet.
                </span>
              </div>
            </div>
          )}
          {/* IMPORTANT: don't use `bottom-content` here (it sets overflow:hidden in CSS) */}
          <div className="content-body">
          {/* Always-visible summary (so page never looks blank) */}
          <div className="max-w-[1200px] mx-auto px-4 mt-3">
            <div className="bg-white border border-[#e9ecef] rounded-2xl p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-[#6c757d]">
                    <FoodTypeIcon foodType={menuDetails.menu_food_type} />
                    <span className="truncate">
                      {menuDetails.category_name || "Category"}
                    </span>
                    {menuDetails.spicy_index && (
                      <span className="ml-1">• Spicy: {menuDetails.spicy_index}</span>
                    )}
                  </div>
                  <div className="mt-1 font-semibold text-[18px] text-[var(--secondary)] truncate">
                    {menuDetails.menu_name || "Menu"}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-[#6c757d]">Price</div>
                  <div className="font-bold text-[#2196f3]">
                    {basePrice == null || Number.isNaN(basePrice)
                      ? "Unavailable"
                      : offerPercent > 0 && discountedPrice != null
                        ? `₹${discountedPrice}`
                        : `₹${basePrice}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Comment out or remove the existing code:
<div className="swiper-btn-center-lr my-0">
  <Swiper
    modules={[Pagination, Autoplay]}
    pagination={{
      el: ".swiper-pagination",
      clickable: true,
    }}
    autoplay={{
      delay: 3000,
      disableOnInteraction: false,
    }}
    className="demo-swiper swiper-initialized swiper-horizontal swiper-pointer-events swiper-watch-progress swiper-backface-hidden"
  >
    {(menuDetails.images?.length ? menuDetails.images : [null]).map(
      (image, index) => (
        <SwiperSlide
          key={index}
          role="group"
          aria-label={`${index + 1} / ${menuDetails.images?.length || 1}`}
          className={index === 0 ? "swiper-slide-visible swiper-slide-active" : ""}
        >
          <div className="dz-banner-heading">
            <div className="overlay-black-light">
              {image ? (
                <LazyImage
                  src={image}
                  alt={`${menuDetails.menu_name} image ${index + 1}`}
                  className="bnr-img"
                  aspectRatio="16/9"
                  blur={true}
                />
              ) : (
                <div
                  className="bnr-img flex justify-center items-center border-2 border-gray-200 aspect-video"
                >
                  <i className="fa-solid fa-utensils font-100 opacity-50 text-[#6c757d]"></i>
                </div>
              )}
            </div>
          </div>
        </SwiperSlide>
      )
    )}
    <div className="swiper-btn">
      <div className="swiper-pagination style-2 flex-1"></div>
    </div>
    <span className="swiper-notification" aria-live="assertive" aria-atomic="true"></span>
  </Swiper>
</div>
*/}

          {/* Banner / images (responsive, constrained on desktop) */}
          <div className="max-w-[1200px] mx-auto px-4 mt-3">
            <div className="border border-[#dee2e6] rounded-2xl overflow-hidden bg-[#f8f9fa]">
              {menuDetails.images?.length ? (
                <TripleSlider
                  slides={menuDetails.images.map((image) => ({
                    backgroundImage: image,
                    title: menuDetails.menu_name,
                  }))}
                />
              ) : (
                <div className="flex justify-center items-center w-full h-[220px] sm:h-[260px] lg:h-[320px]">
                  <i className="fa-solid fa-utensils text-[90px] sm:text-[100px] opacity-50 text-[#6c757d]"></i>
                </div>
              )}
            </div>
          </div>

          <div className="account-box style-1">
            <div className="max-w-[1200px] mx-auto px-4 pb-60">
              {!menuDetails?.menu_id && (
                <div className="bg-[#f8d7da] border border-[#f5c2c7] text-[#842029] px-4 py-3 rounded-lg my-3">
                  Menu details not available.
                </div>
              )}
              <div className="company-detail">
                <div className="detail-content">
                  <div className="flex-1">
                    <h3 className="text-[var(--secondary)] sub-title text-sm flex items-center justify-between">
                      <div className="flex items-center">
                        <FoodTypeIcon foodType={menuDetails.menu_food_type} />
                        <span className="ml-2">
                          {menuDetails.category_name?.toUpperCase()}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={`${isFavoriteLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} no-underline`}
                        onClick={handleFavoriteToggle}
                        disabled={isFavoriteLoading}
                        title={isFavoriteLoading ? "Updating favorite..." : ""}
                      >
                        <div
                          className={`like-button ${menuDetails?.is_favourite === 1 ? "active" : ""
                            }`}
                        >
                          <i
                            className={`fa-${menuDetails?.is_favourite === 1
                              ? "solid"
                              : "regular"
                              } fa-heart text-[20px] leading-none ${menuDetails?.is_favourite === 1
                                ? "text-[#dc3545]"
                                : "text-[#6c757d]"
                              }`}
                          />
                        </div>
                      </button>
                    </h3>
                    <h4 className="flex justify-between items-center">
                      {menuDetails.menu_name}
                    </h4>
                  </div>
                </div>
              </div>

              <div className="item-list-2 my-2">
                <div className="price">
                  <span className="text-style text-soft">Price</span>
                  <div className="flex justify-between items-center">
                    <h3 className="sub-title mb-0">
                      {basePrice == null || Number.isNaN(basePrice) ? (
                        "Unavailable"
                      ) : offerPercent > 0 && discountedPrice != null ? (
                        <>
                          ₹
                          {discountedPrice}
                          <del className="ml-2 text-[#6c757d]">
                            ₹{basePrice}
                          </del>
                        </>
                      ) : (
                        `₹${basePrice}`
                      )}
                    </h3>
                    {offerPercent > 0 && (
                      <span className="text-[#198754] text-sm font-bold ml-3">
                        {offerPercent}% Off
                      </span>
                    )}
                  </div>
                </div>
                {/* Inline Add to Cart button directly under price */}
                <div className="mt-3">
                  <button
                    onClick={isCrossOutlet ? undefined : handleAddToCart}
                    className={`w-full rounded-[50px] px-6 py-3 bg-[var(--primary)] text-white hover:bg-[#329e2b] transition-colors flex items-center justify-center text-sm sm:text-base font-semibold ${
                      isCrossOutlet ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={isCrossOutlet}
                    title={
                      isCrossOutlet
                        ? `Switch to ${crossOutletName} to order`
                        : ""
                    }
                  >
                    <i
                      className={`fa-solid ${
                        isCrossOutlet ? "fa-lock" : "fa-cart-shopping"
                      } mr-2`}
                    ></i>
                    Add to cart
                  </button>
                </div>
                {cartItem && !isCrossOutlet && (
                  <div className="dz-stepper border rounded-3xl max-w-[140px] sm:max-w-[160px]">
                    <div className="flex items-center justify-between">
                      <button
                        className="px-2 sm:px-3 py-2 bg-[var(--primary)] text-white rounded-3xl hover:bg-[#329e2b] transition-colors flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-base"
                        type="button"
                        onClick={() => {
                          if (cartItem.quantity === 1) {
                            removeFromCart(
                              Number(menuId),
                              cartItem.portionId
                            );
                          } else {
                            updateQuantity(
                              Number(menuId),
                              cartItem.portionId,
                              cartItem.quantity - 1
                            );
                          }
                        }}
                      >
                        -
                      </button>
                      <input
                        readOnly
                        className="stepper flex-1 text-center border-0 py-2 bg-transparent text-sm sm:text-base font-medium min-w-0"
                        type="text"
                        value={cartItem.quantity}
                        name="demo3"
                      />
                      <button
                        className="px-2 sm:px-3 py-2 bg-[var(--primary)] text-white rounded-3xl hover:bg-[#329e2b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-base"
                        type="button"
                        onClick={() => {
                          if (cartItem.quantity < 20) {
                            updateQuantity(
                              Number(menuId),
                              cartItem.portionId,
                              cartItem.quantity + 1
                            );
                          }
                        }}
                        disabled={cartItem.quantity >= 20}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {menuDetails.ingredients && (
                <div className="mb-3">
                  <h6 className="text-style text-soft mb-2 text-base font-semibold">Ingredients</h6>
                  <p>{menuDetails.ingredients}</p>
                </div>
              )}

              {/* Optional fields from get_menu_details */}
              {(menuDetails.spicy_index || menuDetails.calories_per_serving || menuDetails.calories_per_100g) && (
                <div className="mb-3">
                  <h6 className="text-style text-soft mb-2 text-base font-semibold">Info</h6>
                  <div className="text-sm text-[#6c757d]">
                    {menuDetails.spicy_index && (
                      <div>Spicy index: {menuDetails.spicy_index}</div>
                    )}
                    {menuDetails.calories_per_serving != null && (
                      <div>Calories/serving: {menuDetails.calories_per_serving}</div>
                    )}
                    {menuDetails.calories_per_100g != null && (
                      <div>Calories/100g: {menuDetails.calories_per_100g}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Show price breakdown when provided by API */}
              {(menuDetails.default_price != null ||
                menuDetails.dine_in_price != null ||
                menuDetails.parcel_price != null ||
                menuDetails.delivery_price != null ||
                menuDetails.drive_through_price != null) && (
                <div className="mb-3">
                  <h6 className="text-style text-soft mb-2 text-base font-semibold">Price breakdown</h6>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {menuDetails.default_price != null && (
                      <div className="flex justify-between bg-[#f8f9fa] border border-[#dee2e6] rounded-lg px-3 py-2">
                        <span>Default</span>
                        <span className="font-semibold">₹{Number(menuDetails.default_price)}</span>
                      </div>
                    )}
                    {menuDetails.dine_in_price != null && (
                      <div className="flex justify-between bg-[#f8f9fa] border border-[#dee2e6] rounded-lg px-3 py-2">
                        <span>Dine-in</span>
                        <span className="font-semibold">₹{Number(menuDetails.dine_in_price)}</span>
                      </div>
                    )}
                    {menuDetails.parcel_price != null && (
                      <div className="flex justify-between bg-[#f8f9fa] border border-[#dee2e6] rounded-lg px-3 py-2">
                        <span>Parcel</span>
                        <span className="font-semibold">₹{Number(menuDetails.parcel_price)}</span>
                      </div>
                    )}
                    {menuDetails.delivery_price != null && (
                      <div className="flex justify-between bg-[#f8f9fa] border border-[#dee2e6] rounded-lg px-3 py-2">
                        <span>Delivery</span>
                        <span className="font-semibold">₹{Number(menuDetails.delivery_price)}</span>
                      </div>
                    )}
                    {menuDetails.drive_through_price != null && (
                      <div className="flex justify-between bg-[#f8f9fa] border border-[#dee2e6] rounded-lg px-3 py-2">
                        <span>Drive-thru</span>
                        <span className="font-semibold">₹{Number(menuDetails.drive_through_price)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>

        <div className="footer fixed pb-[55px]">
          <div className="max-w-[1200px] mx-auto px-4">
            <button
              onClick={isCrossOutlet ? undefined : handleAddToCart}
              className={`w-full text-left rounded-[50px] px-6 py-3 bg-[var(--primary)] text-white hover:bg-[#329e2b] transition-colors ${isCrossOutlet
                ? "opacity-50 cursor-not-allowed"
                : ""
                }`}
              disabled={isCrossOutlet}
              title={
                isCrossOutlet
                  ? `Switch to ${crossOutletName} to order`
                  : ""
              }
            >
              <i
                className={`fa-solid ${isCrossOutlet ? "fa-lock" : "fa-cart-shopping"} mr-2`}
              ></i>
              Add to cart
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default ProductDetail;
