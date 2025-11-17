import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import CategorySwiper from "../components/CategorySwiper/CategorySwiper";
import CodeSandboxBannerSwiper from "../components/BannerSwiper/CodeSandboxBannerSwiper";
import VerticalMenuCard from "../components/VerticalMenuCard";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import HorizontalMenuCard from "../components/HorizontalMenuCard";
import { useMenuItems } from "../hooks/useMenuItems";
import { useOutlet } from "../contexts/OutletContext";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { OrderTypeModal } from "../components/Modal/variants/OrderTypeModal";
import { useModal } from "../contexts/ModalContext";
import OutletInfoBanner from "../components/OutletInfoBanner";
import SearchBar from "../components/SearchBar";
import apiService from "../api/apiService";
import OfferBanner from "./OfferBanner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCachedBanners } from "../hooks/useCachedBanners";

// Helper function to get auth data
const getAuthData = () => {
  const authData = localStorage.getItem("auth");
  return authData ? JSON.parse(authData) : null;
};

// Helper to extract outlet params from the path
function extractOutletParamsFromPath(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 3) return null;
  const [o, s, t] = segments.slice(-3);
  const oMatch = o.match(/^o(\d+)$/);
  const sMatch = s.match(/^s(\d+)$/);
  const tMatch = t.match(/^t(\d+)$/);
  if (oMatch && sMatch && tMatch) {
    return {
      outletCode: oMatch[1],
      sectionId: sMatch[1],
      tableId: tMatch[1],
    };
  }
  return null;
}

// Update the bannerData array
const bannerData = [
  {
    id: 1,
    imageUrl: "https://ghanish.in/v2/media/menu_images/mm_images_70143.jpg",
    title: "Special Offer",
    discount: "20% OFF",
    textColor: "#FFFFFF", // Changed to white for better visibility on image
    description: "*on Selected Items"
  },
  {
    id: 2,
    imageUrl: "https://ghanish.in/v2/media/menu_images/mm_images_70143.jpg",
    title: "Lunch Special",
    discount: "30% OFF",
    textColor: "#FFFFFF",
    description: "*12PM to 3PM"
  },
  {
    id: 3,
    imageUrl: "https://ghanish.in/v2/media/menu_images/mm_images_70143.jpg",
    title: "Happy Hours",
    discount: "25% OFF",
    textColor: "#FFFFFF",
    description: "*on Beverages"
  },
  {
    id: 4,
    imageUrl: "https://ghanish.in/v2/media/menu_images/mm_images_70143.jpg",
    title: "Weekend Special",
    discount: "40% OFF",
    textColor: "#FFFFFF",
    description: "*Saturday & Sunday"
  },
  {
    id: 5,
    imageUrl: "https://ghanish.in/v2/media/menu_images/mm_images_70143.jpg",
    title: "First Order",
    discount: "50% OFF",
    textColor: "#FFFFFF",
    description: "*New Customers Only"
  }
];

const styles = {
  swiperContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden'
  },
  slide: {
    position: 'relative',
    width: '100%',
    height: '300px' // Adjust height as needed
  },
  slideImage: {
    width: '100%',
    height: '300px',
    objectFit: 'cover'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  content: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    color: '#FFFFFF',
    width: '100%',
    padding: '0 20px'
  },
  title: {
    fontSize: '1.25rem',
    marginBottom: '0.5rem',
    fontWeight: '500'
  },
  discount: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem'
  },
  description: {
    fontSize: '0.875rem',
    opacity: '0.9'
  },
  navigation: {
    button: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 10,
      width: '40px',
      height: '40px',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    },
    icon: {
      color: '#666'
    }
  },
  pagination: {
    position: 'absolute',
    bottom: '10px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    zIndex: 10
  }
};

