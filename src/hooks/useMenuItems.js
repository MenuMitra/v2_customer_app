import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    onMutate: async ({ menuId, isFavorite, outletId: outletIdOverride }) => {
      const targetOutletId = outletIdOverride ?? outletId;
      // Cancel any outgoing refetches for the target outlet
      await queryClient.cancelQueries({ queryKey: ['menuItems', targetOutletId] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['menuItems', targetOutletId]);

      // Optimistically update the menu item (if the list for that outlet is in cache)
      queryClient.setQueryData(['menuItems', targetOutletId], (old) => {
        if (!old) return old;
        return {
          ...old,
          menus: old.menus.map(menu =>
            menu.menuId === menuId
              ? {
                ...menu,
                is_favourite: !isFavorite ? 1 : 0,
                isFavourite: !isFavorite
              }
              : menu
          )
        };
      });

      return { previousData, targetOutletId };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.targetOutletId) {
        queryClient.setQueryData(['menuItems', context.targetOutletId], context.previousData);
      }
    },
    onSettled: (data, error, variables) => {
      // Refetch after error or success
      const targetOutletId = variables?.outletId ?? outletId;
      queryClient.invalidateQueries(['menuItems', targetOutletId]);
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
