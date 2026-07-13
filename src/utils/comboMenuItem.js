import { buildCreateOrderMenuPayload } from "./orderMenuItem";

/** Synthetic category id: API returns `combos` outside `category[]`. */
export const COMBO_CATEGORY_ID = "__combos__";

const COMBO_MENU_ID_PATTERN = /^combo_(\d+)$/i;

export const readComboId = (item) => {
  const fromFields = item?.comboMasterId ?? item?.combo_master_id ?? item?.combo_id;
  if (fromFields != null && fromFields !== "") {
    const numeric = Number(fromFields);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }

  const menuId = String(item?.menuId ?? item?.menu_id ?? "");
  const match = menuId.match(COMBO_MENU_ID_PATTERN);
  if (match) {
    const numeric = Number(match[1]);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }

  return null;
};

export const isComboCartItem = (item) => {
  const comboId = readComboId(item);
  if (comboId == null) return false;

  if (item?.isCombo) return true;

  const menuId = item?.menuId ?? item?.menu_id;
  if (menuId == null || menuId === "") return true;

  return COMBO_MENU_ID_PATTERN.test(String(menuId));
};

/**
 * Build combo payload for create/add order APIs.
 * Combo items go in `order_combo_items` (with `combo_master_id`).
 * The `order_items` array is for regular menu items only (with `menu_id`).
 */
export const buildComboOrderPayload = (
  item,
  { includeComboId = false, comboIdOnly = false } = {}
) => {
  const comboId = readComboId(item);
  if (comboId == null) {
    throw new Error("Invalid combo item: missing combo_id");
  }

  const portionName = String(item?.portionName ?? item?.portion_name ?? "default")
    .trim()
    .toLowerCase();

  if (comboIdOnly) {
    return {
      combo_id: comboId,
      quantity: Number(item?.quantity ?? 0),
      comment: item?.comment || "",
      ...(portionName ? { portion_name: portionName } : {}),
    };
  }

  const payload = {
    combo_master_id: comboId,
    quantity: Number(item?.quantity ?? 0),
    comment: item?.comment || "",
  };

  if (includeComboId) {
    payload.combo_id = comboId;
  }

  if (portionName) {
    payload.portion_name = portionName;
  }

  return payload;
};

/** Combo lines for `order_items` when the cart has no regular menu items. */
export const buildComboOrderItemsPayload = (items = []) =>
  items
    .filter(isComboCartItem)
    .map((item) => buildComboOrderPayload(item, { comboIdOnly: true }));

export const buildOrderComboItemsPayload = (items = []) =>
  items
    .filter(isComboCartItem)
    .map((item) => buildComboOrderPayload(item, { includeComboId: false }));

export const buildCreateOrderPayloadFromCart = (cartItems = []) => {
  const comboCartItems = (cartItems || []).filter(isComboCartItem);
  const menuCartItems = (cartItems || []).filter((item) => !isComboCartItem(item));

  const menuOrderItems = menuCartItems.map((item) =>
    buildCreateOrderMenuPayload(item)
  );
  const order_combo_items = buildOrderComboItemsPayload(comboCartItems);
  const order_items = menuOrderItems;

  return { order_items, order_combo_items };
};

export const formatComboOrderItem = (
  item,
  { includeComboId = true, asString = false } = {}
) => {
  const built = buildComboOrderPayload(item, { includeComboId });
  if (!asString) return built;

  return {
    combo_master_id: String(built.combo_master_id),
    ...(built.combo_id != null ? { combo_id: String(built.combo_id) } : {}),
    quantity: Number(built.quantity),
    comment: built.comment || "",
    portion_name: built.portion_name || "",
  };
};

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
