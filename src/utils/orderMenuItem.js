import { getDisplayPortionLabel } from "./portionLabel";

const DEFAULT_PORTION_NAMES = new Set(["default", "regular", ""]);

const readPortionName = (item) =>
  item?.portionName ??
  item?.portion_name ??
  item?.portions_name ??
  item?.portion ??
  "";

export const getOrderMenuPortionLabel = (item) => {
  const label = getDisplayPortionLabel(readPortionName(item));
  return label || "Regular";
};

export const getOrderMenuLineKey = (item, index = 0) => {
  const menuId = item?.menu_id ?? item?.menuId ?? "menu";
  const portionId = item?.portion_id ?? item?.portionId ?? "";
  const portionName = String(readPortionName(item)).toLowerCase().trim();
  const price = item?.price ?? "";
  const quantity = item?.quantity ?? "";
  const comment = item?.comment ?? "";

  return `${menuId}-${portionId}-${portionName}-${price}-${quantity}-${comment}-${index}`;
};

const resolvePortionId = (item) => {
  const portionId = item?.portionId ?? item?.portion_id ?? null;
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

const normalizeMenuDetailItem = (item) => {
  const quantity = Number(item?.quantity ?? 0);
  const price = Number(item?.price ?? item?.menu_price ?? 0);
  const netPrice = Number(
    item?.net_price ?? item?.menu_sub_total ?? quantity * price
  );
  const portionName = String(readPortionName(item)).trim();

  return {
    ...item,
    menu_id: item?.menu_id ?? item?.menuId,
    menu_name: item?.menu_name ?? item?.menuName ?? "",
    portion_name: portionName,
    quantity,
    price,
    net_price: netPrice,
  };
};

const collectMenuDetails = (detail) => {
  const candidates = [
    detail?.menu_details,
    detail?.menuDetails,
    detail?.order_items,
    detail?.order_menu_items,
    detail?.menus,
  ];

  for (const list of candidates) {
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
  }

  return [];
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

export const normalizeOrderDetails = (detail) => {
  if (!detail) return null;

  const order_details = detail.order_details || detail.orderDetails || detail;
  const menu_details = collectMenuDetails(detail).map(normalizeMenuDetailItem);
  const combo_details = collectComboDetails(detail);

  return {
    ...detail,
    order_details,
    menu_details,
    combo_details,
  };
};
