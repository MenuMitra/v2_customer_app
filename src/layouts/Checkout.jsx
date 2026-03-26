import { useMemo, useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AuthPrompt from "../components/Auth/AuthPrompt";
import { useCart } from "../contexts/CartContext";
import axios from "axios";

import { useNavigate, useLocation } from "react-router-dom";
import { useOutlet } from "../contexts/OutletContext";
import OrderExistsModal from "../components/Modal/variants/OrderExistsModal";
import { useAuth } from "../contexts/AuthContext";
import LazyImage from "../components/Shared/LazyImage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiService from "../api/apiService";
import { useToastContext } from "../components/Toast/ToastContext";
import { ENV } from "../config";

const FooterSummary = function FooterSummary({ checkoutDetails }) {
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
            <span className="text-gray-500">
              Discount ({details.discount_percent}%)
            </span>
            <span className="text-gray-500 text-green-600">
              -₹{details.discount_amount}
            </span>
          </li>
        )}
        <li>
          <span className="text-gray-500">Subtotal</span>
          <span className="text-gray-500">₹{subtotal.toFixed(2)}</span>
        </li>

        <li>
          <span className="text-gray-500">
            Service Charge ({details.service_charges_percent}%)
          </span>
          <span className="text-gray-500">+₹{details.service_charges_amount}</span>
        </li>
        <li>
          <span className="text-gray-500">GST ({details.gst_percent}%)</span>
          <span className="text-gray-500">+₹{details.gst_amount}</span>
        </li>
        <li>
          <h5>Grand Total</h5>
          <h5>₹{details.final_grand_total}</h5>
        </li>
      </ul>
    </div>
  );
};

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
  const location = useLocation();
  const activeOrderId = (() => {
    try {
      return localStorage.getItem("activeOrderId");
    } catch {
      return null;
    }
  })();
  const activeUserId = (() => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "null");
      return auth?.userId ?? null;
    } catch {
      return null;
    }
  })();

  console.log('CheckoutContent Render:', {
    cartItemsCount: cartItems.length,
    cartItems: cartItems,
    outletId,
    sectionId,
    outletDetails
  });

  // Check for existing order in location state on mount
  useEffect(() => {
    if (location.state?.existingOrder) {
      setExistingOrderModal({
        isOpen: true,
        orderDetails: location.state.existingOrder,
      });
      // Clear state to prevent modal from reopening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

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
    return cartItems.map((item) => {
      const portionId = item.portionId ?? null;
      const portionName =
        item.portionName && typeof item.portionName === "string"
          ? item.portionName
          : "Default";
      const payload = {
        menu_id: Number(item.menuId),
        quantity: Number(item.quantity),
        // Backend pricing requires portion_name even when portion_id is 0/omitted.
        portion_name: portionName,
        comment: item.comment || "",
      };

      // Backend billing doesn't recognize our fallback portion_id=0.
      // When portion id is missing/0, omit it and let backend decide pricing defaults via portion_name.
      if (portionId !== null && portionId !== undefined && Number(portionId) !== 0) {
        payload.portion_id = Number(portionId);
      }

      return payload;
    });
  };

  // Checkout can be opened directly; OutletContext may not be ready yet.
  // Fall back to the outlet_id stored on cart items so billing API can still run.
  const storedOutletId = (() => {
    try {
      const stored = localStorage.getItem("selectedOutlet");
      const parsed = stored ? JSON.parse(stored) : null;
      return parsed?.outletId ?? null;
    } catch {
      return null;
    }
  })();

  const effectiveOutletId =
    outletId || cartItems?.[0]?.outlet_id || storedOutletId;

  const orderItems = useMemo(() => getOrderItems(), [cartItems]);

  // React Query for checkout details
  const {
    data: checkoutDetails,
    isLoading: detailsLoading,
    error: checkoutError,
  } = useQuery({
    queryKey: ["checkout", effectiveOutletId, orderItems],
    queryFn: () =>
      apiService.checkout.getDetails({
        outletId: effectiveOutletId,
        orderItems,
      }),
    enabled: !!effectiveOutletId && cartItems.length > 0,
    initialData: location.state?.checkoutPreview,
    staleTime: 0,
    refetchOnMount: "always",
    retry: 2,
    onError: (err) => {
      if (err?.status === 401 || err?.response?.status === 401) {
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

  const shouldFallbackToOrderDetails =
    checkoutError?.status === 400 &&
    typeof checkoutError?.detail === "string" &&
    checkoutError.detail.toLowerCase().includes("no price info");

  const {
    data: fallbackOrderDetails,
    isLoading: fallbackLoading,
    error: fallbackError,
  } = useQuery({
    queryKey: ["orderDetailsForCheckout", activeOrderId, activeUserId],
    queryFn: () =>
      apiService.checkout.getOrderDetails({
        orderId: activeOrderId,
        userId: activeUserId,
      }),
    enabled: !!activeOrderId && !!activeUserId && shouldFallbackToOrderDetails,
    retry: 1,
  });

  const effectiveCheckoutDetails =
    (fallbackOrderDetails?.order_details
      ? {
          ...fallbackOrderDetails.order_details,
          // Normalize to same key names used by checkout summary UI
          total_bill_amount: String(
            fallbackOrderDetails.order_details.total_bill_amount ?? "0.00"
          ),
          total_bill_with_discount: String(
            fallbackOrderDetails.order_details.total_bill_with_discount ?? "0.00"
          ),
          service_charges_percent: String(
            fallbackOrderDetails.order_details.service_charges_percent ?? "0"
          ),
          service_charges_amount: String(
            fallbackOrderDetails.order_details.service_charges_amount ?? "0.00"
          ),
          gst_percent: String(fallbackOrderDetails.order_details.gst_percent ?? "0"),
          gst_amount: String(fallbackOrderDetails.order_details.gst_amount ?? "0.00"),
          discount_percent: String(
            fallbackOrderDetails.order_details.discount_percent ?? "0"
          ),
          discount_amount: String(
            fallbackOrderDetails.order_details.discount_amount ?? "0.00"
          ),
          grand_total: String(fallbackOrderDetails.order_details.grand_total ?? "0.00"),
          final_grand_total: String(
            fallbackOrderDetails.order_details.final_grand_total ?? "0.00"
          ),
        }
      : null) || checkoutDetails;

  // Remove item handler
  const handleRemoveItem = (menuId, portionId) => {
    // Remove from context
    removeFromCart(menuId, portionId);

    // Remove from localStorage if you store cart there
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const updatedCart = cart.filter(
      (item) => !(item.menuId == menuId && item.portionId == portionId)
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
        portion_name: item.portionName?.toLowerCase() || "",
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
      if (payload.order_type === "dine-in") {
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
        try {
          localStorage.setItem(
            "activeOrderId",
            String(response.data.order_id)
          );
        } catch {
          // ignore storage errors
        }
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

      const effectiveSectionId =
        sectionId || localStorage.getItem("sectionId") || "";
      const effectiveTableId =
        outletDetails?.tableId || localStorage.getItem("tableId") || "";

      const existingOrder = await apiService.checkout.checkExistingOrder({
        userId,
        outletId,
        sectionId: effectiveSectionId,
        tableId: effectiveTableId,
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
        portion_name: item.portionName?.toLowerCase() || "",
        comment: item.comment || "",
      }));

      // Get order settings from localStorage
      const orderSettings = localStorage.getItem("orderSettings");
      const orderType = orderSettings
        ? JSON.parse(orderSettings).order_type
        : "dine-in";

      await cancelAndCreateNewMutation.mutateAsync({
        orderId: existingOrderModal.orderDetails.order_id,
        userId: userId.toString(),
        outletId: outletId.toString(),
        sectionId: sectionId.toString(),
        tableId: localStorage.getItem("tableId") || "",
        orderType: orderType,
        orderItems,
        appSource: "user_app",
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
        `${ENV.V2_COMMON_BASE}/common/verify_coupon`,
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
            <div className="container mx-auto pb-5">
              <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
                <div className="text-center">
                  <div className="mb-4">
                    <i className="fa-solid fa-shopping-cart text-[80px] opacity-50 text-gray-600"></i>
                  </div>
                  <h5 className="mb-3 text-lg font-semibold">Your cart is empty</h5>
                  <p className="text-gray-500 mb-4">
                    Add some items to your cart to get started
                  </p>
                  <button
                    className="px-4 py-3 bg-green-700 text-white rounded-3xl font-medium hover:bg-green-900 transition-colors"
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
        <div className="page-content min-h-screen">
          {/* Desktop body scroll is unreliable in this template; use an explicit scroll container */}
          <div className="max-h-[calc(100vh-140px)] overflow-y-auto overscroll-contain pb-[220px]">
            {/* IMPORTANT: don't use `bottom-content` here (it sets overflow:hidden in CSS) */}
            <div className="container mx-auto pt-0 pb-10">
            {/* Menu/Cart Items List */}
            <div className="item-list style-2 cart-items-container">
              <ul className="list-none p-0 cart-items-list">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col justify-center items-center min-h-[60vh] w-full">
                    {/* Cart SVG Icon */}
                    <i className="fa-solid fa-shopping-cart text-[64px] text-gray-400"></i>
                    <span className="text-gray-500 text-xl mt-3 mb-2">
                      Your cart is empty
                    </span>
                    <button
                      className="px-4 py-3 mt-4 border border-green-600 text-green-600 bg-white rounded-xl font-medium hover:bg-green-50 transition-colors"
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
                        className="mb-3 border-0 cursor-pointer cart-item"
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
                        <div className="rounded-2xl shadow-lg relative p-3 border-2 min-h-[90px]">
                          {/* Remove button in top right */}
                          <button
                            type="button"
                            className="p-0 rounded-full border-0 bg-transparent shadow-none absolute top-3 right-4 text-[22px] text-gray-400 hover:text-gray-600"
                            aria-label="Remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveItem(item.menuId, item.portionId);
                            }}
                          >
                            ×
                          </button>
                          <div className="flex items-center">
                            <div className="flex-grow">
                              <div className="flex items-center mb-1">
                                <h5 className="mb-0 font-semibold">
                                  {item.menuName}
                                </h5>
                                {/* Add offer display */}
                                {item.offer && (
                                  <span className="inline-block bg-green-100 text-green-600 ml-2 text-xs px-2 py-1 rounded-xl font-medium">
                                    {item.offer}% OFF
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center mb-1">
                                <span className="text-green-600 mr-2 text-[15px] flex items-center">
                                  <i className="fa-solid fa-utensils mr-1 text-[15px] text-[#19b955]"></i>
                                  {item.portionName}
                                </span>
                              </div>

                              {/* Add Special Instructions/Comment display */}
                              {item.comment && (
                                <div className="flex items-center mb-2">
                                  <span className="text-gray-500 text-[13px] flex items-center gap-1">
                                    <i className="fa-solid fa-message-lines text-xs text-gray-600"></i>
                                    <span className="overflow-hidden text-ellipsis line-clamp-2 leading-tight">
                                      {item.comment}
                                    </span>
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="font-bold text-[#2196f3] text-lg">
                                    ₹
                                    {parseFloat(item.price).toFixed(2) ||
                                      "0.00"}
                                  </span>
                                  {item.offer > 0 && (
                                    <>
                                      <span className="ml-2 text-gray-500 line-through text-base">
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
                                <div className="flex flex-col items-end gap-1">
                                  <div className="bg-gray-100 rounded-full flex items-center px-2 py-1">
                                    <button
                                      className="p-0 m-0 text-gray-900 text-xl min-w-[28px] bg-transparent border-0 hover:text-gray-700"
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
                                    <span className="mx-2 min-w-[18px] text-center font-medium">
                                      {item.quantity}
                                    </span>
                                    <button
                                      className="p-0 m-0 text-gray-900 text-xl min-w-[28px] bg-transparent border-0 hover:text-gray-700"
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
                <div className="rounded-2xl shadow-sm p-3 mb-3 border border-gray-300 mt-6">
                  {checkoutError && !effectiveCheckoutDetails ? (
                    <div className="text-center text-danger py-3">
                      Failed to load checkout details. Please try again.
                    </div>
                  ) : (detailsLoading || fallbackLoading) && !effectiveCheckoutDetails ? (
                    <div className="py-3 text-center text-gray-500">
                      Calculating bill summary...
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const parseMoney = (v) => {
                          const n = Number(v);
                          return Number.isFinite(n) ? n : 0;
                        };
                        const fmt = (n) => parseMoney(n).toFixed(2);

                        const totalBill = effectiveCheckoutDetails
                          ? parseMoney(effectiveCheckoutDetails.total_bill_amount)
                          : parseMoney(getCartTotal());
                        const discountAmount = effectiveCheckoutDetails
                          ? parseMoney(effectiveCheckoutDetails.discount_amount)
                          : 0;
                        const totalAfterDiscount = effectiveCheckoutDetails
                          ? (effectiveCheckoutDetails.total_bill_with_discount != null
                            ? parseMoney(effectiveCheckoutDetails.total_bill_with_discount)
                            : Math.max(0, totalBill - discountAmount))
                          : Math.max(0, totalBill - discountAmount);
                        const serviceCharge = effectiveCheckoutDetails
                          ? parseMoney(effectiveCheckoutDetails.service_charges_amount)
                          : 0;
                        const gstAmount = effectiveCheckoutDetails
                          ? parseMoney(effectiveCheckoutDetails.gst_amount)
                          : 0;

                        // Prefer API grand_total/final_grand_total if present, otherwise derive.
                        const apiGrandTotal = effectiveCheckoutDetails?.grand_total;
                        const grandTotal = apiGrandTotal != null
                          ? parseMoney(apiGrandTotal)
                          : totalAfterDiscount + serviceCharge;

                        const apiFinal = effectiveCheckoutDetails?.final_grand_total;
                        const finalPayable = apiFinal != null
                          ? parseMoney(apiFinal)
                          : grandTotal + gstAmount;

                        const couponDiscount = couponStatus?.success
                          ? parseMoney(couponStatus.couponDetails.value)
                          : 0;

                        const payableAfterCoupon = Math.max(0, finalPayable - couponDiscount);

                        return (
                          <>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg">Total Bill Amount</span>
                        <span className="font-bold text-lg">
                          ₹{fmt(totalBill)}
                        </span>
                      </div>
                      <hr className="my-2 border-gray-300" />

                      {/* Offer/Discount */}
                      <div className="flex justify-between items-center mb-1 text-[#b0b3b8]">
                        <span>
                          Discount ({effectiveCheckoutDetails?.discount_percent ?? effectiveCheckoutDetails?.offer ?? 0}%)
                        </span>
                        <span>-₹{fmt(discountAmount)}</span>
                      </div>

                      {/* Add Coupon Discount Line - Only show when coupon is successfully applied */}
                      {couponStatus?.success && (
                        <div className="flex justify-between items-center mb-1 text-[#b0b3b8]">
                          <span>
                            Coupon Discount ({couponStatus.couponDetails.code})
                          </span>
                          <span>
                            -₹{couponStatus.couponDetails.value.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Total after discount */}
                      <div className="flex justify-between items-center mb-1 text-[#b0b3b8]">
                        <span>Total after discount</span>
                        <span>₹{fmt(totalAfterDiscount)}</span>
                      </div>

                      {/* Service Charges */}
                      <div className="flex justify-between items-center mb-1 text-[#b0b3b8]">
                        <span>
                          Service Charges ({effectiveCheckoutDetails?.service_charges_percent || 0}%)
                        </span>
                        <span>
                          +₹{fmt(serviceCharge)}
                        </span>
                      </div>

                      {/* Grand Total (before GST) */}
                      <div className="flex justify-between items-center mb-1 text-[#b0b3b8]">
                        <span>Grand Total</span>
                        <span>₹{fmt(grandTotal)}</span>
                      </div>

                      {/* GST */}
                      <div className="flex justify-between items-center mb-1 text-[#b0b3b8]">
                        <span>GST ({effectiveCheckoutDetails?.gst_percent || 0}%)</span>
                        <span>+₹{fmt(gstAmount)}</span>
                      </div>
                      <hr className="my-2 border-gray-300" />

                      {/* Final payable amount (after GST) */}
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">
                          Payable Amount
                        </span>
                        <span className="font-bold text-lg">
                          ₹{fmt(payableAfterCoupon)}
                        </span>
                      </div>
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>

                {/* Apply Coupon UI */}
                <div className="mt-2 mb-4">
                  <label className="mb-1 font-semibold text-[15px]">
                    Apply Coupon
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg uppercase font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={handleCouponInput}
                      maxLength={20}
                      autoComplete="off"
                    />
                    <button
                      className="bg-[#b6d4fe] text-gray-900 font-medium min-w-[70px] rounded-lg px-4 py-2 hover:bg-[#a0c4ee] transition-colors"
                      onClick={handleVerifyCoupon}
                      disabled={!couponCode || couponLoading}
                    >
                      {couponLoading ? "..." : "Verify"}
                    </button>
                  </div>
                  {couponStatus && (
                    <div
                      className={`mt-2 font-semibold text-sm ${couponStatus.success ? "text-green-600" : "text-red-600"
                        }`}
                    >
                      {couponStatus.message}
                    </div>
                  )}
                  <hr className="mt-3 mb-0 border-gray-300" />
                </div>

                <div className="flex justify-center mb-4">
                  <button
                    className="bg-[#19b955] text-white rounded-full font-semibold text-xl min-w-[280px] px-6 py-3 shadow-[0_2px_8px_rgba(25,185,85,0.15)] hover:bg-[#17a54d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <span className="text-[#b6f5d1] text-base font-medium ml-1">
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
