import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import CategorySwiper from "../components/CategorySwiper/CategorySwiper";
import VerticalMenuCard from "../components/VerticalMenuCard";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useMenuItems } from "../hooks/useMenuItems";
import { useOutlet } from "../contexts/OutletContext";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { OrderTypeModal } from "../components/Modal/variants/OrderTypeModal";
import { useModal } from "../contexts/ModalContext";
import apiService from "../api/apiService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ENV } from "../config";



function Home() {
  // Keep core hooks and context values
  const { menuItems, menuCategories, combos, isLoading } = useMenuItems();
  const { cartItems } = useCart();
  const { orderSettings, isOutletOnlyUrl, outletId } = useOutlet();
  const { getUserId } = useAuth();
  const { openModal } = useModal();
  const navigate = useNavigate();

  // Essential state that can't be derived
  const [favoriteMenuIds] = useState(new Set());
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [visibleMenuCount, setVisibleMenuCount] = useState(10);
  const [activeMenuFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState(""); // New: track search query
  const [isSearching, setIsSearching] = useState(false);

  // Add QueryClient
  const queryClient = useQueryClient();
  const userId = getUserId();

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
    onError: (_err, _variables, context) => {
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

  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return (
      categoriesData.categories.find(
        (c) => String(c.menuCatId) === String(selectedCategoryId)
      ) || null
    );
  }, [selectedCategoryId, categoriesData.categories]);

  const comboCategoryFromCategories = categoriesData.categories.find(
    (c) => String(c?.categoryName || "").toLowerCase().includes("combo")
  );
  const isComboCategory =
    !!comboCategoryFromCategories &&
    String(comboCategoryFromCategories.menuCatId) === String(selectedCategoryId);

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

  const handleLoadMoreMenus = () => {
    setVisibleMenuCount((prev) => prev + 10);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategoryId(category.menuCatId);
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

  // Only show modal on outlet-only URL if no order type is set
  useEffect(() => {
    if (isOutletOnlyUrl && !orderSettings.order_type) {
      openModal("orderType");
    }
  }, [isOutletOnlyUrl, orderSettings.order_type, openModal]);


  return (
    <>
      <div className="page-wraper">
        <Header />
        <div className="page-content">
          <div className="pt-0">
            <div className="max-w-[1200px] mx-auto px-4 pb-24 pt-0">

              <div
                className="title-bar flex justify-between items-center cursor-pointer"
                onClick={() => navigate("/categories")}
              >
                <span className="title mb-0 text-lg font-semibold">
                  {isSearching ? "Search Results" : "Categories"}
                </span>
                <span className="text-[12px] text-[#888] inline-flex items-center gap-[2px]">
                  See all{" "}
                  <i className="fas fa-chevron-right text-[12px]"></i>
                </span>
              </div>

              {/* Update CategorySwiper with new data */}
              <CategorySwiper
                categories={categoriesData.categories}
                isLoading={isLoading}
                onCategoryClick={handleCategoryClick}
              />
              <div className="title-bar mt-0">
                <span className="title mb-0 text-lg font-semibold">Menus</span>
              </div>
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto pr-1 custom-scrollbar pb-[220px] overscroll-contain">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {isLoading ? (
                    // Skeleton for VerticalMenuCards
                    [...Array(6)].map((_, index) => (
                      <div key={`skeleton-${index}`}>
                        <div className="rounded-2xl overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                          {/* Image Skeleton */}
                          <div className="relative pt-[75%]">
                            <div className="absolute top-0 left-0 w-full h-full">
                              <Skeleton
                                height="100%"
                                width="100%"
                                baseColor="#C8C8C8"
                                highlightColor="#E0E0E0"
                                className="rounded-t-2xl"
                              />
                            </div>
                            {/* Discount Badge Skeleton */}
                            <div className="absolute top-2.5 left-2.5 z-10">
                              <Skeleton
                                height={24}
                                width={45}
                                baseColor="#C8C8C8"
                                highlightColor="#E0E0E0"
                                className="rounded-[12px]"
                              />
                            </div>
                            {/* Favorite Button Skeleton */}
                            <div className="absolute top-2.5 right-2.5 z-10">
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
                          <div className="p-3">
                            {/* Title Skeleton */}
                            <Skeleton
                              height={20}
                              width="80%"
                              baseColor="#C8C8C8"
                              highlightColor="#E0E0E0"
                              className="mb-2"
                            />

                            {/* Price and Rating Row */}
                            <div className="flex justify-between items-center">
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
                  ) : isComboCategory ? (
                    <>
                      {combos?.length
                        ? combos.map((combo) => (
                            <div
                              key={combo.combo_master_id}
                              className="rounded-2xl border border-gray-200 bg-white shadow-sm p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="font-semibold text-sm sm:text-base text-[#212529] truncate">
                                    {combo.name}
                                  </div>
                                  <div className="text-gray-500 text-xs mt-1">
                                    {(combo.combo_food_type || "")
                                      .toString()
                                      .toUpperCase()}
                                  </div>
                                </div>
                                <div className="font-semibold text-[#3AB4F2] whitespace-nowrap">
                                  {combo.price != null
                                    ? `₹${Number(combo.price).toFixed(2)}`
                                    : "₹0.00"}
                                </div>
                              </div>
                            </div>
                          ))
                        : null}

                      {/* Also show regular menus for this category (backend may send both) */}
                      {visibleMenus.length > 0
                        ? visibleMenus.map((menuItem) => (
                            <div key={menuItem.menuId}>
                              <VerticalMenuCard
                                image={
                                  menuItem.image ? (
                                    menuItem.image
                                  ) : (
                                    <i className="fa-solid fa-utensils text-[55px] opacity-50 text-[#6c757d]" />
                                  )
                                }
                                title={menuItem.menuName}
                                currentPrice={
                                  menuItem.price ||
                                  menuItem.portions?.[0]?.price ||
                                  0
                                }
                                reviewCount={
                                  menuItem.rating
                                    ? parseInt(menuItem.rating)
                                    : null
                                }
                                isFavorite={
                                  favoriteMenuIds.has(menuItem.menuId) ||
                                  menuItem.is_favourite === 1
                                }
                                discount={
                                  menuItem.offer > 0
                                    ? `${menuItem.offer}%`
                                    : null
                                }
                                menuItem={menuItem}
                                onFavoriteUpdate={handleFavoriteClick}
                              />
                            </div>
                          ))
                        : combos?.length
                        ? null
                        : (
                            <div className="col-span-2 text-center py-4">
                              <p className="text-[#6c757d]">No items found.</p>
                            </div>
                          )}
                    </>
                  ) : isSearching ? (
                    filteredMenus.length > 0 ? (
                      visibleMenus.map((menuItem) => (
                        <div key={menuItem.menuId}>
                          <VerticalMenuCard
                            image={
                              menuItem.image ? (
                                menuItem.image
                              ) : (
                                <i className="fa-solid fa-utensils text-[55px]"></i>
                              )
                            }
                            title={menuItem.menuName}
                            currentPrice={menuItem.price || menuItem.portions?.[0]?.price || 0}
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
                      <div className="col-span-2 text-center py-4">
                        <p className="text-[#6c757d]">No results found</p>
                      </div>
                    )
                  ) : (
                    visibleMenus.map((menuItem) => (
                      <div key={menuItem.menuId}>
                        <VerticalMenuCard
                          image={
                            menuItem.image ? (
                              menuItem.image
                            ) : (
                              <i className="fa-solid fa-utensils text-[55px] opacity-50 text-[#6c757d]"></i>
                            )
                          }
                          title={menuItem.menuName}
                          currentPrice={menuItem.price || menuItem.portions?.[0]?.price || 0}
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
                  <div className="text-center mb-10">
                    <button
                      className="px-6 py-2.5 bg-[#177a26] border-[#007bff] text-[#ffffff] rounded-3xl hover:bg-[#159428] hover:text-white transition-all duration-300 font-medium"
                      onClick={handleLoadMoreMenus}
                    >
                      Load More
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Page Content End*/}
        {/* Menubar */}
        <Footer />

        <div
          className="pwa-offcanvas fixed bottom-0 left-0 w-full z-50 bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.1)] transition-transform duration-300 transform translate-y-full data-[open=true]:translate-y-0 hidden"
          id="pwa-install-prompt"
        >
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="p-4 text-sm text-center">
              <img className="w-12 h-12 mx-auto mb-3" src="assets/images/icon.png" alt="" />
              <h6 className="font-semibold text-lg mb-2">W3Grocery on Your Home Screen</h6>
              <p className="mb-4 text-[#6c757d]">
                Install W3Grocery Pre-Build Grocery Mobile App Template to your
                home screen for easy access, just like any other app
              </p>
              <button type="button" className="pwa-btn px-4 py-2 bg-[#007bff] text-white rounded-[50px] text-sm font-medium hover:bg-[#0056b3] transition-colors">
                Add to Home Screen
              </button>
              <button
                type="button"
                className="pwa-close px-4 py-2 bg-[#e9ecef] text-[#212529] rounded-[50px] text-sm font-medium hover:bg-[#dde0e3] transition-colors ml-3"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
        <div className="offcanvas-backdrop pwa-backdrop opacity-0 invisible transition-opacity duration-150" />
        {/* PWA Offcanvas End */}
        {/* Show OrderTypeModal if outletOnly */}
        {isOutletOnlyUrl && <OrderTypeModal />}
      </div>
    </>
  );
}

export default Home;
