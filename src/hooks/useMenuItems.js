import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addFavoriteToCache,
  buildFavoriteEntryFromMenuItem,
  favoritesQueryKey,
  invalidateFavoriteMenus,
  removeFavoriteFromCache,
} from '../utils/favorites';
import { useOutlet } from '../contexts/OutletContext';
import apiService from '../api/apiService';

export const useMenuItems = () => {
  const { outletId } = useOutlet();
  const queryClient = useQueryClient();

  // Main query for menu items
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['menuItems', outletId],
    queryFn: async () => {
      if (!outletId) return null;
      const data = await apiService.common.getAllMenuListByCategory({ outletId });

      if (!data) return null;

      return {
        categories: data.category?.map(category => ({
          menuCatId: category.menu_cat_id,
          categoryName: category.category_name,
          menuCount: category.menu_count
        })) || [],
        menus: data.menus?.map(menu => ({
          menuId: menu.menu_id,
          menuName: menu.menu_name,
          menuFoodType: menu.menu_food_type,
          outletId: menu.outlet_id,
          menuCatId: menu.menu_cat_id,
          categoryName: menu.category_name,
          spicyIndex: menu.spicy_index,
          portions: menu.portions?.map(portion => ({
            portion_id: portion.portion_id || Math.random().toString(36).substr(2, 9),
            portion_name: portion.portion_name,
            price: portion.price,
            unit_value: portion.unit_value,
            unit_type: portion.unit_type
          })) || [],
          price: menu.price ?? menu.portions?.[0]?.price ?? 0,
          rating: menu.rating,
          offer: menu.offer,
          isSpecial: menu.is_special,
          is_favourite: menu.is_favourite,
          isFavourite: menu.is_favourite === 1,
          isActive: menu.is_active,
          image: menu.images?.[0]?.image
        })) || []
        ,
        // Backend sends combos separately from menus/categories.
        // We carry them so UI can render combos when combo category is selected.
        combos: data.combos || []
      };
    },
    enabled: !!outletId
  });

  // Add mutation for favorite toggle
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ menuId, isFavorite, userId, outletId: outletIdOverride }) => {
      const targetOutletId = outletIdOverride ?? outletId;
      if (isFavorite) {
        return await apiService.favorites.remove({ outletId: targetOutletId, userId, menuId });
      } else {
        return await apiService.favorites.add({ outletId: targetOutletId, userId, menuId });
      }
    },
    onMutate: async ({ menuId, isFavorite, userId, outletId: outletIdOverride }) => {
      const targetOutletId = outletIdOverride ?? outletId;
      await queryClient.cancelQueries({ queryKey: ['menuItems', targetOutletId] });
      await queryClient.cancelQueries({
        queryKey: favoritesQueryKey(targetOutletId, userId),
      });

      const previousData = queryClient.getQueryData(['menuItems', targetOutletId]);
      const previousFavorites = queryClient.getQueryData(
        favoritesQueryKey(targetOutletId, userId)
      );

      queryClient.setQueryData(['menuItems', targetOutletId], (old) => {
        if (!old) return old;
        return {
          ...old,
          menus: old.menus.map(menu =>
            String(menu.menuId) === String(menuId)
              ? {
                ...menu,
                is_favourite: !isFavorite ? 1 : 0,
                isFavourite: !isFavorite
              }
              : menu
          )
        };
      });

      const menu = previousData?.menus?.find(
        (item) => String(item.menuId) === String(menuId)
      );

      if (isFavorite) {
        removeFavoriteFromCache(queryClient, {
          outletId: targetOutletId,
          userId,
          menuId,
        });
      } else {
        addFavoriteToCache(queryClient, {
          outletId: targetOutletId,
          userId,
          entry: buildFavoriteEntryFromMenuItem(menu),
        });
      }

      return { previousData, previousFavorites, targetOutletId, userId };
    },
    onError: (err, variables, context) => {
      if (context?.targetOutletId) {
        queryClient.setQueryData(['menuItems', context.targetOutletId], context.previousData);
      }
      if (context?.userId) {
        queryClient.setQueryData(
          favoritesQueryKey(context.targetOutletId, context.userId),
          context.previousFavorites
        );
      }
    },
    onSettled: (data, error, variables) => {
      const targetOutletId = variables?.outletId ?? outletId;
      if (error) {
        queryClient.invalidateQueries({ queryKey: ['menuItems', targetOutletId] });
      }

      if (variables?.userId) {
        invalidateFavoriteMenus(queryClient, {
          outletId: targetOutletId,
          userId: variables.userId,
        });
      }
    }
  });

  return {
    menuCategories: data?.categories || [],
    menuItems: data?.menus || [],
    combos: data?.combos || [],
    isLoading,
    error,
    refetch,
    toggleFavorite: toggleFavoriteMutation.mutate,
    isFavoriteLoading: toggleFavoriteMutation.isLoading
  };
};
