/** Synthetic category id: API returns `combos` outside `category[]`. */
export const COMBO_CATEGORY_ID = "__combos__";

/**
 * Shape a combo from `get_all_menu_list_by_category` into the menuItem object
 * expected by VerticalMenuCard + AddToCartModal (cart-only flow).
 */
export function comboToMenuItem(combo, outletId) {
  const price = Number(combo?.price) || 0;
  const id = combo?.combo_master_id;
  const foodTypeRaw = (combo?.combo_food_type || "veg").toString();
  const categoryLabel =
    foodTypeRaw.charAt(0).toUpperCase() + foodTypeRaw.slice(1).toLowerCase();
  return {
    isCombo: true,
    comboMasterId: id,
    menuId: `combo_${id}`,
    menuName: combo?.name || "Combo",
    menuFoodType: foodTypeRaw,
    categoryName: categoryLabel,
    outletId: combo?.outlet_id ?? outletId,
    outlet_id: combo?.outlet_id ?? outletId,
    price,
    offer: 0,
    spicyIndex: null,
    portions: [
      {
        portion_id: 0,
        portion_name: "Default",
        price,
        unit_value: 1,
        unit_type: "",
      },
    ],
  };
}
