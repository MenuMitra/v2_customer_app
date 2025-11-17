import React, { useState } from "react";
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

// Update the NoOrders component with new icon
const NoOrders = ({ message }) => {
  const navigate = useNavigate();

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "calc(100vh - 400px)" }}
    >
      <div className="text-center">
                  <div className="mb-4">
                    <i
                      className="fa-solid fa-clock-rotate-left"
                      style={{ fontSize: 80, opacity: 0.5, color: "#6c757d" }}
                    ></i>
                  </div>
        <h5 className="mb-3">{message}</h5>
        <p className="text-muted mb-4">
          Check back later for your order history
        </p>
        <button
          className="btn btn-primary px-4 py-3"
          style={{ borderRadius: 12, fontWeight: 500 }}
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

  // Get userId from auth
  const auth = JSON.parse(localStorage.getItem("auth")) || {};
  const userId = auth.userId;

  // State for managing expansion of date accordions
  const [expandedCompletedDates, setExpandedCompletedDates] = useState({});
  const [expandedCancelledDates, setExpandedCancelledDates] = useState({});
  const [expandedPendingDates, setExpandedPendingDates] = useState({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState(null);
  const [_setCancelOrderStatus] = useState(true);

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
        tableNumber: order.table_number,
        sectionName: order.section_name
      }));
    },
    enabled: !!userId && !!outletId,
    refetchInterval: 10000,
  });

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
(ongoingOrdersData || []).forEach(order => {
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
  const handleCancelOrder = (orderId, orderNumber) => {
    setSelectedOrderId(orderId);
    setSelectedOrderNumber(orderNumber);
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
    } catch (err) {
      _setCancelOrderStatus(false);
      console.error("Error cancelling order:", err);
    }
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setSelectedOrderId(null);
    setSelectedOrderNumber(null);
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
        <div className="container pb">
          {/* Show ongoing orders section */}
          {!ongoingError && ongoingOrdersData?.length > 0 && (
            <div className="mb-4">
              <h6 className="mb-3">Ongoing Orders</h6>
              <div className="orders-list">
                {ongoingOrdersData.map((order) => (
                  <div
                    key={order.id}
                    className="order-item mb-3"
                    onClick={() => navigate(`/order-detail/${order.orderId}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="border border-warning shadow-sm p-3 rounded">
                      <div className="d-flex align-items-center justify-content-between w-100">
                        {/* Left side with icon and order details */}
                        <div className="d-flex align-items-center">
                          {order.status === "placed" ? (
                            <Timer orderTime={order.time} />
                          ) : (
                            <span className={`icon-box ${order.iconBgClass}`}>
                              <i className="fa-solid fa-bag-shopping text-white"></i>
                            </span>
                          )}
                          <div className="ms-3">
                            <h6 className="mb-0">Order #{order.orderNumber}</h6>
                            <span className="text-soft">
                              {order.itemCount} Items {order.status}
                            </span>
                          </div>
                        </div>

                        {/* Right side with dine-in status and cancel button */}
                        <div className="d-flex flex-column align-items-end">
                          <span className="text-soft mb-2">{order.orderType?.toUpperCase()}</span>
                          {order.status === "placed" && (
                            <button
                              className="btn btn-sm text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelOrder(order.orderId, order.orderNumber);
                              }}
                              style={{ backgroundColor: "#FF0000" }}
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="default-tab style-1">
            <ul
              className="nav nav-tabs d-flex flex-nowrap overflow-auto w-120 justify-content-between"
              id="myTab3"
              role="tablist"
            >
              <li className="nav-item flex-shrink-0 w-33" role="presentation">
                <button
                  className="nav-link active w-100"
                  id="completed-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#completed-tab-pane"
                  type="button"
                  role="tab"
                  aria-controls="completed-tab-pane"
                  aria-selected="true"
                  style={{
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className="fa-solid fa-circle-check me-2"
                    style={{ color: "#27ae60", fontSize: "16px" }}
                  ></i>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>
                    Completed
                  </span>
                </button>
              </li>
              <li className="nav-item flex-shrink-0 w-33" role="presentation">
                <button
                  className="nav-link d-flex align-items-center justify-content-center w-100"
                  id="cancelled-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#cancelled-tab-pane"
                  type="button"
                  role="tab"
                  aria-controls="cancelled-tab-pane"
                  aria-selected="false"
                  style={{
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className="fa-solid fa-ban me-2"
                    style={{ color: "#e74c3c", fontSize: "16px" }}
                  ></i>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>
                    Cancelled
                  </span>
                </button>
              </li>
              <li className="nav-item flex-shrink-0 w-33" role="presentation">
                <button
                  className="nav-link w-100"
                  id="pending-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#pending-tab-pane"
                  type="button"
                  role="tab"
                  aria-controls="pending-tab-pane"
                  aria-selected="false"
                  style={{
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className="fa-solid fa-clock me-2"
                    style={{ color: "black", fontSize: "16px" }}
                  ></i>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>
                    Pending
                  </span>
                </button>
              </li>
            </ul>
            <div className="tab-content" id="myTabContent3">
              {/* Pending Orders Tab */}
              <div
                className="tab-pane fade"
                id="pending-tab-pane"
                role="tabpanel"
                aria-labelledby="pending-tab"
                tabIndex={0}
              >
                <div className="accordion style-3" id="accordionExamplePending">
                  {Object.keys(pendingOrdersByDate).length > 0 ? (
                    <>
                      <div className="d-flex justify-content-end align-items-center mb-3">
                        <button
                          className="btn btn-sm btn-link text-dark p-0"
                          onClick={
                            Object.values(expandedPendingDates).some((e) => e)
                              ? handleCollapseAllPending
                              : handleExpandAllPending
                          }
                          aria-expanded={Object.values(expandedPendingDates).some((e) => e)}
                        >
                          <span>
                            {Object.values(expandedPendingDates).some((e) => e)
                              ? "Collapse All"
                              : "Expand All"}
                          </span>
                          <i
                            className={`ms-2 fas ${
                              Object.values(expandedPendingDates).some((e) => e)
                                ? "fa-chevron-up"
                                : "fa-chevron-down"
                            }`}
                          ></i>
                        </button>
                      </div>
                      {Object.entries(pendingOrdersByDate).map(([dateKey, dailyData]) => (
                        <div className="accordion-item" key={dateKey}>
                          <h2
                            className="accordion-header"
                            id={"headingPending" + dateKey.replace(/\s/g, "")}
                          >
                            <button
                              className={
                                "btn btn-link w-100 d-flex justify-content-between align-items-center p-0 " +
                                (!expandedPendingDates[dateKey] ? "collapsed" : "")
                              }
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target={"#collapsePending" + dateKey.replace(/\s/g, "")}
                              aria-expanded={expandedPendingDates[dateKey] || false}
                              aria-controls={"collapsePending" + dateKey.replace(/\s/g, "")}
                              onClick={() => togglePendingDateExpansion(dateKey)}
                            >
                              <span className="flex-grow-1 text-start">{dailyData.date}</span>
                              <span className="me-2">{dailyData.orderCount}</span>
                              <i
                                className={`ms-2 fas ${
                                  expandedPendingDates[dateKey]
                                    ? "fa-chevron-up"
                                    : "fa-chevron-down"
                                }`}
                              ></i>
                            </button>
                          </h2>
                          <div
                            id={"collapsePending" + dateKey.replace(/\s/g, "")}
                            className={
                              "accordion-collapse collapse " +
                              (expandedPendingDates[dateKey] ? "show" : "")
                            }
                            aria-labelledby={"headingPending" + dateKey.replace(/\s/g, "")}
                            data-bs-parent="#accordionExamplePending"
                          >
                            <div className="accordion-body">
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
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <NoOrders message="No pending orders" />
                  )}
                </div>
              </div>
              {/* Completed Orders Tab */}
              <div
                className="tab-pane fade show active"
                id="completed-tab-pane"
                role="tabpanel"
                aria-labelledby="completed-tab"
                tabIndex={0}
              >
                <div className="accordion style-3" id="accordionExample3">
                  {orderHistoryError ? (
                    <NoOrders message="No completed orders" />
                  ) : Object.keys(transformedOrders.completedByDate).length >
                    0 ? (
                    <>
                      {/* Expand/Collapse All for Completed Orders */}
                      <div className="d-flex justify-content-end align-items-center mb-3">
                        <button
                          className="btn btn-sm btn-link text-dark p-0"
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
                            className={`ms-2 fas ${
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
                                className={
                                  "btn btn-link w-100 d-flex justify-content-between align-items-center p-0 " +
                                  (!expandedCompletedDates[dateKey]
                                    ? "collapsed"
                                    : "")
                                }
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
                                <span className="flex-grow-1 text-start">
                                  {dailyOrderData.date}
                                </span>
                                <span className="me-2">
                                  {dailyOrderData.orderCount}
                                </span>
                                <i
                                  className={`ms-2 fas ${
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

              {/* Cancelled Orders Tab */}
              <div
                className="tab-pane fade"
                id="cancelled-tab-pane"
                role="tabpanel"
                aria-labelledby="cancelled-tab"
                tabIndex={0}
              >
                <div className="accordion style-3" id="accordionExample2">
                  {isLoadingOrderHistory ? (
                    <div className="text-center py-4">
                      Loading order history...
                    </div>
                  ) : orderHistoryError ? (
                    <NoOrders message="No cancelled orders" />
                  ) : Object.keys(transformedOrders.cancelledByDate).length >
                    0 ? (
                    <>
                      {/* Expand/Collapse All for Cancelled Orders */}
                      <div className="d-flex justify-content-end align-items-center mb-3">
                        <button
                          className="btn btn-sm btn-link text-dark p-0"
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
                            className={`ms-2 fas ${
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
                                className={
                                  "btn btn-link w-100 d-flex justify-content-between align-items-center p-0 " +
                                  (!expandedCancelledDates[dateKey]
                                    ? "collapsed"
                                    : "")
                                }
                                type="button"
                                onClick={() =>
                                  toggleCancelledDateExpansion(dateKey)
                                }
                              >
                                <span className="flex-grow-1 text-start">
                                  {dailyOrderData.date}
                                </span>
                                <span className="me-2">
                                  {dailyOrderData.orderCount}
                                </span>
                                <i
                                  className={`ms-2 fas ${
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
