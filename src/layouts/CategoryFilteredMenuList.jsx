import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from "../components/Header";
import Footer from "../components/Footer";
import VerticalMenuCard from '../components/VerticalMenuCard';
import { useOutlet } from '../contexts/OutletContext';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../api/apiService';

const DEFAULT_IMAGE = '';

function CategoryFilteredMenuList() {
  const { categoryId } = useParams();
  const location = useLocation();
  const categoryName = location.state?.categoryName;
  const menuCount = location.state?.menuCount;
  const { outletId } = useOutlet();
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
    enabled: !!outletId && !!categoryId
  });

  // Mutations for favorite functionality
  const addToFavorites = useMutation({
    mutationFn: (menuId) => apiService.favorites.add({ 
      outletId, 
      userId, 
      menuId 
    }),
    onSuccess: () => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries(['menusByCategory', outletId, categoryId]);
    }
  });

  const removeFromFavorites = useMutation({
    mutationFn: (menuId) => apiService.favorites.remove({ 
      outletId, 
      userId, 
      menuId 
    }),
    onSuccess: () => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries(['menusByCategory', outletId, categoryId]);
    }
  });

  const handleFavoriteClick = async (isFavorite, menuId) => {
    if (!userId) return; // Handle unauthenticated users

    try {
      if (isFavorite) {
        await addToFavorites.mutateAsync(menuId);
      } else {
        await removeFromFavorites.mutateAsync(menuId);
      }
    } catch (err) {
      console.error('Failed to update favorite status:', err);
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
          {category && (
            <div className="category-header mb-4">
              <h4 className="title mb-1 text-xl font-semibold">
                {categoryName || category.category_name}
              </h4>
              {menuCount && (
                <small className="text-[#6c757d] text-sm">
                  {menuCount} Items Available
                </small>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-3">
            {menus.map((menu) => (
              <div key={menu.menu_id}>
                <VerticalMenuCard
                  image={menu.images?.[0]?.image || DEFAULT_IMAGE}
                  title={menu.menu_name}
                  currentPrice={menu.portions?.[0]?.price || 0}
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
                  onFavoriteClick={handleFavoriteClick}
                />
              </div>
            ))}
            
            {menus.length === 0 && (
              <div>
                <div className="bg-[#cff4fc] border border-[#b6effb] text-[#055160] px-4 py-3 rounded-lg">
                  No menu items found in this category.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default CategoryFilteredMenuList;