function Home() {
  // Keep core hooks and context values
  const { menuItems, menuCategories, isLoading } = useMenuItems();
  const { cartItems } = useCart();
  const { orderSettings, isOutletOnlyUrl, outletId } = useOutlet();
  const { getUserId } = useAuth();
  const { openModal } = useModal();
  const navigate = useNavigate();
  const location = useLocation();

  // Essential state that can't be derived
  const [favoriteMenuIds, setFavoriteMenuIds] = useState(new Set());
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [visibleMenuCount, setVisibleMenuCount] = useState(10);
  const [activeMenuFilter, setActiveMenuFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState(""); // New: track search query
  const [isSearching, setIsSearching] = useState(false);

  // Add QueryClient
  const queryClient = useQueryClient();
  const userId = getUserId();

  // Fetch banner data with cache
  const { banners = [], isLoading: bannersLoading, error: bannersError, dataSource } = useCachedBanners({
    outletId,
    userId,
    enabled: !!outletId
  });

  // Hide entire banner section if API returns 404 Not Found
  const hideBanners = !!(
    bannersError && (
      (bannersError?.response && bannersError.response.status === 404) ||
      bannersError?.status === 404 ||
      (typeof bannersError?.message === 'string' && bannersError.message.includes('404'))
    )
  );

  // Add favorite mutations with optimistic updates
  const toggleFavorite = useMutation({
    mutationFn: async ({ menuId, isFavorite }) => {
      try {
        // Add flag to prevent duplicate calls
        if (toggleFavorite.mutationFn.isRunning) {
          return null;
        }
        toggleFavorite.mutationFn.isRunning = true;

        if (isFavorite) {
          return apiService.favorites.add({ outletId, userId, menuId });
        } else {
          return apiService.favorites.remove({ outletId, userId, menuId });
        }
      } finally {
        toggleFavorite.mutationFn.isRunning = false;
      }
    },
    onMutate: async ({ menuId, isFavorite }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(["specialMenus", outletId, userId]);
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData([
        "specialMenus",
        outletId,
        userId,
      ]);
      
      // Optimistically update the UI
      queryClient.setQueryData(["specialMenus", outletId, userId], (old) => {
        if (!old) return old;
        return old.map((menu) =>
          menu.menu_id === menuId 
            ? { ...menu, is_favourite: isFavorite ? 1 : 0 }
            : menu
        );
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ["specialMenus", outletId, userId],
        context.previousData
      );
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries(["specialMenus", outletId, userId]);
    },
  });

  // IMPROVEMENT: Use useMemo for categoriesData instead of useState + useEffect
  // This prevents unnecessary recalculations and removes a source of render loops
  const categoriesData = useMemo(() => {
    if (!menuItems || !menuCategories) {
      return { categories: [], menusByCategory: {} };
    }

    const menusByCategory = {};
    let totalMenuCount = 0;

    menuItems.forEach((menu) => {
      if (!menusByCategory[menu.menuCatId]) {
        menusByCategory[menu.menuCatId] = [];
      }
      menusByCategory[menu.menuCatId].push(menu);
      totalMenuCount++;
    });

    const allCategory = {
      menuCatId: "all",
      categoryName: "All",
      menuCount: totalMenuCount,
    };

    return {
      categories: [allCategory, ...menuCategories],
      menusByCategory,
    };
  }, [menuItems, menuCategories]); // Only recompute when menu data changes

  // IMPROVEMENT: Use useMemo for filtered menus instead of useState + useEffect
  // This eliminates the need for filteredMenuItems state and its update effects
  const filteredMenus = useMemo(() => {
    if (!menuItems) return [];

    // First apply category filter
    let filtered =
      selectedCategoryId === "all" || !selectedCategoryId
      ? menuItems
        : categoriesData.menusByCategory[selectedCategoryId] || [];

    // Then apply search if active
    if (isSearching && searchQuery) {
      filtered = filtered.filter((item) =>
        item.menuName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Finally apply special/offer filter
    if (activeMenuFilter === "special") {
      filtered = filtered.filter(
        (item) => item.isSpecial === true || item.isSpecial === 1
      );
    } else if (activeMenuFilter === "offer") {
      filtered = filtered.filter((item) => Number(item.offer) > 0);
    }

    return filtered;
  }, [
    menuItems,
    selectedCategoryId,
    searchQuery,
    isSearching,
    activeMenuFilter,
    categoriesData.menusByCategory,
  ]);

  // IMPROVEMENT: Use useMemo for visible menus to prevent recalculation on every render
  const visibleMenus = useMemo(() => {
    return filteredMenus.slice(0, visibleMenuCount);
  }, [filteredMenus, visibleMenuCount]);

  // One-time effect to set default category
  useEffect(() => {
    if (categoriesData.categories.length > 0 && selectedCategoryId === null) {
      setSelectedCategoryId("all");
    }
  }, [categoriesData.categories.length]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleMenuCount(10);
  }, [selectedCategoryId, activeMenuFilter, searchQuery]);

  // Helper for lazy loading
  const getVisibleMenus = () => {
    return filteredMenus.slice(0, visibleMenuCount);
  };

  const handleLoadMoreMenus = () => {
    setVisibleMenuCount((prev) => prev + 10);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategoryId(category.menuCatId);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return "Good Morning";
    } else if (hour >= 12 && hour < 17) {
      return "Good Afternoon";
    } else if (hour >= 17 && hour < 21) {
      return "Good Evening";
    } else {
      return "Good Night";
    }
  };

  // Update greeting when component mounts and every minute
  useEffect(() => {
    const updateGreeting = () => {
      // setGreeting(getGreeting());
    };

    // Set initial greeting
    updateGreeting();

    // Update greeting every minute
    const interval = setInterval(updateGreeting, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Add these handler functions in Home.jsx
  const handleAddToCart = (menuId) => {
    console.log("Adding to cart:", menuId);
    // Will implement cart functionality later
  };

  // Update the handleFavoriteClick function
  const handleFavoriteClick = async (menuId, isFavorite) => {
    if (!userId) {
      // Handle unauthenticated users - maybe show login modal
      return;
    }
    
    try {
      await toggleFavorite.mutateAsync({ menuId, isFavorite: !isFavorite });
    } catch (error) {
      console.error("Failed to update favorite status:", error);
    }
  };

  const handleQuantityChange = (menuId, newQuantity) => {
    console.log("Quantity changed:", menuId, newQuantity);
    // Will implement quantity change functionality later
  };

  // Helper function to check if item is in cart and get its quantity
  const getCartItemQuantity = (menuId) => {
    const cartItem = cartItems.find((item) => item.menuId === menuId);
    return cartItem ? cartItem.quantity : 0;
  };

  // // Special menus query remains unchanged
  // const {
  //   data: specialMenuItems = [],
  //   isLoading: isSpecialMenusLoading,
  //   error: specialMenusError,
  // } = useQuery({
  //   queryKey: ["specialMenus", outletId, userId],
  //   queryFn: async () => {
  //     if (!outletId) return [];
  //     const data = await apiService.menus.getSpecialMenus({ outletId, userId });
  //     return data?.special_menu_list || [];
  //   },
  //   enabled: !!outletId,
  // });

  // Only show modal on outlet-only URL if no order type is set
  useEffect(() => {
    if (isOutletOnlyUrl && !orderSettings.order_type) {
      openModal("orderType");
    }
  }, [isOutletOnlyUrl, orderSettings.order_type]);

  // Handler functions remain the same but are simplified
  const handleSearch = (searchResults) => {
    setSearchQuery(searchResults.query || ""); // Store the query
    setIsSearching(!!searchResults.length);
  };


  return (
    <>
      <div className="page-wraper">
        <Header />
        <div className="page-content">
          <div className=" pt-0">
            <div className="container p-b40 p-t0">

              {/* Modern Banner Swiper with Cache Status */}
              {!hideBanners && (
                bannersLoading ? (
                  // Loading skeleton for banners
                  <div className="modern-banner-swiper">
                    <div style={{ height: '200px', display: 'flex', gap: '20px', padding: '0 20px' }}>
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={`skeleton-${index}`} height={200} style={{ borderRadius: '20px', flex: '1' }} />
                      ))}
                    </div>
                  </div>
                ) : bannersError ? (
                  // Error state
                  <div className="text-center p-4">
                    <p className="text-muted">Failed to load banners</p>
                  </div>
                ) : banners.length === 0 ? (
                  // No banners state
                  <div className="text-center p-4">
                    <p className="text-muted">No banners available</p>
                  </div>
                ) : (
                  <div>
                    
                    <CodeSandboxBannerSwiper
                      banners={banners.map(banner => ({
                        id: banner.banner_id,
                        title: banner.name || banner.title,
                        subtitle: banner.subtitle || banner.name,
                        description: banner.description || banner.subtitle,
                        bgImage: banner.banner_image || banner.image
                      }))}
                      onBannerClick={(banner) => {
                        console.log('Banner clicked:', banner);
                        // Add your banner click logic here
                      }}
                      autoplayDelay={3000}
                      pauseOnHover={true}
                      disableOnInteraction={false}
                    />
                  </div>
                )
              )}

              <div
                className="title-bar d-flex justify-content-between align-items-center"
                onClick={() => navigate("/categories")}
                style={{ cursor: "pointer" }}
              >
                <span className="title mb-0 font-18">
                  {isSearching ? "Search Results" : "Categories"}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#888",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  See all{" "}
                  <i
                    className="fas fa-chevron-right"
                    style={{ fontSize: "12px" }}
                  ></i>
                </span>
              </div>

              {/* Update CategorySwiper with new data */}
              <CategorySwiper
                categories={categoriesData.categories}
                isLoading={isLoading}
                onCategoryClick={handleCategoryClick}
              />
              <div class="title-bar mt-0">
                <span class="title mb-0 font-18">Menus</span>
              </div>
              <div className="row g-3 mb-3">
                {isLoading ? (
                  // Skeleton for VerticalMenuCards
                  [...Array(6)].map((_, index) => (
                    <div className="col-6" key={`skeleton-${index}`}>
                      <div
                        style={{
                          borderRadius: "16px",
                          overflow: "hidden",
                          backgroundColor: "#fff",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        }}
                      >
                        {/* Image Skeleton */}
                        <div
                          style={{
                            position: "relative",
                            paddingTop: "75%",
                          }}
                        >
                          <Skeleton
                            height="100%"
                            width="100%"
                            baseColor="#C8C8C8"
                            highlightColor="#E0E0E0"
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              borderRadius: "16px 16px 0 0",
                            }}
                          />
                          {/* Discount Badge Skeleton */}
                          <div
                            style={{
                              position: "absolute",
                              top: "10px",
                              left: "10px",
                              zIndex: 1,
                            }}
                          >
                            <Skeleton
                              height={24}
                              width={45}
                              baseColor="#C8C8C8"
                              highlightColor="#E0E0E0"
                              style={{ borderRadius: "12px" }}
                            />
                          </div>
                          {/* Favorite Button Skeleton */}
                          <div
                            style={{
                              position: "absolute",
                              top: "10px",
                              right: "10px",
                              zIndex: 1,
                            }}
                          >
                            <Skeleton
                              circle
                              height={32}
                              width={32}
                              baseColor="#C8C8C8"
                              highlightColor="#E0E0E0"
                            />
                          </div>
                        </div>

                        {/* Content Section */}
                        <div style={{ padding: "12px" }}>
                          {/* Title Skeleton */}
                          <Skeleton
                            height={20}
                            width="80%"
                            baseColor="#C8C8C8"
                            highlightColor="#E0E0E0"
                            style={{ marginBottom: "8px" }}
                          />

                          {/* Price and Rating Row */}
                          <div className="d-flex justify-content-between align-items-center">
                            <Skeleton
                              height={18}
                              width={60}
                              baseColor="#C8C8C8"
                              highlightColor="#E0E0E0"
                            />
                            <Skeleton
                              height={18}
                              width={40}
                              baseColor="#C8C8C8"
                              highlightColor="#E0E0E0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : isSearching ? (
                  filteredMenus.length > 0 ? (
                    visibleMenus.map((menuItem) => (
                      <div className="col-6" key={menuItem.menuId}>
                        <VerticalMenuCard
                          image={
                            menuItem.image ? (
                              menuItem.image
                            ) : (
                              <i className="fa-solid fa-utensils font-55"></i>
                            )
                          }
                          title={menuItem.menuName}
                          currentPrice={menuItem.portions?.[0]?.price ?? 0}
                          reviewCount={
                            menuItem.rating ? parseInt(menuItem.rating) : null
                          }
                          isFavorite={menuItem.is_favourite === 1}
                          discount={
                            menuItem.offer > 0 ? `${menuItem.offer}%` : null
                          }
                          menuItem={menuItem}
                          onFavoriteUpdate={handleFavoriteClick}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-12 text-center py-4">
                      <p className="text-muted">No results found</p>
                    </div>
                  )
                ) : (
                  visibleMenus.map((menuItem) => (
                    <div className="col-6" key={menuItem.menuId}>
                      <VerticalMenuCard
                        image={
                          menuItem.image ? (
                            menuItem.image
                          ) : (
                            <i className="fa-solid fa-utensils font-55 opacity-50 text-muted"></i>
                          )
                        }
                        title={menuItem.menuName}
                        currentPrice={menuItem.portions?.[0]?.price ?? 0}
                        reviewCount={
                          menuItem.rating ? parseInt(menuItem.rating) : null
                        }
                        isFavorite={
                          favoriteMenuIds.has(menuItem.menuId) ||
                          menuItem.is_favourite === 1
                        }
                        discount={
                          menuItem.offer > 0 ? `${menuItem.offer}%` : null
                        }
                        menuItem={menuItem}
                        onFavoriteUpdate={handleFavoriteClick}
                      />
                    </div>
                  ))
                )}
              </div>
              {/* Lazy Load Button */}
              {filteredMenus.length > visibleMenuCount && (
                <div className="text-center mb-4">
                  <button
                    className="btn btn-outline-primary px-4 py-2"
                    onClick={handleLoadMoreMenus}
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Page Content End*/}
        {/* Menubar */}
        <Footer />

        <div
          className="offcanvas offcanvas-bottom pwa-offcanvas"
          style={{ display: "none" }}
        >
          <div className="container">
            <div className="offcanvas-body small">
              <img className="logo" src="assets/images/icon.png" alt="" />
              <h6 className="title font-w600">W3Grocery on Your Home Screen</h6>
              <p>
                Install W3Grocery Pre-Build Grocery Mobile App Template to your
                home screen for easy access, just like any other app
              </p>
              <button type="button" className="btn btn-sm btn-primary pwa-btn">
                Add to Home Screen
              </button>
              <button
                type="button"
                className="btn btn-sm pwa-close btn-secondary ms-2 text-white"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
        <div className="offcanvas-backdrop pwa-backdrop fade" />
        {/* PWA Offcanvas End */}
        {/* Show OrderTypeModal if outletOnly */}
        {isOutletOnlyUrl && <OrderTypeModal />}
      </div>
    </>
  );
}

export default Home;
