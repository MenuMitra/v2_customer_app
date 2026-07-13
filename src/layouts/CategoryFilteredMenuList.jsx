import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from "../components/Header";
import Footer from "../components/Footer";
import VerticalMenuCard from '../components/VerticalMenuCard';
import { useOutlet } from '../contexts/OutletContext';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../api/apiService';
import { comboToMenuItem, COMBO_CATEGORY_ID } from "../utils/comboMenuItem";
import { isComboFavorite } from "../utils/comboFavorites";
import {
  addFavoriteToCache,
  buildComboFavoriteEntry,
  removeFavoriteFromCache,
} from "../utils/favorites";

const DEFAULT_IMAGE = '';

function CategoryFilteredMenuList() {
    const { categoryId } = useParams();
    const location = useLocation();
    const categoryName = location.state?.categoryName;
    const menuCount = location.state?.menuCount;
    const { outletId } = useOutlet();
    const isSyntheticComboRoute = String(categoryId) === COMBO_CATEGORY_ID;
    const { getUserId } = useAuth();
    const queryClient = useQueryClient();
    const userId = getUserId();

    // Fetch menu data using TanStack Query
    const { data, isLoading, error } = useQuery({
        queryKey: ['menusByCategory', outletId, categoryId],
        queryFn: () => apiService.menus.getByCategory({
            outletId,
            categoryId
        }),
        enabled: !!outletId && !!categoryId && !isSyntheticComboRoute
    });

    const { data: combosData, isLoading: combosLoading, error: combosError } = useQuery({
        queryKey: ['combosByOutlet', outletId],
        queryFn: () => apiService.common.getAllMenuListByCategory({ outletId }),
        enabled: !!outletId && !!categoryId,
        staleTime: 0
    });

    const combos = (combosData && combosData.combos) ? combosData.combos : [];
    // Determine whether current category is "Combo" using the API's category list.
    // This avoids relying on `location.state.categoryName` (which can be missing) or on `data.category`
    // (which can be null if the backend returns combos separately).
    const comboCategoryFromApi = combosData?.category?.find(
        (c) =>
            (c?.category_name || "").toLowerCase().includes("combo")
    );
    const isComboCategory =
        isSyntheticComboRoute ||
        (comboCategoryFromApi &&
            String(comboCategoryFromApi.menu_cat_id) === String(categoryId));

    const [, setComboFavoriteRefresh] = React.useState(0);

    const handleFavoriteUpdate = (menuId, newIsFavorite, targetOutletId, isCombo = false) => {
        if (!isCombo) return;

        setComboFavoriteRefresh((prev) => prev + 1);

        if (!userId) return;

        const resolvedOutletId = targetOutletId ?? outletId;
        const combo = (data?.combos || []).find(
            (item) => Number(item.combo_master_id) === Number(menuId)
        );

        if (newIsFavorite) {
            addFavoriteToCache(queryClient, {
                outletId: resolvedOutletId,
                userId,
                entry: buildComboFavoriteEntry({
                    combo,
                    outletId: resolvedOutletId,
                }),
            });
        } else {
            removeFavoriteFromCache(queryClient, {
                outletId: resolvedOutletId,
                userId,
                comboMasterId: menuId,
                isCombo: true,
            });
        }
    };

    const resolvedCategoryName =
        categoryName || data?.category?.category_name || "";

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
                            {error.message || 'Failed to load menu items'}
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const { category, menus } = data || { category: null, menus: [] };

    return (
        <>
            <Header />
            <div className="page-content">
                <div className="container p-b80">
                    {(category || isSyntheticComboRoute) && (
                        <div className="category-header mb-4">
                            <h4 className="title mb-1 text-xl font-semibold">
                                {resolvedCategoryName ||
                                    category?.category_name ||
                                    (isSyntheticComboRoute ? "Combos" : "")}
                            </h4>
                            {(menuCount ||
                                (isSyntheticComboRoute && combos?.length)) && (
                                <small className="text-[#6c757d] text-sm">
                                    {menuCount || combos?.length} Items Available
                                </small>
                            )}
                        </div>
                    )}

                    <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-1 custom-scrollbar">
                        <div className="grid grid-cols-1 gap-3">
                            {isComboCategory && (
                                <>
                                    {combosLoading ? null : combosError ? null : combos?.length ? (
                                        <>
                                            {combos.map((combo) => {
                                                const shaped = comboToMenuItem(
                                                    combo,
                                                    outletId
                                                );
                                                return (
                                                    <div key={combo.combo_master_id}>
                                                        <VerticalMenuCard
                                                            image={
                                                                <i className="fa-solid fa-utensils text-[55px] opacity-50 text-[#6c757d]" />
                                                            }
                                                            title={shaped.menuName}
                                                            currentPrice={
                                                                shaped.price ||
                                                                shaped.portions?.[0]
                                                                    ?.price ||
                                                                0
                                                            }
                                                            isFavorite={isComboFavorite({
                                                                userId,
                                                                outletId: shaped.outletId ?? shaped.outlet_id ?? outletId,
                                                                comboMasterId: shaped.comboMasterId
                                                            })}
                                                            discount={null}
                                                            menuItem={shaped}
                                                            onFavoriteUpdate={handleFavoriteUpdate}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </>
                                    ) : combosLoading ? null : (
                                        <div className="bg-[#cff4fc] border border-[#b6effb] text-[#055160] px-4 py-3 rounded-lg">
                                            No combos found.
                                        </div>
                                    )}
                                </>
                            )}

                            {menus.map((menu) => (
                                <div key={menu.menu_id}>
                                    <VerticalMenuCard
                                        image={menu.images?.[0]?.image || DEFAULT_IMAGE}
                                        title={menu.menu_name}
                                        currentPrice={menu.price || menu.portions?.[0]?.price || 0}
                                        reviewCount={menu.rating || 0}
                                        isFavorite={menu.is_favourite === 1}
                                        discount={menu.offer > 0 ? `${menu.offer}%` : null}
                                        menuItem={{
                                            menuId: menu.menu_id,
                                            menuCatId: menu.menu_cat_id,
                                            menuName: menu.menu_name,
                                            menuFoodType: menu.menu_food_type,
                                            categoryName: menu.category_name,
                                            spicyIndex: menu.spicy_index,
                                            portions: menu.portions,
                                            rating: menu.rating,
                                            offer: menu.offer,
                                            isSpecial: menu.is_special,
                                            isFavourite: menu.is_favourite === 1,
                                            isActive: menu.is_active,
                                            image: menu.images?.[0]?.image || DEFAULT_IMAGE
                                        }}
                                        onFavoriteUpdate={handleFavoriteUpdate}
                                    />
                                </div>
                            ))}

                            {menus.length === 0 &&
                                !(isComboCategory && (combosLoading || combos?.length > 0)) && (
                                <div>
                                    <div className="bg-[#cff4fc] border border-[#b6effb] text-[#055160] px-4 py-3 rounded-lg">
                                        No menu items found in this category.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default CategoryFilteredMenuList;