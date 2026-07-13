import apiService from "../api/apiService";
import { getComboFavoriteIds } from "./comboFavorites";

export const favoritesQueryKey = (outletId, userId) => [
  "favorites",
  "menus",
  outletId,
  userId,
];

export const readFavoriteMenuId = (menu) => menu?.menu_id ?? menu?.menuId ?? null;

export const buildFavoriteEntryFromMenuItem = (menu) => {
  if (!menu) return null;

  const menuId = readFavoriteMenuId(menu);
  if (menuId == null || menuId === "") return null;

  const image = menu.image;
  const normalizedImage = Array.isArray(image)
    ? image
    : image
      ? [{ image }]
      : [];

  return {
    menu_id: menuId,
    menu_name: menu.menuName ?? menu.menu_name,
    menu_food_type: menu.menuFoodType ?? menu.menu_food_type,
    menu_cat_id: menu.menuCatId ?? menu.menu_cat_id,
    category_name: menu.categoryName ?? menu.category_name,
    outlet_id: menu.outletId ?? menu.outlet_id,
    outlet_name: menu.outletName ?? menu.outlet_name,
    price: menu.price,
    portions: menu.portions,
    image: normalizedImage,
    rating: menu.rating,
    offer: menu.offer,
    is_combo: menu.isCombo ?? menu.is_combo ?? false,
    combo_master_id: menu.comboMasterId ?? menu.combo_master_id,
  };
};

export const buildComboFavoriteEntry = ({
  combo,
  outletId,
  outletName = "Combos",
}) => {
  if (!combo) return null;

  const comboMasterId = combo.combo_master_id ?? combo.comboMasterId;
  if (comboMasterId == null) return null;

  return {
    menu_id: `combo_${comboMasterId}`,
    combo_master_id: comboMasterId,
    menu_name: combo.name ?? combo.menuName,
    menu_food_type: combo.combo_food_type ?? combo.menuFoodType,
    category_name: "Combos",
    outlet_id: combo.outlet_id ?? combo.outletId ?? outletId,
    outlet_name: outletName,
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
  };
};

export const addFavoriteToCache = (queryClient, { outletId, userId, entry }) => {
  if (!queryClient || !outletId || !userId || !entry) return;

  queryClient.setQueryData(favoritesQueryKey(outletId, userId), (old) => {
    const list = Array.isArray(old) ? old : [];
    const nextId = String(readFavoriteMenuId(entry));

    if (list.some((menu) => String(readFavoriteMenuId(menu)) === nextId)) {
      return list;
    }

    return [...list, entry];
  });
};

export const removeFavoriteFromCache = (
  queryClient,
  { outletId, userId, menuId, comboMasterId, isCombo = false }
) => {
  if (!queryClient || !outletId || !userId) return;

  queryClient.setQueryData(favoritesQueryKey(outletId, userId), (old) => {
    const list = Array.isArray(old) ? old : [];

    return list.filter((menu) => {
      if (isCombo) {
        return Number(menu.combo_master_id) !== Number(comboMasterId);
      }

      return String(readFavoriteMenuId(menu)) !== String(menuId);
    });
  });
};

export const invalidateFavoriteMenus = (queryClient, { outletId, userId }) => {
  if (!queryClient || !outletId || !userId) return;

  queryClient.invalidateQueries({
    queryKey: favoritesQueryKey(outletId, userId),
    refetchType: "all",
  });
};

export const flattenFavoritesResponse = (response) => {
  const allMenus = [];

  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return allMenus;
  }

  Object.entries(response).forEach(([outletName, menus]) => {
    if (!Array.isArray(menus)) return;

    menus.forEach((menu) => {
      allMenus.push({
        ...menu,
        outlet_name: menu.outlet_name || outletName,
      });
    });
  });

  return allMenus;
};

const appendComboFavorites = async ({ allMenus, userId, outletId }) => {
  const comboIds = getComboFavoriteIds({ userId, outletId });
  if (!comboIds.length) return allMenus;

  try {
    const comboResponse = await apiService.common.getAllMenuListByCategory({
      outletId,
    });
    const combos = comboResponse?.combos || [];

    combos
      .filter((combo) => comboIds.includes(Number(combo?.combo_master_id)))
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

  return allMenus;
};

export const loadFavoriteMenus = async ({ outletId, userId }) => {
  if (!userId) return [];

  const response = await apiService.favorites.getList({ outletId, userId });
  const allMenus = flattenFavoritesResponse(response);
  return appendComboFavorites({ allMenus, userId, outletId });
};

export const collectFavoriteMenuIds = (favoriteMenus) => {
  const ids = new Set();

  if (!Array.isArray(favoriteMenus)) {
    return ids;
  }

  favoriteMenus.forEach((menu) => {
    const id = menu?.menu_id ?? menu?.menuId;
    if (id != null && id !== "") {
      ids.add(String(id));
    }
  });

  return ids;
};
