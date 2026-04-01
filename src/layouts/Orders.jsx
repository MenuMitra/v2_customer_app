import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AuthPrompt from "../components/Auth/AuthPrompt";
import OrderAccordionItem from "../components/OrderAccordionItem";
import { useOutlet } from "../contexts/OutletContext";
import Timer from "../components/Timer";
import CancelOrderModal from "../components/Modal/variants/CancelOrderModal";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import apiService from "../api/apiService";
import { useQuery } from '@tanstack/react-query';
import { useToast } from "../components/Toast/ToastContext";

// Update the NoOrders component with new icon
const NoOrders = ({ message }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-400px)]">
      <div className="text-center">
        <div className="mb-4">
          <i className="fa-solid fa-clock-rotate-left text-[80px] opacity-50 text-[#6c757d]"></i>
        </div>
        <h5 className="mb-3 text-lg font-semibold">{message}</h5>
        <p className="text-[#6c757d] mb-4">
          Check back later for your order history
        </p>
        <button
          className="px-4 py-3 bg-[var(--primary)] text-white rounded-3xl font-medium hover:bg-green-900 transition-colors"
          onClick={() => navigate("/")}
        >
          Browse Menu
        </button>
      </div>
    </div>
  );
};

// Extracted authenticated content component
function OrdersContent() {
  const { outletId } = useOutlet();
  const navigate = useNavigate();
  const toast = useToast();

  // Get userId from auth
  const auth = JSON.parse(localStorage.getItem("auth")) || {};
  const userId = auth.userId;
  const activeOrderId = localStorage.getItem("activeOrderId");
  const activeOrderCreatedAt = localStorage.getItem("activeOrderCreatedAt");

  // State for managing active tab and expansion of date accordions
  const [activeTab, setActiveTab] = useState('completed');
  const [expandedCompletedDates, setExpandedCompletedDates] = useState({});
  const [expandedCancelledDates, setExpandedCancelledDates] = useState({});
  const [expandedPendingDates, setExpandedPendingDates] = useState({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState(null);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState(null);
  const [_setCancelOrderStatus] = useState(true);

  // Force a re-render every second so the cancel button hides exactly at 90 seconds.
  useEffect(() => {
    const id = setInterval(() => {
      // Using an unused state update to trigger re-render.
      // eslint-disable-next-line no-unused-vars
      _setCancelOrderStatus((prev) => prev);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Query for ongoing orders
  const {
    data: ongoingOrdersData,
    error: ongoingError,
    refetch: refetchOngoingOrders
  } = useQuery({
    queryKey: ['ongoingOrders', outletId, userId],
    queryFn: async () => {
      if (!userId || !outletId) return [];
      
      const response = await apiService.customer.getOngoingOrders({
        userId: parseInt(userId),
        outletId
      });

      return response.map((order) => ({
        id: order.order_number,
        orderId: order.order_id,
        orderNumber: order.order_number,
        itemCount: order.menu_count,
        status: order.status,
        iconColor: "#FFA902",
        iconBgClass: "bg-warning",
        isExpanded: false,
        parentId: "accordionExample1",
        orderType: order.order_type,
        outletName: order.outlet_name,
        totalAmount: order.final_grand_total,
        paymentMethod: order.payment_method || "Not selected",
        time: order.time,
        // Backend may provide server-side creation time in different fields.
        // Keep these for countdown/cancel window calculation.
        createdAt:
          order.order_created_time ||
          order.order_created_at ||
          order.created_time ||
          order.created_at ||
          order.timestamp ||
          null,
        tableNumber: order.table_number,
        sectionName: order.section_name
      }));
    },
    enabled: !!userId && !!outletId,
    refetchInterval: 10000,
  });

  // Fallback details for freshly created order: backend ongoing list can lag.
  const { data: activeOrderDetailsData } = useQuery({
    queryKey: ['activeOrderDetails', activeOrderId, userId],
    queryFn: async () => {
      if (!activeOrderId || !userId) return null;
      return apiService.checkout.getOrderDetails({
        orderId: activeOrderId,
        userId,
      });
    },
    enabled: !!activeOrderId && !!userId,
    refetchInterval: 10000,
  });

  const statusIsTerminal = (status) => {
    const s = String(status || "").toLowerCase();
    return (
      s === "paid" ||
      s === "cancelled" ||
      s === "rejected" ||
      s === "refunded" ||
      s === "completed"
    );
  };

  const activeFallbackOrder = (() => {
    const details = activeOrderDetailsData?.order_details;
    if (!details) return null;
    if (statusIsTerminal(details.order_status)) return null;
    return {
      id: details.order_number || String(details.order_id),
      orderId: details.order_id,
      orderNumber: details.order_number || String(details.order_id),
      itemCount: details.menu_count || activeOrderDetailsData?.menu_details?.length || 0,
      status: details.order_status || "placed",
      iconColor: "#FFA902",
      iconBgClass: "bg-warning",
      isExpanded: false,
      parentId: "accordionExample1",
      orderType: details.order_type,
      outletName: details.outlet_name,
      totalAmount: details.final_grand_total,
      paymentMethod: details.payment_method || "Not selected",
      time: details.time,
      createdAt:
        details.order_created_time ||
        details.order_created_at ||
        activeOrderCreatedAt ||
        null,
      tableNumber: details.table_number,
      sectionName: details.section_name,
    };
  })();

  const combinedOngoingOrders = (() => {
    const list = ongoingOrdersData || [];
    if (!activeFallbackOrder) return list;
    const exists = list.some(
      (o) => String(o.orderId) === String(activeFallbackOrder.orderId)
    );
    return exists ? list : [activeFallbackOrder, ...list];
  })();

  const calcRemainingSeconds = (order) => {
    const createdAtRaw = order?.createdAt;
    // Prefer createdAt if backend provides it (epoch ms or seconds or ISO)
    if (createdAtRaw != null) {
      const asNumber = Number(createdAtRaw);
      if (Number.isFinite(asNumber)) {
        // Heuristic: if it's in seconds (10 digits), convert to ms.
        const createdMs =
          asNumber > 1e12 ? asNumber : Math.floor(asNumber * 1000);
        const remainingMs = 90_000 - (Date.now() - createdMs);
        return Math.max(0, Math.ceil(remainingMs / 1000));
      }

      // ISO string parsing
      const createdDate = new Date(createdAtRaw);
      if (!Number.isNaN(createdDate.getTime())) {
        const remainingMs = 90_000 - (Date.now() - createdDate.getTime());
        return Math.max(0, Math.ceil(remainingMs / 1000));
      }
    }

    // Fallback: parse time like "12:13 PM" or "08:41:22 PM"
    const orderTime = order?.time;
    if (typeof orderTime !== "string") return 0;

    const match = orderTime.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (!match) return 0;

    const hoursRaw = Number(match[1]);
    const minutesRaw = Number(match[2]);
    const secondsRaw = match[3] ? Number(match[3]) : 0;
    const period = match[4].toUpperCase();

    const d = new Date();
    const hours12 = hoursRaw % 12;
    const hours24 = period === "PM" ? hours12 + 12 : hours12;
    d.setHours(hours24, minutesRaw, secondsRaw, 0);

    const remainingMs = 90_000 - (Date.now() - d.getTime());
    return Math.max(0, Math.ceil(remainingMs / 1000));
  };

  // Query for order history
  const {
    data: orderHistoryData,
    isLoading: isLoadingOrderHistory,
    error: orderHistoryError,
    refetch: refetchOrderHistory
  } = useQuery({
    queryKey: ['orderHistory', outletId, userId],
    queryFn: async () => {
      if (!userId || !outletId) return null;
      
      const data = await apiService.customer.getOrderHistory({
        userId: parseInt(userId),
        outletId
      });

      if (!data) return null;

      const complementaryOrders = {
        ...(data.complementary_paid || {}),
        ...(data.complimentary_paid || {})
      };

      const transformedData = {
        paid: data.paid || {},
        complimentary_paid: complementaryOrders,
        cancelled: data.cancelled || {},
        udhari_paid: data.udhari_paid || {},
        udhari_pending: data.udhari_pending || {},
      };

      const udhariPendingRaw = data.udhari_pending || {};
      const udhariPendingList = Object.values(udhariPendingRaw).flat();
      const mappedUdhariPending = udhariPendingList.map((order) => ({
        id: order.order_number,
        orderId: order.order_id,
        orderNumber: order.order_number,
        itemCount: order.menu_count,
        status: order.order_status,
        iconColor: "#FFA902",
        iconBgClass: "bg-warning",
        isExpanded: false,
        parentId: "accordionExamplePending",
        orderType: order.order_type,
        outletName: order.outlet_name,
        totalAmount: order.final_grand_total,
        paymentMethod: order.payment_method || "Not selected",
        time: order.time,
        tableNumber: order.table_number,
        sectionName: order.section_name,
        datetime: order.datetime,
      }));

      return {
        orders: transformedData,
        udhariPending: mappedUdhariPending
      };
    },
    enabled: !!userId && !!outletId,
  });

  // Handler for expanding/collapsing individual date accordions for completed orders
  const toggleCompletedDateExpansion = (date) => {
    setExpandedCompletedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  // Handler for expanding all completed date accordions
  const handleExpandAllCompleted = () => {
    const newExpandedState = {};
    Object.keys(transformedOrders.completedByDate).forEach((date) => {
      newExpandedState[date] = true;
    });
    setExpandedCompletedDates(newExpandedState);
  };

  // Handler for collapsing all completed date accordions
  const handleCollapseAllCompleted = () => {
    setExpandedCompletedDates({});
  };

  // Handler for expanding/collapsing individual date accordions for cancelled orders
  const toggleCancelledDateExpansion = (date) => {
    setExpandedCancelledDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  // Handler for expanding all cancelled date accordions
  const handleExpandAllCancelled = () => {
    const newExpandedState = {};
    Object.keys(transformedOrders.cancelledByDate).forEach((date) => {
      newExpandedState[date] = true;
    });
    setExpandedCancelledDates(newExpandedState);
  };

  // Handler for collapsing all cancelled date accordions
  const handleCollapseAllCancelled = () => {
    setExpandedCancelledDates({});
  };

  // Fix groupUdhariPaidByDate to always group by date (Month DD, YYYY)
  // const groupUdhariPaidByDate = (orders) => { ... };

  // Remove the groupUdhariPaidByDate function and udhariPaidGrouped constant since we don't need them anymore
  // const udhariPaidGrouped = groupUdhariPaidByDate(udhariPaidOrders);
  
  // Remove the toggleUdhariPaidDateExpansion function since we don't need it anymore
  // const toggleUdhariPaidDateExpansion = (date) => { ... };

  // const fetchCompletedOrders = async () => {
  //   try {
  //     const auth = JSON.parse(localStorage.getItem("auth")) || {};
  //     const userId = auth.userId;
  //     const accessToken = auth.accessToken;

  //     if (!accessToken) {
  //       throw new Error("Authentication token not found");
  //     }

  //     const data = await apiService.customer.getOrderHistory({
  //       userId: parseInt(userId),
  //       outletId
  //     });

  //     if (data) {
  //       // Merge both spellings of complementary/complimentary orders
  //       const complementaryOrders = {
  //         ...(data.complementary_paid || {}),
  //         ...(data.complimentary_paid || {})
  //       };

  //       // Transform the data to include all order types
  //       // const transformedData = {
  //       //   paid: data.paid || {},
  //       //   complimentary_paid: complementaryOrders,
  //       //   cancelled: data.cancelled || {},
  //       //   udhari_paid: data.udhari_paid || {},
  //       //   udhari_pending: data.udhari_pending || {},
  //       // };
  //       // setOrdersData(transformedData); // This line is removed as per the new_code, as TanStack Query handles background updates.

  //       // Extract udhari_pending orders and flatten them into a single array
  //       // const udhariPendingRaw = data.udhari_pending || {};
  //       // const udhariPendingList = Object.values(udhariPendingRaw).flat();
  //       // const mappedUdhariPending = udhariPendingList.map((order) => ({
  //       //   id: order.order_number,
  //       //   orderId: order.order_id,
  //       //   orderNumber: order.order_number,
  //       //   itemCount: order.menu_count,
  //       //   status: order.order_status,
  //       //   iconColor: "#FFA902",
  //       //   iconBgClass: "bg-warning",
  //       //   isExpanded: false,
  //       //   parentId: "accordionExamplePending",
  //       //   orderType: order.order_type,
  //       //   outletName: order.outlet_name,
  //       //   totalAmount: order.final_grand_total,
  //       //   paymentMethod: order.payment_method || "Not selected",
  //       //   time: order.time,
  //       //   tableNumber: order.table_number,
  //       //   sectionName: order.section_name,
  //       //   datetime: order.datetime,
  //       // }));
  //       // setUdhariPendingOrders(mappedUdhariPending); // This line is removed as per the new_code, as TanStack Query handles background updates.
  //     }
  //   } catch (err) {
  //     console.error("Error fetching order history:", err);
  //     // setError((prev) => ({ ...prev, history: err.message })); // This line is removed as per the new_code, as TanStack Query handles background updates.
  //   } finally {
  //     // setIsLoadingHistory(false); // This line is removed as per the new_code, as TanStack Query handles background updates.
  //   }
  // };

  // Update the getOrderStatus function to handle both spellings
  const getOrderStatus = (order) => {
    switch (order.order_status) {
      case "complimentary_paid":
      case "complementary_paid":
        return {
          status: "Complimentary",
          iconColor: "#6c5ce7",
          iconBgClass: "bg-info",
        };
      case "paid":
        return {
          status: "Completed",
          iconColor: "#00B67A",
          iconBgClass: "bg-success",
        };
      case "udhari_paid":
        return {
          status: "Udhari Paid",
          iconColor: "#00B67A",
          iconBgClass: "bg-success",
        };
      case "cancelled":
        return {
          status: "Cancelled",
          iconColor: "#E74C3C",
          iconBgClass: "bg-danger",
        };
      default:
        return {
          status: order.order_status || "Completed",
          iconColor: "#00B67A",
          iconBgClass: "bg-success",
        };
    }
  };

  // Update the transformOrderData function to handle complementary orders
  const transformOrderData = (orders) => {
    const transformedOrders = {
      completedByDate: {},
      cancelledByDate: {},
    };

    // Helper function to format date from 'YYYY-MM-DD' to 'DD Mon YYYY'
    const formatDate = (dateString) => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        const options = { day: "numeric", month: "short", year: "numeric" };
        return date.toLocaleDateString("en-US", options);
      } catch (e) {
        console.error("Invalid date string:", dateString, e);
        return dateString; // Fallback
      }
    };

    // Process all order types
    const processOrders = (orderList, dateKey, isCancelled = false) => {
      const formattedDate = formatDate(dateKey);
      const orders = orderList.map((order) => {
        const { status, iconColor, iconBgClass } = getOrderStatus(order);
        return {
          id: order.order_number,
          orderId: order.order_id,
          orderNumber: order.order_number,
          itemCount: order.menu_count,
          status,
          iconColor,
          iconBgClass,
          isExpanded: true,
          parentId: isCancelled ? "accordionExample2" : "accordionExample3",
          outletName: order.outlet_name,
          orderType: order.order_type,
          totalAmount: order.final_grand_total,
          paymentStatus: status,
          orderTime: order.time,
          tableNumber: order.table_number,
          sectionName: order.section_name,
        };
      });

      // Sort orders by order number in descending order
      orders.sort((a, b) => parseInt(b.orderNumber) - parseInt(a.orderNumber));

      if (isCancelled) {
        transformedOrders.cancelledByDate[formattedDate] = {
          date: formattedDate,
          orderCount: orders.length,
          orders,
        };
      } else {
        if (transformedOrders.completedByDate[formattedDate]) {
          transformedOrders.completedByDate[formattedDate].orders = [
            ...transformedOrders.completedByDate[formattedDate].orders,
            ...orders,
          ].sort((a, b) => parseInt(b.orderNumber) - parseInt(a.orderNumber)); // Sort after merging
          transformedOrders.completedByDate[formattedDate].orderCount +=
            orders.length;
        } else {
          transformedOrders.completedByDate[formattedDate] = {
            date: formattedDate,
            orderCount: orders.length,
            orders,
          };
        }
      }
    };

    // Process paid orders
    if (orders.paid) {
      Object.entries(orders.paid).forEach(([dateKey, orderList]) => {
        processOrders(orderList, dateKey);
      });
    }

    // Process complimentary paid orders
    if (orders.complimentary_paid) {
      Object.entries(orders.complimentary_paid).forEach(([dateKey, orderList]) => {
        processOrders(orderList, dateKey);
      });
    }

    // Process udhari paid orders
    if (orders.udhari_paid) {
      Object.entries(orders.udhari_paid).forEach(([dateKey, orderList]) => {
        processOrders(orderList, dateKey);
      });
    }

    // Process cancelled orders
    if (orders.cancelled) {
      Object.entries(orders.cancelled).forEach(([dateKey, orderList]) => {
        processOrders(orderList, dateKey, true);
      });
    }

    return transformedOrders;
  };

  // Update transformedOrders to use new data structure
  const transformedOrders = transformOrderData(orderHistoryData?.orders || {
    paid: {},
    complimentary_paid: {},
    cancelled: {},
  });

  // Update pendingOrdersByDate to use new data structure
  const pendingOrdersByDate = {};
// Get udhari_pending as before
(orderHistoryData?.udhariPending || []).forEach(order => {
  const dateKey = order.datetime.split(' ').slice(0, 3).join(' ');
  if (!pendingOrdersByDate[dateKey]) {
    pendingOrdersByDate[dateKey] = {
      date: dateKey,
      orderCount: 0,
      orders: []
    };
  }
  pendingOrdersByDate[dateKey].orders.push(order);
  pendingOrdersByDate[dateKey].orderCount++;
});
// Also check ongoingOrdersData for .status === 'cooking'
(combinedOngoingOrders || []).forEach(order => {
  if (order.status === 'cooking') {
    // Use today for dateKey since no datetime is present; fallback to 'Today' or order.time
    const dateKey = 'Today';
    if (!pendingOrdersByDate[dateKey]) {
      pendingOrdersByDate[dateKey] = {
        date: dateKey,
        orderCount: 0,
        orders: []
      };
    }
    pendingOrdersByDate[dateKey].orders.push(order);
    pendingOrdersByDate[dateKey].orderCount++;
  }
});
// Sort pending orders
Object.values(pendingOrdersByDate).forEach(dateGroup => {
  dateGroup.orders.sort((a, b) => parseInt(b.orderNumber) - parseInt(a.orderNumber));
});

  // Handler for expanding all pending date accordions
  const handleExpandAllPending = () => {
    const newExpandedState = {};
    Object.keys(pendingOrdersByDate).forEach((date) => {
      newExpandedState[date] = true;
    });
    setExpandedPendingDates(newExpandedState);
  };

  // Handler for collapsing all pending date accordions
  const handleCollapseAllPending = () => {
    setExpandedPendingDates({});
  };

  // Handler for expanding/collapsing individual date accordions for pending orders
  const togglePendingDateExpansion = (date) => {
    setExpandedPendingDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  // Update the handleCancelOrder function
  const handleCancelOrder = (order) => {
    setSelectedOrderId(order.orderId);
    setSelectedOrderNumber(order.orderNumber);
    setSelectedOrderForCancel(order);
    setShowCancelModal(true);
  };

  // Update handleConfirmCancel
  const handleConfirmCancel = async (reason) => {
    try {
      await apiService.customer.cancelOrder({
        outletId,
        orderId: selectedOrderId,
        note: reason
      });

      await refetchOngoingOrders();
      await refetchOrderHistory();
      handleCloseCancelModal();
      toast.show({
        type: "success",
        message: "Order cancelled successfully",
      });
    } catch (err) {
      _setCancelOrderStatus(false);
      console.error("Error cancelling order:", err);
      const msg =
        err?.message ||
        err?.detail ||
        (typeof err?.data?.detail === "string" ? err.data.detail : null) ||
        "Could not cancel this order";
      toast.show({ type: "error", message: msg });
    }
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setSelectedOrderId(null);
    setSelectedOrderNumber(null);
    setSelectedOrderForCancel(null);
  };

  // const handleLogin = () => {
  //   setShowAuthOffcanvas(true);
  // };

  // Group udhariPendingOrders by date
  // const udhariPendingGrouped = groupUdhariPaidByDate(udhariPendingOrders);

  // Group pending orders by date using the same logic as completed orders
  // const pendingOrdersByDate = {};
  // udhariPendingOrders.forEach(order => {
  //   const dateKey = order.datetime.split(' ').slice(0, 3).join(' ');
  //   if (!pendingOrdersByDate[dateKey]) {
  //     pendingOrdersByDate[dateKey] = {
  //       date: dateKey,
  //       orderCount: 0,
  //       orders: []
  //     };
  //   }
  //   pendingOrdersByDate[dateKey].orders.push(order);
  //   pendingOrdersByDate[dateKey].orderCount++;
  // });

  // Sort pending orders by order number in descending order
  // Object.values(pendingOrdersByDate).forEach(dateGroup => {
  //   dateGroup.orders.sort((a, b) => parseInt(b.orderNumber) - parseInt(a.orderNumber));
  // });

  // Handler for expanding all pending date accordions
  // const handleExpandAllPending = () => {
  //   const newExpandedState = {};
  //   Object.keys(pendingOrdersByDate).forEach((date) => {
  //     newExpandedState[date] = true;
  //   });
  //   setExpandedPendingDates(newExpandedState);
  // };

  // Handler for collapsing all pending date accordions
  // const handleCollapseAllPending = () => {
  //   setExpandedPendingDates({});
  // };

  // Handler for expanding/collapsing individual date accordions for pending orders
  // const togglePendingDateExpansion = (date) => {
  //   setExpandedPendingDates((prev) => ({
  //     ...prev,
  //     [date]: !prev[date],
  //   }));
  // };

  return (
    <>
      <div className="page-content">
        <div className="max-w-[1200px] mx-auto px-4 max-h-[calc(100vh-140px)] overflow-y-auto overscroll-contain pb-[220px]">
          {/* Show ongoing orders section */}
          {!ongoingError && combinedOngoingOrders?.length > 0 && (
            <div className="mb-4">
              <h6 className="mb-3 text-base font-semibold">Ongoing Orders</h6>
              <div className="orders-list">
                {combinedOngoingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="order-item mb-3 cursor-pointer"
                    onClick={() => navigate(`/order-detail/${order.orderId}`)}
                  >
                    <div className="border border-[#ffc107] shadow-sm p-3 rounded-lg">
                      <div className="flex items-center justify-between w-full">
                        {/* Left side with icon and order details */}
                        <div className="flex items-center">
                          {/* Always show countdown based on backend created time if available.
                              Cancel button itself still depends on backend status. */}
                          {(() => {
                            const remainingSeconds = calcRemainingSeconds(order);
                            if (remainingSeconds > 0 || order.status === "placed") {
                              return (
                                <Timer initialSeconds={remainingSeconds} />
                              );
                            }
                            return (
                              <span className={`icon-box ${order.iconBgClass}`}>
                                <i className="fa-solid fa-bag-shopping text-white"></i>
                              </span>
                            );
                          })()}
                          <div className="ml-3">
                            <h6 className="mb-0 font-semibold">Order #{order.orderNumber}</h6>
                            <span className="text-soft text-sm">
                              {order.itemCount} Items {order.status}
                            </span>
                          </div>
                        </div>

                        {/* Right side with dine-in status and cancel button */}
                        <div className="flex flex-col items-end">
                          <span className="text-soft mb-2 text-sm">{order.orderType?.toUpperCase()}</span>
                          {(() => {
                            const remainingSeconds = calcRemainingSeconds(order);
                            // API only accepts cancel when order is still "placed"
                            // (e.g. "cooking" returns: not in placed status, cannot be cancelled).
                            const statusNorm = String(order.status || "").toLowerCase();
                            const canCancel =
                              remainingSeconds > 0 && statusNorm === "placed";
                            return canCancel ? (
                            <button
                              className="px-3 py-1.5 text-sm text-white bg-[#FF0000] rounded hover:bg-[#cc0000] transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelOrder(order);
                              }}
                            >
                              Cancel Order
                            </button>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="default-tab style-1">
            <div className="flex flex-nowrap overflow-auto w-full justify-between border-b border-gray-200">
              <button
                className={`flex-shrink-0 w-1/3 text-base flex items-center justify-center py-3 border-b-2 transition-colors ${
                  activeTab === 'completed'
                    ? 'border-[#27ae60] text-[#27ae60] bg-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('completed')}
                type="button"
              >
                <i className="fa-solid fa-circle-check mr-2 text-lg"></i>
                <span className="text-[15px] font-medium">
                  Completed
                </span>
              </button>
              <button
                className={`flex-shrink-0 w-1/3 text-base flex items-center justify-center py-3 border-b-2 transition-colors ${
                  activeTab === 'cancelled'
                    ? 'border-[#e74c3c] text-[#e74c3c] bg-red-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('cancelled')}
                type="button"
              >
                <i className="fa-solid fa-ban mr-2 text-lg"></i>
                <span className="text-[15px] font-medium">
                  Cancelled
                </span>
              </button>
              <button
                className={`flex-shrink-0 w-1/3 text-base flex items-center justify-center py-3 border-b-2 transition-colors ${
                  activeTab === 'pending'
                    ? 'border-black text-black bg-gray-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('pending')}
                type="button"
              >
                <i className="fa-solid fa-clock mr-2 text-lg"></i>
                <span className="text-[15px] font-medium">
                  Pending
                </span>
              </button>
            </div>
            <div className="mt-4">
              {/* Pending Orders Tab */}
              {activeTab === 'pending' && (
                <div>
                  <div className="accordion style-3">
                    {Object.keys(pendingOrdersByDate).length > 0 ? (
                      <>
                        <div className="flex justify-end items-center mb-3">
                          <button
                            className="text-sm p-0 text-[var(--text-dark)] hover:text-[var(--primary)] transition-colors"
                            onClick={
                              Object.values(expandedPendingDates).some((e) => e)
                                ? handleCollapseAllPending
                                : handleExpandAllPending
                            }
                          >
                            <span>
                              {Object.values(expandedPendingDates).some((e) => e)
                                ? "Collapse All"
                                : "Expand All"}
                            </span>
                            <i
                              className={`ml-2 fas ${
                                Object.values(expandedPendingDates).some((e) => e)
                                  ? "fa-chevron-up"
                                  : "fa-chevron-down"
                              }`}
                            ></i>
                          </button>
                        </div>
                        {Object.entries(pendingOrdersByDate).map(([dateKey, dailyData]) => (
                          <div className="accordion-item mb-3" key={dateKey}>
                            <div className="accordion-header">
                              <button
                                className={`w-full flex justify-between items-center p-3 text-[var(--text-dark)] hover:text-[var(--primary)] transition-colors border rounded-lg ${
                                  expandedPendingDates[dateKey] ? "bg-gray-50" : "bg-white"
                                }`}
                                type="button"
                                onClick={() => togglePendingDateExpansion(dateKey)}
                              >
                                <span className="flex-grow text-left font-medium">{dailyData.date}</span>
                                <span className="mr-2 text-sm text-gray-500">{dailyData.orderCount} orders</span>
                                <i
                                  className={`ml-2 fas ${
                                    expandedPendingDates[dateKey]
                                      ? "fa-chevron-up"
                                      : "fa-chevron-down"
                                  }`}
                                ></i>
                              </button>
                            </div>
                            {expandedPendingDates[dateKey] && (
                              <div className="accordion-body mt-2">
                                {dailyData.orders.map((order) => (
                                  <OrderAccordionItem
                                    key={order.id + "-" + order.status}
                                    orderId={order.orderId}
                                    orderNumber={order.orderNumber}
                                    itemCount={order.itemCount}
                                    status={order.status}
                                    iconColor={order.iconColor}
                                    iconBgClass={order.iconBgClass}
                                    isExpanded={order.isExpanded}
                                    parentId={order.parentId}
                                    outletName={order.outletName}
                                    orderType={order.orderType}
                                    totalAmount={order.totalAmount}
                                    paymentStatus={
                                      order.status === "udhari_pending"
                                        ? "Udhari Pending"
                                        : order.paymentStatus
                                    }
                                    orderTime={order.time || order.orderTime}
                                    tableNumber={order.tableNumber}
                                    sectionName={order.sectionName}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      <NoOrders message="No pending orders" />
                    )}
                  </div>
                </div>
              )}
              {/* Completed Orders Tab */}
              {activeTab === 'completed' && (
                <div>
                  <div className="accordion style-3" id="accordionExample3">
                  {orderHistoryError ? (
                    <NoOrders message="No completed orders" />
                  ) : Object.keys(transformedOrders.completedByDate).length >
                    0 ? (
                    <>
                      {/* Expand/Collapse All for Completed Orders */}
                      <div className="flex justify-end items-center mb-3">
                        <button
                          className="text-sm p-0 text-[var(--text-dark)] hover:text-[var(--primary)] transition-colors"
                          onClick={
                            Object.values(expandedCompletedDates).some((e) => e)
                              ? handleCollapseAllCompleted
                              : handleExpandAllCompleted
                          }
                          aria-expanded={Object.values(
                            expandedCompletedDates
                          ).some((e) => e)}
                        >
                          <span>
                            {Object.values(expandedCompletedDates).some(
                              (e) => e
                            )
                              ? "Collapse All"
                              : "Expand All"}
                          </span>
                          <i
                            className={`ml-2 fas ${
                              Object.values(expandedCompletedDates).some(
                                (e) => e
                              )
                                ? "fa-chevron-up"
                                : "fa-chevron-down"
                            }`}
                          ></i>
                        </button>
                      </div>
                      {Object.entries(transformedOrders.completedByDate).map(
                        ([dateKey, dailyOrderData]) => (
                          <div className="accordion-item" key={dateKey}>
                            <h2
                              className="accordion-header"
                              id={"heading" + dateKey.replace(/\s/g, "")}
                            >
                              <button
                                className={`w-full flex justify-between items-center p-0 text-[var(--text-dark)] hover:text-[var(--primary)] transition-colors ${
                                  !expandedCompletedDates[dateKey]
                                    ? "collapsed"
                                    : ""
                                }`}
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target={
                                  "#collapse" + dateKey.replace(/\s/g, "")
                                }
                                aria-expanded={
                                  expandedCompletedDates[dateKey] || false
                                }
                                aria-controls={
                                  "collapse" + dateKey.replace(/\s/g, "")
                                }
                                onClick={() =>
                                  toggleCompletedDateExpansion(dateKey)
                                }
                              >
                                <span className="flex-grow text-left">
                                  {dailyOrderData.date}
                                </span>
                                <span className="mr-2">
                                  {dailyOrderData.orderCount}
                                </span>
                                <i
                                  className={`ml-2 fas ${
                                    expandedCompletedDates[dateKey]
                                      ? "fa-chevron-up"
                                      : "fa-chevron-down"
                                  }`}
                                ></i>
                              </button>
                            </h2>
                            <div
                              id={"collapse" + dateKey.replace(/\s/g, "")}
                              className={
                                "accordion-collapse collapse " +
                                (expandedCompletedDates[dateKey] ? "show" : "")
                              }
                              aria-labelledby={
                                "heading" + dateKey.replace(/\s/g, "")
                              }
                              data-bs-parent="#accordionExample3"
                            >
                              <div className="accordion-body">
                                {dailyOrderData.orders.map((order) => (
                                  <OrderAccordionItem
                                    key={order.id}
                                    orderId={order.orderId}
                                    orderNumber={order.orderNumber}
                                    itemCount={order.itemCount}
                                    status={order.status}
                                    iconColor={order.iconColor}
                                    iconBgClass={order.iconBgClass}
                                    isExpanded={order.isExpanded}
                                    parentId={order.parentId}
                                    outletName={order.outletName}
                                    orderType={order.orderType}
                                    totalAmount={order.totalAmount}
                                    paymentStatus={order.paymentStatus}
                                    orderTime={order.orderTime}
                                    tableNumber={order.tableNumber}
                                    sectionName={order.sectionName}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </>
                  ) : (
                    <NoOrders message="No completed orders" />
                  )}
                </div>
                </div>
              )}

              {/* Cancelled Orders Tab */}
              {activeTab === 'cancelled' && (
                <div>
                  <div className="accordion style-3" id="accordionExample2">
                  {isLoadingOrderHistory ? (
                    <div className="text-center py-4 text-[#6c757d]">
                      Loading order history...
                    </div>
                  ) : orderHistoryError ? (
                    <NoOrders message="No cancelled orders" />
                  ) : Object.keys(transformedOrders.cancelledByDate).length >
                    0 ? (
                    <>
                      {/* Expand/Collapse All for Cancelled Orders */}
                      <div className="flex justify-end items-center mb-3">
                        <button
                          className="text-sm p-0 text-[var(--text-dark)] hover:text-[var(--primary)] transition-colors"
                          onClick={
                            Object.values(expandedCancelledDates).some((e) => e)
                              ? handleCollapseAllCancelled
                              : handleExpandAllCancelled
                          }
                          aria-expanded={Object.values(
                            expandedCancelledDates
                          ).some((e) => e)}
                        >
                          <span>
                            {Object.values(expandedCancelledDates).some(
                              (e) => e
                            )
                              ? "Collapse All"
                              : "Expand All"}
                          </span>
                          <i
                            className={`ml-2 fas ${
                              Object.values(expandedCancelledDates).some(
                                (e) => e
                              )
                                ? "fa-chevron-up"
                                : "fa-chevron-down"
                            }`}
                          ></i>
                        </button>
                      </div>
                      {Object.entries(transformedOrders.cancelledByDate).map(
                        ([dateKey, dailyOrderData]) => (
                          <div className="accordion-item" key={dateKey}>
                            <h2
                              className="accordion-header"
                              id={
                                "headingCancelled" + dateKey.replace(/\s/g, "")
                              }
                            >
                              <button
                                className={`w-full flex justify-between items-center p-0 text-[var(--text-dark)] hover:text-[var(--primary)] transition-colors ${
                                  !expandedCancelledDates[dateKey]
                                    ? "collapsed"
                                    : ""
                                }`}
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target={
                                  "#collapseCancelled" + dateKey.replace(/\s/g, "")
                                }
                                aria-expanded={expandedCancelledDates[dateKey] || false}
                                aria-controls={
                                  "collapseCancelled" + dateKey.replace(/\s/g, "")
                                }
                                onClick={() =>
                                  toggleCancelledDateExpansion(dateKey)
                                }
                              >
                                <span className="flex-grow text-left">
                                  {dailyOrderData.date}
                                </span>
                                <span className="mr-2">
                                  {dailyOrderData.orderCount}
                                </span>
                                <i
                                  className={`ml-2 fas ${
                                    expandedCancelledDates[dateKey]
                                      ? "fa-chevron-up"
                                      : "fa-chevron-down"
                                  }`}
                                ></i>
                              </button>
                            </h2>
                            <div
                              id={
                                "collapseCancelled" + dateKey.replace(/\s/g, "")
                              }
                              className={
                                "accordion-collapse collapse " +
                                (expandedCancelledDates[dateKey] ? "show" : "")
                              }
                              aria-labelledby={
                                "headingCancelled" + dateKey.replace(/\s/g, "")
                              }
                              data-bs-parent="#accordionExample2"
                            >
                              <div className="accordion-body">
                                {dailyOrderData.orders.map((order) => (
                                  <OrderAccordionItem
                                    key={order.id}
                                    orderId={order.orderId}
                                    orderNumber={order.orderNumber}
                                    itemCount={order.itemCount}
                                    status={order.status}
                                    iconColor={order.iconColor}
                                    iconBgClass={order.iconBgClass}
                                    isExpanded={order.isExpanded}
                                    parentId={order.parentId}
                                    outletName={order.outletName}
                                    orderType={order.orderType}
                                    totalAmount={order.totalAmount}
                                    paymentStatus={order.paymentStatus}
                                    orderTime={order.orderTime}
                                    tableNumber={order.tableNumber}
                                    sectionName={order.sectionName}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </>
                  ) : (
                    <NoOrders message="No cancelled orders" />
                  )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={handleCloseCancelModal}
        onConfirm={handleConfirmCancel}
        orderId={selectedOrderId}
        orderNumber={selectedOrderNumber}
        remainingSeconds={
          selectedOrderForCancel ? calcRemainingSeconds(selectedOrderForCancel) : null
        }
      />
    </>
  );
}

function Orders() {
  const { user } = useAuth();

  return (
    <>
      <Header />
      {!user ? (
        <AuthPrompt variant="orders" />
      ) : (
        <OrdersContent />
      )}
      <Footer />
    </>
  );
}

export default Orders;
