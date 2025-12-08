import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AuthPrompt from "../components/Auth/AuthPrompt";
import { useCart } from "../contexts/CartContext";
import axios from "axios";
import { API_CONFIG } from "../constants/config";
import { useNavigate } from "react-router-dom";
import { useOutlet } from "../contexts/OutletContext";
import OrderExistsModal from "../components/Modal/variants/OrderExistsModal";
import { useAuth } from "../contexts/AuthContext";
import LazyImage from "../components/Shared/LazyImage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiService from "../api/apiService";
import { useToastContext } from "../components/Toast/ToastContext";
import {ENV} from "../config";

const FooterSummary = React.memo(function FooterSummary({ checkoutDetails }) {
  // Fallback to zeros if no data yet
  const details = checkoutDetails || {
    grand_total: "0.00",
    discount_percent: "0",
    discount_amount: "0.00",
    total_bill_amount: "0.00",
    service_charges_percent: "0",
    service_charges_amount: "0.00",
    gst_percent: "0",
    gst_amount: "0.00",
    final_grand_total: "0.00",
  };

  const totalBill = parseFloat(details.total_bill_amount || 0);
  const discount = parseFloat(details.discount_amount || 0);
  const subtotal = totalBill - discount;

  return (
    <div className="view-title mb-2">
      <ul>
        <li className="py-0">
          <h5>Total</h5>
          <h5>₹{details.total_bill_amount}</h5>
        </li>
        {Number(details.discount_amount) > 0 && (
          <li>
            <span className="text-soft">
              Discount ({details.discount_percent}%)
            </span>
            <span className="text-soft text-success">
              -₹{details.discount_amount}
            </span>
          </li>
        )}
        <li>
          <span className="text-soft">Subtotal</span>
          <span className="text-soft">₹{subtotal.toFixed(2)}</span>
        </li>

        <li>
          <span className="text-soft">
            Service Charge ({details.service_charges_percent}%)
          </span>
          <span className="text-soft">+₹{details.service_charges_amount}</span>
        </li>
        <li>
          <span className="text-soft">GST ({details.gst_percent}%)</span>
          <span className="text-soft">+₹{details.gst_amount}</span>
        </li>
        <li>
          <h5>Grand Total</h5>
          <h5>₹{details.final_grand_total}</h5>
        </li>
      </ul>
    </div>
  );
});

