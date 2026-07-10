const TERMINAL_ORDER_STATUSES = new Set([
  "completed",
  "complete",
  "cancelled",
  "canceled",
  "rejected",
  "refunded",
  "paid",
  "complimentary_paid",
  "complementary_paid",
  "udhari_paid",
  "settled",
  "served",
  "closed",
  "delivered",
]);

const PAID_PAYMENT_STATUSES = new Set([
  "paid",
  "settled",
  "completed",
  "success",
  "successful",
]);

const readOrderId = (order) =>
  order?.order_id ?? order?.orderId ?? order?.id ?? null;

const readOrderStatus = (order) =>
  String(order?.order_status ?? order?.status ?? "")
    .toLowerCase()
    .trim();

const readPaymentStatus = (order) =>
  String(order?.payment_status ?? order?.paymentStatus ?? "")
    .toLowerCase()
    .trim();

export const isTerminalOrderStatus = (status) => {
  const normalized = String(status ?? "")
    .toLowerCase()
    .trim();
  return TERMINAL_ORDER_STATUSES.has(normalized);
};

export const isPaidOrSettledOrder = (order) => {
  if (!order) return false;

  const orderStatus = readOrderStatus(order);
  if (isTerminalOrderStatus(orderStatus)) {
    return true;
  }

  const paymentStatus = readPaymentStatus(order);
  if (PAID_PAYMENT_STATUSES.has(paymentStatus)) {
    return true;
  }

  if (
    order?.is_settled === 1 ||
    order?.is_settled === true ||
    order?.order_settled === 1 ||
    order?.order_settled === true ||
    order?.is_paid === 1 ||
    order?.is_paid === true
  ) {
    return true;
  }

  return false;
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
  collectIdsFromGroupedOrders(orders.settled, ids);
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

  if (isPaidOrSettledOrder(order)) {
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
