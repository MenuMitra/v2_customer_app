import { useParams, useLocation, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const { openModal } = useModal();
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const { outletId } = useOutlet();
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
    queryKey: ["menuDetails", effectiveOutletId, menuId, menuCatId, userId],
    queryFn: () =>
      apiService.menus.getDetails({
        outletId: effectiveOutletId,
        menuId: Number(menuId),
        menuCatId: Number(menuCatId),
        userId,
      }),
    enabled: !!effectiveOutletId && !!menuId && !!menuCatId,
  });

  // Check if item exists in cart with proper menuId comparison
  const cartItem = cartItems.find(
    (item) =>
      item.menuId === Number(menuId) &&
      item.portionId === menuDetails?.portions?.[0]?.portion_id
  );

  const handleAddToCart = () => {
    // Check if user is authenticated
    if (!user) {
      setShowAuthOffcanvas(true);
      return;
    }

    // Format menu details to include required fields for checkout
    const formattedMenuDetails = {
      ...menuDetails,
      menuId: Number(menuId),
      menu_cat_id: Number(menuCatId),
      menuName: menuDetails.menu_name,
      image: menuDetails.images?.[0] || null,
      portions: menuDetails.portions.map((portion) => ({
        ...portion,
        portion_id: portion.portion_id,
        portion_name: portion.portion_name,
        price: portion.price,
        unit_value: portion.unit_value,
      })),
    };

    openModal("addToCart", formattedMenuDetails);
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

  if (!menuDetails) return null;

  return (
    <>
      <Header />
      <div className="page-content">
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
        <div className="content-body bottom-content">
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

          {/* Add the new TripleSlider implementation */}
          {menuDetails.images?.length ? (
            <TripleSlider
              slides={menuDetails.images.map((image) => ({
                backgroundImage: image,
                title: menuDetails.menu_name,
              }))}
            />
          ) : (
            <div className="dz-banner-heading">
              <div className="overlay-black-light bg-[#f8f9fa]">
                <div className="flex justify-center items-center border-2 border-[#dee2e6] aspect-square">
                  <i className="fa-solid fa-utensils text-[100px] opacity-50 text-[#6c757d]"></i>
                </div>
              </div>
            </div>
          )}

          <div className="account-box style-1">
            <div className="max-w-[1200px] mx-auto px-4 pb-60">
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
                          className={`like-button ${
                            menuDetails?.is_favourite === 1 ? "active" : ""
                          }`}
                        >
                          <i
                            className={`fa-${
                              menuDetails?.is_favourite === 1
                                ? "solid"
                                : "regular"
                            } fa-heart text-[20px] leading-none ${
                              menuDetails?.is_favourite === 1
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
                      {menuDetails.offer > 0 ? (
                        <>
                          ₹
                          {Math.round(
                            menuDetails.portions[0]?.price *
                              (1 - menuDetails.offer / 100)
                          )}
                          <del className="ml-2 text-[#6c757d]">
                            ₹{menuDetails.portions[0]?.price}
                          </del>
                        </>
                      ) : (
                        `₹${menuDetails.portions[0]?.price}`
                      )}
                    </h3>
                    {menuDetails.offer > 0 && (
                      <span className="text-[#198754] text-sm font-bold ml-3">
                        {menuDetails.offer}% Off
                      </span>
                    )}
                  </div>
                </div>
                {cartItem && !isCrossOutlet && (
                  <div className="dz-stepper border rounded-stepper">
                    <div className="flex items-center">
                      <button
                        className="px-4 py-2 bg-[var(--primary)] text-white rounded-l-lg hover:bg-[var(--primary-dark)] transition-colors"
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
                        className="stepper w-16 text-center border-y border-[var(--border-color)] py-2"
                        type="text"
                        value={cartItem.quantity}
                        name="demo3"
                      />
                      <button
                        className="px-4 py-2 bg-[var(--primary)] text-white rounded-r-lg hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

              {menuDetails.description && (
                <div className="mb-3">
                  <h6 className="text-style text-soft mb-2 text-base font-semibold">Description</h6>
                  <p>{menuDetails.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="footer fixed pb-[55px]">
          <div className="max-w-[1200px] mx-auto px-4">
            <button
              onClick={isCrossOutlet ? undefined : handleAddToCart}
              className={`w-full text-left rounded-[50px] px-6 py-3 bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-colors ${
                isCrossOutlet || !menuDetails.portions?.length
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={isCrossOutlet || !menuDetails.portions?.length}
              title={
                isCrossOutlet
                  ? `Switch to ${crossOutletName} to order`
                  : !menuDetails.portions?.length
                  ? "Item unavailable"
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