// Extracted authenticated content component
function CheckoutContent() {
  // Move ALL hooks to the top
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    getCartCount,
    clearCart,
  } = useCart();
  const { outletId, sectionId, outletDetails } = useOutlet();
  const { getAccessToken } = useAuth();
  const navigate = useNavigate();
  const [existingOrderModal, setExistingOrderModal] = useState({
    isOpen: false,
    orderDetails: null,
  });
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { addToast } = useToastContext();
  const queryClient = useQueryClient();

  // Keep all your handlers and effects here

  // Calculate subtotal
  // const subtotal = getCartTotal();

  // Calculate tax (2%)
  // const taxRate = 0.02;
  // const taxAmount = subtotal * taxRate;

  // Calculate final total
  // const total = subtotal - taxAmount;

  const handleQuantityChange = (menuId, portionId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(menuId, portionId);
    } else {
      updateQuantity(menuId, portionId, newQuantity);
    }
  };

  // Transform cart items for API
  const getOrderItems = () => {
    return cartItems.map((item) => ({
      menu_id: item.menuId,
      portion_id: item.portionId,
      quantity: item.quantity,
    }));
  };

  // React Query for checkout details
  const {
    data: checkoutDetails,
    isLoading: detailsLoading,
    error: checkoutError,
  } = useQuery({
    queryKey: ["checkout", outletId, cartItems],
    queryFn: () =>
      apiService.checkout.getDetails({
        outletId,
        orderItems: getOrderItems(),
      }),
    enabled: !!outletId && cartItems.length > 0,
    retry: 2,
    onError: (err) => {
      if (err.response?.status === 401) {
        addToast({
          message: "Session expired. Please login again.",
          type: "error",
        });
      } else {
        addToast({
          message: "Failed to fetch checkout details",
          type: "error",
        });
      }
    },
  });

  // Remove item handler
  const handleRemoveItem = (menuId, portionId) => {
    // Remove from context
    removeFromCart(menuId, portionId);

    // Remove from localStorage if you store cart there
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const updatedCart = cart.filter(
      (item) => !(item.menuId === menuId && item.portionId === portionId)
    );
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // Add to existing order mutation
  const addToExistingMutation = useMutation({
    mutationFn: async (variables) => {
      const result = await apiService.checkout.addToExistingOrder(variables);
      return result;
    },
    onSuccess: () => {
      clearCart();
      localStorage.removeItem("cart");
      
      // Invalidate and refetch orders data
      queryClient.invalidateQueries({ queryKey: ['ongoingOrders'] });
      queryClient.invalidateQueries({ queryKey: ['orderHistory'] });
      
      addToast({
        message: "Items added to existing order successfully!",
        type: "success",
      });
      navigate("/orders");
      handleModalClose();
    },
    onError: (error) => {
      console.error("Error adding to existing order:", error);
      addToast({
        message: error.message || "Failed to add to existing order",
        type: "error",
      });
    },
  });

  // Cancel existing and create new order mutation
  const cancelAndCreateNewMutation = useMutation({
    mutationFn: async (variables) => {
      const result = await apiService.checkout.cancelExistingAndCreateNew(
        variables
      );
      return result;
    },
    onSuccess: (data) => {
      clearCart();
      localStorage.removeItem("cart");
      
      // Invalidate and refetch orders data
      queryClient.invalidateQueries({ queryKey: ['ongoingOrders'] });
      queryClient.invalidateQueries({ queryKey: ['orderHistory'] });
      
      addToast({
        message: `Order cancelled and new order #${data.order_number} created successfully!`,
        type: "success",
      });
      navigate("/orders");
      handleModalClose();
    },
    onError: (error) => {
      console.error("Error cancelling order:", error);
      addToast({
        message:
          error.message || "Failed to cancel existing order and create new one",
        type: "error",
      });
    },
  });

  // Modify the createOrder function to handle errors without re-throwing
  const createOrder = async () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth"));
      const accessToken = auth?.accessToken;
      const userId = auth?.userId;

      const orderItems = cartItems.map((item) => ({
        menu_id: item.menuId,
        quantity: item.quantity,
        portion_name: item.portionName.toLowerCase(),
        comment: item.comment || "", // Add the comment field here
      }));

      // Get order settings from localStorage
      const orderSettings = localStorage.getItem("orderSettings");
      const orderType = orderSettings
        ? JSON.parse(orderSettings).order_type
        : null;

      // Base payload
      const payload = {
        outlet_id: String(outletId),
        user_id: String(userId),
        section_id: String(sectionId),
        order_type: orderType || "dine-in", // Fallback to takeaway if no order type
        order_items: orderItems,
        action: "create_order",
        app_source: "user_app",
      };

      // Add coupon code to payload if a valid coupon is applied
      if (couponStatus?.success && couponStatus?.couponDetails?.code) {
        payload.coupon = couponStatus.couponDetails.code;
      }

      // Add table_id only for dine-in orders
      if (orderType === "dine-in") {
        const tableId =
          outletDetails?.tableId || localStorage.getItem("tableId");
        if (tableId) {
          payload.table_id = String(tableId);
        }
      }

      const response = await axios.post(
        `${ENV.V2_COMMON_BASE}/common/create_order`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response.data?.order_id) {
        clearCart();
        localStorage.removeItem("cart");
        navigate(`/orders`);
        return true; // Indicate success
      }
      return false; // Indicate failure
    } catch (error) {
      // Handle error here and show toast
      if (error.response?.status === 400) {
        const errorMessage =
          error.response.data?.detail ||
          error.response.data?.message ||
          "Failed to create order";
        addToast({ message: errorMessage, type: "error" });
      } else {
        addToast({
          message: "An unexpected error occurred. Please try again.",
          type: "error",
        });
      }
      return false; // Indicate failure
    }
  };

  // Modify handleCheckout to not show duplicate error messages
  const handleCheckout = async () => {
    // Validate comments
    for (const item of cartItems) {
      if (
        item.comment &&
        (item.comment.length < 5 || item.comment.length > 50)
      ) {
        addToast({
          message: "Comment must be between 5 and 50 characters.",
          type: "error",
        });
        return;
      }
    }
    try {
      setCheckoutLoading(true);

      const auth = JSON.parse(localStorage.getItem("auth"));
      const accessToken = auth?.accessToken;
      const userId = auth?.userId;

      if (!accessToken || !userId) {
        addToast({ message: "Authentication required", type: "error" });
        return;
      }

      const existingOrder = await apiService.checkout.checkExistingOrder({
        userId,
        outletId,
      });

      if (existingOrder) {
        setExistingOrderModal({
          isOpen: true,
          orderDetails: {
            ...existingOrder,
            order_id: existingOrder.order_id,
          },
        });
        return;
      }

      // Create order and only show success message if it succeeds
      const orderCreated = await createOrder();
      if (orderCreated) {
        addToast({ message: "Order placed successfully!", type: "success" });
      }
    } catch (err) {
      // Only handle non-order creation errors here
      if (err.response?.status === 401) {
        addToast({
          message: "Session expired. Please login again.",
          type: "error",
        });
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Add handlers for modal actions
  const handleModalClose = () => {
    setExistingOrderModal({
      isOpen: false,
      orderDetails: null,
    });
  };

  const handleCancelExisting = async () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth"));
      const userId = auth?.userId;

      if (!userId) {
        addToast({ message: "Authentication required", type: "error" });
        return;
      }

      const orderItems = cartItems.map((item) => ({
        menu_id: item.menuId.toString(),
        quantity: item.quantity,
        portion_name: item.portionName.toLowerCase(),
      }));

      await cancelAndCreateNewMutation.mutateAsync({
        orderId: existingOrderModal.orderDetails.order_id,
        userId,
        outletId,
        sectionId,
        tableId: localStorage.getItem("tableId"),
        orderItems,
      });
    } catch (error) {
      console.error("Cancel existing order error:", error);
    }
  };

  const handleAddToExisting = async () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth"));
      const userId = auth?.userId;

      if (!userId) {
        addToast({ message: "Authentication required", type: "error" });
        return;
      }

      const orderItems = cartItems.map((item) => ({
        menu_id: item.menuId,
        portion_id: item.portionId,
        quantity: item.quantity,
        comment: item.comment || "",
      }));

      await addToExistingMutation.mutateAsync({
        orderId: existingOrderModal.orderDetails.order_id,
        userId: userId.toString(),
        outletId: outletId.toString(),
        orderItems,
      });
    } catch (error) {
      console.error("Add to existing order error:", error);
    }
  };

  // Coupon input handler: only allow capital letters and numbers
  const handleCouponInput = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setCouponCode(value);
  };

  // Coupon verify handler
  const handleVerifyCoupon = async () => {
    setCouponLoading(true);
    setCouponStatus(null);
    try {
      const accessToken = getAccessToken();
      const response = await axios.post(
        `${ENV.V2_COMMON_BASE}/v2/common/verify_coupon`,
        {
          coupon_code: couponCode,
          app_source: "user_App",
          outlet_id: String(outletId),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response.data?.detail) {
        const { detail, discount_type, discount_value } = response.data;
        const discountText =
          discount_type === "amount"
            ? `₹${discount_value}`
            : `${discount_value}%`;

        setCouponStatus({
          success: true,
          message: `${detail} - You will get ${discountText} off!`,
          couponDetails: {
            code: response.data.coupon_code,
            type: discount_type,
            value: discount_value,
          },
        });
      } else {
        setCouponStatus({
          success: false,
          message: "Invalid coupon code.",
        });
      }
    } catch (err) {
      setCouponStatus({
        success: false,
        message:
          err.response?.data?.detail || "Invalid coupon or network error.",
      });
    } finally {
      setCouponLoading(false);
    }
  };

  // Instead of early returns, use conditional rendering in the return statement
  return (
    <>
      {cartItems.length === 0 ? (
        // Empty cart view
        <div className="page-content">
          <div className="content-inner pt-0">
            <div className="container p-b20">
              <div
                className="d-flex align-items-center justify-content-center"
                style={{ minHeight: "calc(100vh - 300px)" }}
              >
                <div className="text-center">
                  <div className="mb-4">
                    <i
                      className="fa-solid fa-shopping-cart"
                      style={{
                        fontSize: 80,
                        opacity: 0.5,
                        color: "#6c757d",
                      }}
                    ></i>
                  </div>
                  <h5 className="mb-3">Your cart is empty</h5>
                  <p className="text-muted mb-4">
                    Add some items to your cart to get started
                  </p>
                  <button
                    className="btn btn-primary px-4 py-3"
                    style={{ borderRadius: 12, fontWeight: 500 }}
                    onClick={() => navigate("/")}
                  >
                    Go to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Main checkout view
        <div
          className="page-content"
          style={{
            // background: "#f7f8fa",
            minHeight: "100vh",
          }}
        >
          <div
            className="container bottom-content pt-0"
            style={{ paddingBottom: "40px" }}
          >
            {/* Menu/Cart Items List */}
            <div className="item-list style-2">
              <ul className="list-unstyled">
                {cartItems.length === 0 ? (
                  <div
                    className="d-flex flex-column justify-content-center align-items-center"
                    style={{
                      minHeight: "60vh", // Adjust as needed for your header/footer
                      width: "100%",
                      // background: '#fcfbfc'
                    }}
                  >
                    {/* Cart SVG Icon */}
                    <i
                      className="fa-solid fa-shopping-cart"
                      style={{
                        fontSize: 64,
                        color: "#adb5bd",
                      }}
                    ></i>
                    <span
                      className="text-muted fs-5 mt-3 mb-2"
                      style={{ color: "#b0b3b8" }}
                    >
                      Your cart is empty
                    </span>
                    <button
                      className="btn btn-outline-success px-4 py-3 mt-4"
                      style={{ borderRadius: 12, fontWeight: 500 }}
                      onClick={() => navigate("/")}
                    >
                      Go to Home
                    </button>
                  </div>
                ) : (
                  cartItems.map((item) => {
                    const menuCatId = item.menu_cat_id || item.category_id;
                    return (
                      <li
                        key={`${item.menuId}-${item.portionId}`}
                        className="mb-3 border-0"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          if (!menuCatId) {
                            addToast({
                              message: "No menu_cat_id found for this item!",
                              type: "error",
                            });
                            return;
                          }
                          navigate(
                            `/product-detail/${item.menuId}/${menuCatId}`
                          );
                        }}
                      >
                        <div
                          className="rounded-4 shadow-lg position-relative p-3 border-3"
                          style={{ minHeight: 90 }}
                        >
                          {/* Remove button in top right */}
                          <button
                            type="button"
                            className="btn p-0 rounded-3xl border-0 bg-transparent shadow-none position-absolute"
                            aria-label="Remove"
                            style={{
                              top: 12,
                              right: 16,
                              fontSize: 22,
                              color: "#b0b3b8",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveItem(item.menuId, item.portionId);
                            }}
                          >
                            ×
                          </button>
                          <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center mb-1">
                                <h5
                                  className="mb-0"
                                  style={{ fontWeight: 600 }}
                                >
                                  {item.menuName}
                                </h5>
                                {/* Add offer display */}
                                {item.offer && (
                                  <span
                                    className="badge bg-success-subtle text-success ms-2"
                                    style={{
                                      fontSize: 12,
                                      padding: "4px 8px",
                                      borderRadius: 12,
                                      fontWeight: 500,
                                    }}
                                  >
                                    {item.offer}% OFF
                                  </span>
                                )}
                              </div>
                              <div className="d-flex align-items-center mb-1">
                                <span
                                  className="text-success me-2"
                                  style={{
                                    fontSize: 15,
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <i
                                    className="fa-solid fa-utensils me-1"
                                    style={{ fontSize: 15, color: "#19b955" }}
                                  ></i>
                                  {item.portionName}
                                </span>
                              </div>

                              {/* Add Special Instructions/Comment display */}
                              {item.comment && (
                                <div className="d-flex align-items-center mb-2">
                                  <span
                                    className="text-muted"
                                    style={{
                                      fontSize: 13,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    <i
                                      className="fa-solid fa-message-lines"
                                      style={{
                                        fontSize: 12,
                                        color: "#6c757d",
                                      }}
                                    ></i>
                                    <span
                                      style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        lineHeight: "1.2",
                                      }}
                                    >
                                      {item.comment}
                                    </span>
                                  </span>
                                </div>
                              )}

                              <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                  <span
                                    className="fw-bold"
                                    style={{ color: "#2196f3", fontSize: 18 }}
                                  >
                                    ₹
                                    {parseFloat(item.price).toFixed(2) ||
                                      "0.00"}
                                  </span>
                                  {item.offer > 0 && (
                                    <>
                                      <span
                                        className="ms-2 text-muted"
                                        style={{
                                          textDecoration: "line-through",
                                          fontSize: 16,
                                        }}
                                      >
                                        ₹
                                        {item.originalPrice ||
                                          (
                                            item.price /
                                            (1 - item.offer / 100)
                                          ).toFixed(2)}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <div className="d-flex flex-column align-items-end gap-1">
                                  {/* {item.offer > 0 && (
                                    <span
                                      className="text-success fw-bold mb-1"
                                      style={{ fontSize: 16 }}
                                    >
                                      {item.offer}% Off
                                    </span>
                                  )} */}
                                  <div className="bg-light rounded-pill d-flex align-items-center px-2 py-1">
                                    <button
                                      className="btn rounded-3xl btn-link p-0 m-0"
                                      style={{
                                        color: "#222",
                                        fontSize: 20,
                                        minWidth: 28,
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuantityChange(
                                          item.menuId,
                                          item.portionId,
                                          item.quantity - 1
                                        );
                                      }}
                                    >
                                      –
                                    </button>
                                    <span
                                      className="mx-2"
                                      style={{
                                        minWidth: 18,
                                        textAlign: "center",
                                        fontWeight: 500,
                                      }}
                                    >
                                      {item.quantity}
                                    </span>
                                    <button
                                      className="btn btn-link p-0 m-0"
                                      style={{
                                        color: "#222",
                                        fontSize: 20,
                                        minWidth: 28,
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuantityChange(
                                          item.menuId,
                                          item.portionId,
                                          item.quantity + 1
                                        );
                                      }}
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
            {/* Summary Card */}
            {cartItems.length > 0 && (
              <>
                <div
                  className="rounded-4 shadow-sm p-3 mb-3"
                  style={{ border: "1px solid #e0e0e0", marginTop: 24 }}
                >
                  {/* Remove the loading spinner - show content immediately */}
                  {checkoutError ? (
                    <div className="text-center text-danger py-3">
                      Failed to load checkout details. Please try again.
                    </div>
                  ) : (
                    <>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold" style={{ fontSize: 18 }}>
                          Total
                        </span>
                        <span className="fw-bold" style={{ fontSize: 18 }}>
                          ₹{checkoutDetails?.total_bill_amount || getCartTotal().toFixed(2)}
                        </span>
                      </div>
                      <hr className="my-2" style={{ borderColor: "#e0e0e0" }} />
                      
                      {/* Regular Discount */}
                      <div
                        className="d-flex justify-content-between align-items-center mb-1"
                        style={{ color: "#b0b3b8" }}
                      >
                        <span>
                          Discount ({checkoutDetails?.discount_percent || 0}%)
                        </span>
                        <span>
                          -₹{checkoutDetails?.discount_amount || "0.00"}
                        </span>
                      </div>

                      {/* Add Coupon Discount Line - Only show when coupon is successfully applied */}
                      {couponStatus?.success && (
                        <div
                          className="d-flex justify-content-between align-items-center mb-1"
                          style={{ color: "#b0b3b8" }}
                        >
                          <span>
                            Coupon Discount ({couponStatus.couponDetails.code})
                          </span>
                          <span>
                            -₹{couponStatus.couponDetails.value.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Subtotal after discounts */}
                      <div
                        className="d-flex justify-content-between align-items-center mb-1"
                        style={{ color: "#b0b3b8" }}
                      >
                        <span>Subtotal</span>
                        <span>
                          ₹
                          {checkoutDetails ? (
                            (
                              parseFloat(checkoutDetails.total_bill_amount || 0) -
                              parseFloat(checkoutDetails.discount_amount || 0) -
                              (couponStatus?.success
                                ? parseFloat(couponStatus.couponDetails.value)
                                : 0)
                            ).toFixed(2)
                          ) : (
                            getCartTotal().toFixed(2)
                          )}
                        </span>
                      </div>

                      {/* Service Charges and GST sections */}
                      <div
                        className="d-flex justify-content-between align-items-center mb-1"
                        style={{ color: "#b0b3b8" }}
                      >
                        <span>
                          Service Charges ({checkoutDetails?.service_charges_percent || 0}%)
                        </span>
                        <span>
                          +₹{checkoutDetails?.service_charges_amount || "0.00"}
                        </span>
                      </div>
                      <div
                        className="d-flex justify-content-between align-items-center mb-1"
                        style={{ color: "#b0b3b8" }}
                      >
                        <span>GST ({checkoutDetails?.gst_percent || 0}%)</span>
                        <span>+₹{checkoutDetails?.gst_amount || "0.00"}</span>
                      </div>
                      <hr className="my-2" style={{ borderColor: "#e0e0e0" }} />
                      
                      {/* Grand Total with coupon discount */}
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold" style={{ fontSize: 18 }}>
                          Grand Total
                        </span>
                        <span className="fw-bold" style={{ fontSize: 18 }}>
                          ₹
                          {checkoutDetails ? (
                            (
                              parseFloat(checkoutDetails.final_grand_total || 0) -
                              (couponStatus?.success
                                ? parseFloat(couponStatus.couponDetails.value)
                                : 0)
                            ).toFixed(2)
                          ) : (
                            getCartTotal().toFixed(2)
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Apply Coupon UI */}
                <div className="mt-2 mb-4">
                  <label className="mb-1 fw-semibold" style={{ fontSize: 15 }}>
                    Apply Coupon
                  </label>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={handleCouponInput}
                      maxLength={20}
                      style={{ textTransform: "uppercase", fontWeight: 500 }}
                      autoComplete="off"
                    />
                    <button
                      className="btn"
                      style={{
                        background: "#b6d4fe",
                        color: "#222",
                        fontWeight: 500,
                        minWidth: 70,
                        borderRadius: 8,
                      }}
                      onClick={handleVerifyCoupon}
                      disabled={!couponCode || couponLoading}
                    >
                      {couponLoading ? "..." : "Verify"}
                    </button>
                  </div>
                  {couponStatus && (
                    <div
                      className={`mt-2 fw-semibold ${
                        couponStatus.success ? "text-success" : "text-danger"
                      }`}
                      style={{ fontSize: 14 }}
                    >
                      {couponStatus.message}
                    </div>
                  )}
                  <hr className="mt-3 mb-0" />
                </div>

                <div className="d-flex justify-content-center mb-4">
                  <button
                    className="btn"
                    style={{
                      background: "#19b955",
                      color: "#fff",
                      borderRadius: 30,
                      fontWeight: 600,
                      fontSize: 20,
                      minWidth: 280,
                      boxShadow: "0 2px 8px rgba(25,185,85,0.15)",
                    }}
                    onClick={handleCheckout}
                    disabled={
                      detailsLoading ||
                      checkoutLoading ||
                      cartItems.length === 0
                    }
                  >
                    {checkoutLoading ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        Place Order{" "}
                        <span
                          style={{
                            color: "#b6f5d1",
                            fontSize: 16,
                            fontWeight: 500,
                            marginLeft: 4,
                          }}
                        >
                          ({getCartCount()} Items)
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <OrderExistsModal
        isOpen={existingOrderModal.isOpen}
        onClose={handleModalClose}
        orderNumber={existingOrderModal.orderDetails?.order_number}
        orderStatus={existingOrderModal.orderDetails?.order_status}
        onCancelExisting={handleCancelExisting}
        onAddToExisting={handleAddToExisting}
        isLoading={
          addToExistingMutation.isPending ||
          cancelAndCreateNewMutation.isPending
        }
      />
    </>
  );
}

function Checkout() {
  const { user } = useAuth();

  return (
    <>
      <Header />
      {!user ? (
        <AuthPrompt variant="checkout" />
      ) : (
        <CheckoutContent />
      )}
      <Footer />
    </>
  );
}

export default Checkout;
