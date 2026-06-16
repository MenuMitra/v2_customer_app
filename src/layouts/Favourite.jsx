import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "../components/Header";
import Footer from "../components/Footer";
import HorizontalMenuCard from "../components/HorizontalMenuCard";
import AuthPrompt from "../components/Auth/AuthPrompt";
import { useAuth } from "../contexts/AuthContext";
import { useOutlet } from "../contexts/OutletContext";
import apiService from "../api/apiService";
import { getComboFavoriteIds } from "../utils/comboFavorites";

function FavouriteContent() {
  const { getUserId } = useAuth();
  const { outletId } = useOutlet();
  const queryClient = useQueryClient();
  const userId = getUserId();

  const { data: favoriteMenus = [], isLoading } = useQuery({
    queryKey: ["favorites", outletId, userId],
    queryFn: async () => {
      if (!userId) return [];

      const response = await apiService.favorites.getList({
        outletId,
        userId,
      });

      const allMenus = [];
      if (response) {
        Object.entries(response).forEach(([outletName, menus]) => {
          if (Array.isArray(menus)) {
            menus.forEach((menu) => {
              allMenus.push({
                ...menu,
                outlet_name: outletName,
              });
            });
          }
        });
      }

      const comboIds = getComboFavoriteIds({ userId, outletId });
      if (comboIds.length > 0) {
        try {
          const comboResponse = await apiService.common.getAllMenuListByCategory({
            outletId,
          });
          const combos = comboResponse?.combos || [];
          combos
            .filter((combo) =>
              comboIds.includes(Number(combo?.combo_master_id))
            )
            .forEach((combo) => {
              allMenus.push({
                menu_id: `combo_${combo.combo_master_id}`,
                combo_master_id: combo.combo_master_id,
                menu_name: combo.name,
                menu_food_type: combo.combo_food_type,
                category_name: "Combos",
                outlet_id: combo.outlet_id ?? outletId,
                outlet_name: "Combos",
                price: Number(combo.price) || 0,
                portions: [
                  {
                    portion_id: 0,
                    portion_name: "Default",
                    price: Number(combo.price) || 0,
                    unit_value: 1,
                    unit_type: "",
                  },
                ],
                image: [],
                is_combo: true,
              });
            });
        } catch (error) {
          console.error("Failed to load combo favorites:", error);
        }
      }

      return allMenus;
    },
    enabled: !!userId && !!outletId,
  });

  const removeFavorite = useMutation({
    mutationFn: async ({
      menuId,
      outletId: targetOutletId,
      isCombo,
      comboMasterId,
    }) => {
      try {
        if (removeFavorite.mutationFn.isRunning) {
          return null;
        }
        removeFavorite.mutationFn.isRunning = true;

        if (isCombo) {
          const comboIds = getComboFavoriteIds({
            userId,
            outletId: targetOutletId ?? outletId,
          });
          const nextIds = comboIds.filter(
            (id) => Number(id) !== Number(comboMasterId)
          );
          localStorage.setItem(
            `combo_favorites:${String(userId)}:${String(targetOutletId ?? outletId)}`,
            JSON.stringify(nextIds)
          );
          return true;
        }

        return await apiService.favorites.remove({
          outletId: targetOutletId ?? outletId,
          userId,
          menuId,
        });
      } finally {
        removeFavorite.mutationFn.isRunning = false;
      }
    },
    onMutate: async ({ menuId, isCombo, comboMasterId }) => {
      await queryClient.cancelQueries({
        queryKey: ["favorites", outletId, userId],
      });

      queryClient.setQueryData(
        ["favorites", outletId, userId],
        (old) =>
          old?.filter((menu) => {
            if (isCombo) {
              return Number(menu.combo_master_id) !== Number(comboMasterId);
            }
            return menu.menu_id !== menuId;
          }) || []
      );

      return {
        previousFavorites: queryClient.getQueryData([
          "favorites",
          outletId,
          userId,
        ]),
      };
    },
  });

  const handleFavoriteUpdate = async (
    menuId,
    isFavorite,
    menuOutletId,
    isCombo = false
  ) => {
    if (!isFavorite && !removeFavorite.isLoading) {
      const currentFavorites = queryClient.getQueryData([
        "favorites",
        outletId,
        userId,
      ]);
      const menuExists = currentFavorites?.some((menu) => {
        if (isCombo) {
          return Number(menu.combo_master_id) === Number(menuId);
        }
        return menu.menu_id === menuId;
      });

      if (menuExists) {
        await removeFavorite.mutateAsync({
          menuId,
          outletId: menuOutletId,
          isCombo,
          comboMasterId: menuId,
        });
      }
    }
  };

  const sortedFavorites = useMemo(() => {
    return [...favoriteMenus].sort((a, b) => {
      if (Number(a.outlet_id) === Number(outletId)) return -1;
      if (Number(b.outlet_id) === Number(outletId)) return 1;
      return (a.menu_name || "").localeCompare(b.menu_name || "");
    });
  }, [favoriteMenus, outletId]);

  return (
    <main className="favourite-content" aria-label="Favourite items">
      <div className="favourite-list max-w-3xl mx-auto w-full px-4 pt-2">
        {isLoading ? (
          <div className="text-center p-5">Loading...</div>
        ) : sortedFavorites.length > 0 ? (
          sortedFavorites.map((menu) => (
            <div className="mb-2" key={menu.menu_id}>
              <HorizontalMenuCard
                layout="stack"
                image={
                  menu.image &&
                  Array.isArray(menu.image) &&
                  menu.image.length > 0
                    ? menu.image[0].image
                    : null
                }
                title={menu.menu_name}
                currentPrice={menu.price || menu.portions?.[0]?.price || 0}
                reviewCount={menu.rating ? parseFloat(menu.rating) : null}
                isFavorite={true}
                discount={menu.offer > 0 ? `${menu.offer}%` : null}
                menuItem={{
                  menuId: menu.menu_id,
                  comboMasterId: menu.combo_master_id,
                  isCombo: !!menu.is_combo,
                  menuCatId: menu.menu_cat_id,
                  menuName: menu.menu_name,
                  menuFoodType: menu.menu_food_type,
                  categoryName: menu.category_name,
                  spicyIndex: menu.spicy_index,
                  portions: menu.portions,
                  price: menu.price || menu.portions?.[0]?.price || 0,
                  rating: menu.rating,
                  offer: menu.offer,
                  isSpecial: menu.is_special,
                  isFavourite: true,
                  isActive: true,
                  image:
                    menu.image &&
                    Array.isArray(menu.image) &&
                    menu.image.length > 0
                      ? menu.image[0].image
                      : null,
                  outletName: menu.outlet_name,
                  outletId: menu.outlet_id,
                }}
                onFavoriteUpdate={handleFavoriteUpdate}
              />
            </div>
          ))
        ) : (
          <div className="text-center p-5">
            <p className="text-gray-500">No favorite items found</p>
          </div>
        )}
      </div>
    </main>
  );
}

function Favourite() {
  const { getUserId } = useAuth();
  const userId = getUserId();

  return (
    <div className="favourite-page">
      <Header />
      {!userId ? <AuthPrompt variant="favourites" /> : <FavouriteContent />}
      <Footer />
    </div>
  );
}

export default Favourite;
