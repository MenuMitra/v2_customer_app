const TERMINAL_ORDER_STATUSES = new Set([
  "completed",
  "cancelled",
  "canceled",
  "rejected",
  "refunded",
  "paid",
  "complimentary_paid",
  "complementary_paid",
  "udhari_paid",
  "settled",
]);

const readOrderId = (order) =>
  order?.order_id ?? order?.orderId ?? order?.id ?? null;

const readOrderStatus = (order) =>
  String(order?.order_status ?? order?.status ?? "")
    .toLowerCase()
    .trim();

export const isTerminalOrderStatus = (status) => {
  const normalized = String(status ?? "")
    .toLowerCase()
    .trim();
  return TERMINAL_ORDER_STATUSES.has(normalized);
};

export const clearActiveOrderSession = () => {
  localStorage.removeItem("activeOrderId");
  localStorage.removeItem("activeOrderCreatedAt");
};

const collectIdsFromOrderList = (orderList, ids) => {
  if (!Array.isArray(orderList)) return;

  orderList.forEach((order) => {
    const id = readOrderId(order);
    if (id != null && id !== "") {
      ids.add(String(id));
    }
  });
};

const collectIdsFromGroupedOrders = (groupedOrders, ids) => {
  if (!groupedOrders || typeof groupedOrders !== "object") return;

  Object.values(groupedOrders).forEach((orderList) => {
    collectIdsFromOrderList(orderList, ids);
  });
};

export const collectCompletedOrderIds = (orderHistoryData) => {
  const ids = new Set();
  if (!orderHistoryData) return ids;

  const orders = orderHistoryData.orders || orderHistoryData;

  collectIdsFromGroupedOrders(orders.paid, ids);
  collectIdsFromGroupedOrders(orders.complimentary_paid, ids);
  collectIdsFromGroupedOrders(orders.complementary_paid, ids);
  collectIdsFromGroupedOrders(orders.udhari_paid, ids);
  collectIdsFromGroupedOrders(orders.cancelled, ids);
  collectIdsFromGroupedOrders(orders.canceled, ids);

  if (Array.isArray(orderHistoryData.udhariPending)) {
    collectIdsFromOrderList(orderHistoryData.udhariPending, ids);
  }

  return ids;
};

export const shouldHideFromOngoingOrders = (
  order,
  completedOrderIds = new Set()
) => {
  if (!order) return true;

  const status = readOrderStatus(order);
  if (isTerminalOrderStatus(status)) {
    return true;
  }

  const orderId = readOrderId(order);
  if (
    orderId != null &&
    orderId !== "" &&
    completedOrderIds instanceof Set &&
    completedOrderIds.has(String(orderId))
  ) {
    return true;
  }

  return false;
};
