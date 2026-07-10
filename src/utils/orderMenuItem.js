import { getDisplayPortionLabel } from "./portionLabel";

const PLACED_ORDER_SNAPSHOT_KEY = "placedOrderSnapshots";

const DEFAULT_PORTION_NAMES = new Set(["default", "regular", ""]);

const readPortionName = (item) =>
  item?.portionName ??
  item?.portion_name ??
  item?.portions_name ??
  item?.menu_portion_name ??
  item?.portion_label ??
  item?.portion ??
  "";

const readPortionId = (item) =>
  item?.portionId ??
  item?.portion_id ??
  item?.menu_portions_id ??
  item?.menu_portion_id ??
  null;

export const getOrderMenuPortionLabel = (item) => {
  return getDisplayPortionLabel(readPortionName(item));
};

export const getOrderMenuLineKey = (item, index = 0) => {
  const menuId = item?.menu_id ?? item?.menuId ?? "menu";
  const portionId = readPortionId(item) ?? "";
  const portionName = String(readPortionName(item)).toLowerCase().trim();
  const price = item?.price ?? "";
  const quantity = item?.quantity ?? "";
  const comment = item?.comment ?? "";

  return `${menuId}-${portionId}-${portionName}-${price}-${quantity}-${comment}-${index}`;
};

const resolvePortionId = (item) => {
  const portionId = readPortionId(item);
  if (portionId === null || portionId === undefined || portionId === "") {
    return null;
  }

  const numeric = Number(portionId);
  if (!Number.isFinite(numeric) || numeric === 0) {
    return null;
  }

  return numeric;
};

const resolvePortionNameForPayload = (item, { forCheckout = false } = {}) => {
  const normalized = String(readPortionName(item)).trim().toLowerCase();
  if (!normalized) return "";
  if (forCheckout && DEFAULT_PORTION_NAMES.has(normalized)) return "";
  return normalized;
};

export const buildOrderMenuPayload = (item, options = {}) => {
  const { forCheckout = false } = options;

  const payload = {
    menu_id: Number(item?.menuId ?? item?.menu_id),
    quantity: Number(item?.quantity ?? 0),
    comment: item?.comment || "",
  };

  const portionId = resolvePortionId(item);
  if (portionId !== null) {
    payload.portion_id = portionId;
    payload.menu_portions_id = portionId;
  }

  const portionName = resolvePortionNameForPayload(item, { forCheckout });
  if (portionName) {
    payload.portion_name = portionName;
  }

  return payload;
};

export const buildCreateOrderMenuPayload = (item) => {
  const payload = buildOrderMenuPayload(item, { forCheckout: false });
  payload.portion_name = resolvePortionNameForPayload(item) || "";
  return payload;
};

export const savePlacedOrderSnapshot = (orderId, cartItems = []) => {
  if (!orderId || !Array.isArray(cartItems)) return;

  try {
    const raw = localStorage.getItem(PLACED_ORDER_SNAPSHOT_KEY);
    const snapshots = raw ? JSON.parse(raw) : {};
    snapshots[String(orderId)] = cartItems
      .filter((item) => !item.isCombo)
      .map((item) => ({
        menuId: item.menuId,
        menuName: item.menuName,
        portionId: item.portionId,
        portionName: item.portionName,
        quantity: item.quantity,
        price: item.price,
        comment: item.comment || "",
      }));

    localStorage.setItem(PLACED_ORDER_SNAPSHOT_KEY, JSON.stringify(snapshots));
  } catch {
    // ignore storage errors
  }
};

export const getPlacedOrderSnapshot = (orderId) => {
  if (!orderId) return null;

  try {
    const raw = localStorage.getItem(PLACED_ORDER_SNAPSHOT_KEY);
    const snapshots = raw ? JSON.parse(raw) : {};
    return snapshots[String(orderId)] || null;
  } catch {
    return null;
  }
};

const normalizeMenuDetailItem = (item) => {
  const quantity = Number(item?.quantity ?? 0);
  const price = Number(item?.price ?? item?.menu_price ?? 0);
  const netPrice = Number(
    item?.net_price ?? item?.menu_sub_total ?? quantity * price
  );
  const portionName = String(readPortionName(item)).trim();
  const portionId = readPortionId(item);

  return {
    ...item,
    menu_id: item?.menu_id ?? item?.menuId,
    menu_name: item?.menu_name ?? item?.menuName ?? "",
    portion_id: portionId,
    portion_name: portionName,
    menu_food_type:
      item?.menu_food_type ?? item?.food_type ?? item?.menuFoodType ?? "veg",
    quantity,
    price,
    net_price: netPrice,
  };
};

