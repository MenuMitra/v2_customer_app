import React from "react";
import { useParams, useLocation, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { useCart } from "../contexts/CartContext";
import { useModal } from "../contexts/ModalContext";
import { useOutlet } from "../contexts/OutletContext";
import { useAuth } from "../contexts/AuthContext";
import LazyImage from "../components/Shared/LazyImage";
import apiService from "../api/apiService";
import { useMenuItems } from "../hooks/useMenuItems";
import TripleSlider from "../components/TripleSlider/TripleSlider";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

// FoodTypeIcon component
const FoodTypeIcon = ({ foodType }) => {
  const getIcon = () => {
    switch (foodType?.toLowerCase()) {
      case "veg":
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
          <div className="container">
            <div className="text-center p-5">Loading...</div>
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
          <div className="container">
            <div className="alert alert-danger">
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
            <div className="d-flex align-items-center small mb-2 bg-danger text-white rounded-3 p-2">
              <i className="fa-solid fa-circle-info me-2"></i>
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
                  className="bnr-img d-flex justify-content-center align-items-center border border-2 border-light-subtle"
                  style={{ aspectRatio: "16/9" }}
                >
                  <i className="fa-solid fa-utensils font-100 opacity-50 text-muted"></i>
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
              <div className="overlay-black-light bg-body-secondary">
                <div
                  className="d-flex justify-content-center align-items-center border border-2 border-light-subtle"
                  style={{ aspectRatio: "1/1" }}
                >
                  <i className="fa-solid fa-utensils font-100 opacity-50 text-muted"></i>
                </div>
              </div>
            </div>
          )}

          <div className="account-box style-1">
            <div className="container p-b60">
              <div className="company-detail">
                <div className="detail-content">
                  <div className="flex-1">
                    <h3 className="text-secondary sub-title small d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <FoodTypeIcon foodType={menuDetails.menu_food_type} />
                        <span className="ms-2">
                          {menuDetails.category_name?.toUpperCase()}
                        </span>
                      </div>
                      <a
                        href="javascript:void(0);"
                        className={`${isFavoriteLoading ? "disabled" : ""}`}
                        onClick={handleFavoriteToggle}
                        style={{
                          pointerEvents: isFavoriteLoading ? "none" : "auto",
                          cursor: isFavoriteLoading ? "not-allowed" : "pointer",
                          textDecoration: "none",
                          opacity: isFavoriteLoading ? 0.5 : 1,
                        }}
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
                            } fa-heart`}
                            style={{
                              fontSize: "20px",
                              color:
                                menuDetails?.is_favourite === 1
                                  ? "#dc3545"
                                  : "#6c757d",
                              lineHeight: 1,
                            }}
                          />
                        </div>
                      </a>
                    </h3>
                    <h4 className="d-flex justify-content-between align-items-center">
                      {menuDetails.menu_name}
                    </h4>
                  </div>
                </div>
                {/* <ul className="item-inner">
                  <li>
                    <div className="reviews-info">
                      <h6 className="reviews">
                        {menuDetails.rating || "0"} (
                        {menuDetails.reviews_count || "0"} reviews)
                      </h6>
                    </div>
                  </li>
                </ul> */}
              </div>

              <div className="item-list-2 my-2">
                <div className="price">
                  <span className="text-style text-soft">Price</span>
                  <div className="d-flex justify-content-between align-items-center">
                    <h3 className="sub-title mb-0">
                      {menuDetails.offer > 0 ? (
                        <>
                          ₹
                          {Math.round(
                            menuDetails.portions[0]?.price *
                              (1 - menuDetails.offer / 100)
                          )}
                          <del className="ms-2 text-muted">
                            ₹{menuDetails.portions[0]?.price}
                          </del>
                        </>
                      ) : (
                        `₹${menuDetails.portions[0]?.price}`
                      )}
                    </h3>
                    {menuDetails.offer > 0 && (
                      <span className="text-success small fw-bold ms-3">
                        {menuDetails.offer}% Off
                      </span>
                    )}
                  </div>
                </div>
                {cartItem && !isCrossOutlet && (
                  <div className="dz-stepper border-1 rounded-stepper">
                    <div className="input-group bootstrap-touchspin bootstrap-touchspin-injected">
                      <span className="input-group-btn input-group-prepend">
                        <button
                          className="btn btn-primary bootstrap-touchspin-down"
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
                      </span>
                      <input
                        readOnly
                        className="stepper form-control"
                        type="text"
                        value={cartItem.quantity}
                        name="demo3"
                      />
                      <span className="input-group-btn input-group-append">
                        <button
                          className="btn btn-primary bootstrap-touchspin-up"
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
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {menuDetails.ingredients && (
                <div className="mb-3">
                  <h6 className="text-style text-soft mb-2">Ingredients</h6>
                  <p>{menuDetails.ingredients}</p>
                </div>
              )}

              {menuDetails.description && (
                <div className="mb-3">
                  <h6 className="text-style text-soft mb-2">Description</h6>
                  <p>{menuDetails.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="footer fixed p-b55">
          <div className="container">
            <button
              onClick={isCrossOutlet ? undefined : handleAddToCart}
              className="btn btn-primary text-start w-100"
              disabled={isCrossOutlet || !menuDetails.portions?.length}
              style={{
                opacity: isCrossOutlet ? 0.5 : 1,
                cursor: isCrossOutlet ? "not-allowed" : "pointer",
              }}
              title={
                isCrossOutlet
                  ? `Switch to ${crossOutletName} to order`
                  : !menuDetails.portions?.length
                  ? "Item unavailable"
                  : ""
              }
            >
              <i
                className={`fa-solid ${isCrossOutlet ? "fa-lock" : "fa-cart-shopping"} me-2`}
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