const scoreMenuList = (list) => {
  if (!Array.isArray(list) || list.length === 0) return 0;

  let score = list.length * 10;
  const lineKeys = new Set();

  list.forEach((item) => {
    const portion = String(readPortionName(item)).trim().toLowerCase();
    if (portion && !DEFAULT_PORTION_NAMES.has(portion)) {
      score += 5;
    }
    if (readPortionId(item) != null && readPortionId(item) !== "") {
      score += 2;
    }
    lineKeys.add(getOrderMenuLineKey(item));
  });

  return score + lineKeys.size;
};

const collectMenuDetails = (detail) => {
  const candidates = [
    detail?.menu_details,
    detail?.menuDetails,
    detail?.order_menu_items,
    detail?.order_items,
    detail?.menus,
  ].filter((list) => Array.isArray(list) && list.length > 0);

  if (!candidates.length) return [];

  return candidates.reduce((best, current) =>
    scoreMenuList(current) > scoreMenuList(best) ? current : best
  );
};

const collectComboDetails = (detail) => {
  const candidates = [detail?.combo_details, detail?.comboDetails, detail?.combos];

  for (const list of candidates) {
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
  }

  return [];
};

const hasDistinctPortionLines = (lines = []) => {
  const keys = new Set(
    lines.map((line) => {
      const menuId = line?.menu_id ?? line?.menuId;
      const portionName = String(readPortionName(line)).toLowerCase().trim();
      const portionId = readPortionId(line);
      const price = Number(line?.price ?? 0);
      return `${menuId}-${portionId}-${portionName}-${price}`;
    })
  );
  return keys.size;
};

const shouldUsePlacedOrderSnapshot = (apiMenus = [], snapshot = []) => {
  if (!Array.isArray(snapshot) || snapshot.length === 0) return false;
  if (!Array.isArray(apiMenus) || apiMenus.length === 0) return true;
  if (apiMenus.length < snapshot.length) return true;

  const snapshotDistinct = hasDistinctPortionLines(
    snapshot.map((line) => ({
      menu_id: line.menuId,
      portion_id: line.portionId,
      portion_name: line.portionName,
      price: line.price,
    }))
  );

  const apiDistinct = hasDistinctPortionLines(apiMenus);
  if (snapshotDistinct > apiDistinct) return true;

  const apiMissingNamedPortions = apiMenus.some((item) => {
    const portion = String(readPortionName(item)).trim().toLowerCase();
    return !portion || DEFAULT_PORTION_NAMES.has(portion);
  });

  const snapshotHasNamedPortions = snapshot.some((line) => {
    const portion = String(line?.portionName || "").trim().toLowerCase();
    return portion && !DEFAULT_PORTION_NAMES.has(portion);
  });

  return apiMissingNamedPortions && snapshotHasNamedPortions;
};

const buildMenuDetailsFromSnapshot = (snapshot = [], apiMenus = []) => {
  const usedApiIndexes = new Set();

  return snapshot.map((line) => {
    const linePrice = Number(line?.price ?? 0);
    const apiIndex = apiMenus.findIndex((item, index) => {
      if (usedApiIndexes.has(index)) return false;
      const sameMenu = String(item?.menu_id ?? item?.menuId) === String(line.menuId);
      const samePrice =
        !linePrice ||
        Number(item?.price ?? item?.menu_price ?? 0) === linePrice;
      return sameMenu && samePrice;
    });

    const apiMatch = apiIndex >= 0 ? apiMenus[apiIndex] : null;
    if (apiIndex >= 0) usedApiIndexes.add(apiIndex);

    const quantity = Number(line?.quantity ?? apiMatch?.quantity ?? 0);
    const price = Number(line?.price ?? apiMatch?.price ?? apiMatch?.menu_price ?? 0);

    return normalizeMenuDetailItem({
      ...(apiMatch || {}),
      menu_id: line.menuId,
      menu_name: line.menuName || apiMatch?.menu_name || apiMatch?.menuName || "",
      portion_id: line.portionId ?? apiMatch?.portion_id,
      portion_name: line.portionName || readPortionName(apiMatch),
      quantity,
      price,
      net_price: Number(apiMatch?.net_price ?? quantity * price),
      comment: line.comment || apiMatch?.comment || "",
    });
  });
};

export const normalizeOrderDetails = (detail) => {
  if (!detail) return null;

  const order_details = detail.order_details || detail.orderDetails || detail;
  const apiMenus = collectMenuDetails(detail).map(normalizeMenuDetailItem);
  const combo_details = collectComboDetails(detail);
  const orderId = order_details?.order_id ?? detail?.order_id;
  const snapshot = getPlacedOrderSnapshot(orderId);

  const menu_details = shouldUsePlacedOrderSnapshot(apiMenus, snapshot)
    ? buildMenuDetailsFromSnapshot(snapshot, apiMenus)
    : apiMenus;

  return {
    ...detail,
    order_details,
    menu_details,
    combo_details,
  };
};
