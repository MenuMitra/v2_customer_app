import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BaseModal from "../BaseModal";
import { useCart } from "../../../contexts/CartContext";
import { useModal } from "../../../contexts/ModalContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useOutlet } from "../../../contexts/OutletContext";
import apiService from "../../../api/apiService";

export const AddToCartModal = () => {
  const { closeModal, modalConfig, openModal } = useModal();
  const { addToCart, cartItems } = useCart();
  const { user, setShowAuthOffcanvas, getUserId } = useAuth();
  const { outletId, sectionId, tableId, orderSettings } = useOutlet();
  const navigate = useNavigate();
  const cartOnly =
    !!modalConfig.data?.cartOnly || !!modalConfig.data?.isCombo;

  const resolvePortionPrice = (portion, menuDefault) => {
    const v = portion?.price ?? portion?.default_price ?? menuDefault ?? null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const [selectedPortion, setSelectedPortion] = useState(() => {
    const portions = modalConfig.data?.portions || [];

    // Combos behave like single-portion items.
    if (modalConfig.data?.isCombo) {
      return portions?.[0]?.portion_id ?? 0;
    }

    // UX requirement:
    // - 1 portion: auto-select
    // - 2+ portions: user must select (no preselect)
    if (Array.isArray(portions) && portions.length === 1) {
      return portions?.[0]?.portion_id ?? null;
    }
    return null;
  });
  const [quantities, setQuantities] = useState(() => {
    const initial = {};
    modalConfig.data?.portions?.forEach((portion) => {
      const cartItem = cartItems.find(
        (item) =>
          item.menuId == (modalConfig.data?.menuId || modalConfig.data?.menu_id) &&
          item.portionId == portion.portion_id
      );
      initial[portion.portion_id] = cartItem?.quantity || 1;
    });
    return initial;
  });
  const [menuDetails, setMenuDetails] = useState(() => ({
    portions: modalConfig.data?.portions || []
  }));

  // Track comments for all portions
  const [comments, setComments] = useState(() => {
    const initial = {};
    modalConfig.data?.portions?.forEach((portion) => {
      const cartItem = cartItems.find(
        (item) =>
          item.menuId == modalConfig.data?.menuId &&
          item.portionId == portion.portion_id
      );
      initial[portion.portion_id] = cartItem?.comment || "";
    });
    return initial;
  });

  // Check if item exists in cart
  const isInCart = cartItems.some(
    (item) => item.menuId == modalConfig.data?.menuId
  );

  const [portionError, setPortionError] = useState("");

  // Update quantity when portion changes
  const handlePortionChange = (portionId) => {
    setSelectedPortion(portionId);
    setPortionError("");

    // Set quantity to 1 if it's 0 or undefined
    setQuantities((prev) => ({
      ...prev,
      [portionId]: prev[portionId] || 1,
    }));
  };

  // Set modal title based on cart status and include menu name
  const modalTitle = `${isInCart ? "Update" : "Add"} - ${modalConfig.data?.menuName || modalConfig.data?.menu_name || ""
    }`;

  // Add auth check at the start of the component
  useEffect(() => {
    const authData = localStorage.getItem("auth");
    if (!authData || !user) {
      closeModal("addToCart");
      setShowAuthOffcanvas(true);
      return;
    }
  }, [user, closeModal, setShowAuthOffcanvas]);

  useEffect(() => {
    // Handle increment/decrement action from VerticalMenuCard
    if (
      modalConfig.data?.action &&
      selectedPortion !== null &&
      selectedPortion !== undefined
    ) {
      const action = modalConfig.data.action;
      const currentQuantity = quantities[selectedPortion] || 0;

      if (action === 'increment') {
        const newQuantity = currentQuantity + 1;
        setQuantities((prev) => ({
          ...prev,
          [selectedPortion]: newQuantity,
        }));

        if (modalConfig.data) {
          addToCart(
            modalConfig.data,
            selectedPortion,
            newQuantity,
            comments[selectedPortion] || ""
          );
        }
      } else if (action === 'decrement') {
        const newQuantity = Math.max(0, currentQuantity - 1);
        setQuantities((prev) => ({
          ...prev,
          [selectedPortion]: newQuantity,
        }));

        if (modalConfig.data) {
          addToCart(
            modalConfig.data,
            selectedPortion,
            newQuantity,
            comments[selectedPortion] || ""
          );
        }
      }

      modalConfig.data.action = null;
    }
  }, [modalConfig.data?.action, selectedPortion]);

  const handleQuantityChange = (newQuantity) => {
    const authData = localStorage.getItem("auth");
    if (!authData || !user) {
      closeModal("addToCart");
      setShowAuthOffcanvas(true);
      return;
    }

    const finalQuantity = Math.max(0, newQuantity || 0);
    setQuantities((prev) => ({
      ...prev,
      [selectedPortion]: finalQuantity,
    }));

    if (isInCart && modalConfig.data) {
      addToCart(
        modalConfig.data,
        selectedPortion,
        finalQuantity,
        comments[selectedPortion] || ""
      );
    }
  };

  const handleCommentChange = (newComment) => {
    setComments((prev) => ({
      ...prev,
      [selectedPortion]: newComment,
    }));
  };

  const handleSuggestionClick = (suggestionText) => {
    const currentComment = comments[selectedPortion] || "";
    const currentSuggestions = currentComment
      ? currentComment.split(", ").filter(Boolean)
      : [];
    const isSelected = currentSuggestions.includes(suggestionText);

    if (isSelected) {
      const filteredSuggestions = currentSuggestions.filter(
        (s) => s !== suggestionText
      );
      const newComment = filteredSuggestions.join(", ");
      handleCommentChange(newComment);
    } else {
      if (currentSuggestions.length >= 4) {
        return;
      }

      const newComment = currentComment
        ? `${currentComment}, ${suggestionText}`
        : suggestionText;
      handleCommentChange(newComment);
    }
  };

  const handleAddToCart = async () => {
    const authData = localStorage.getItem("auth");
    if (!authData || !user) {
      closeModal("addToCart");
      setShowAuthOffcanvas(true);
      return;
    }

    const portionsToUseForValidation =
      menuDetails.portions?.length > 0
        ? menuDetails.portions
        : modalConfig.data?.portions || [];
    const hasMultiplePortions =
      !modalConfig.data?.isCombo && (portionsToUseForValidation?.length || 0) > 1;

    if (hasMultiplePortions && (selectedPortion === null || selectedPortion === undefined)) {
      setPortionError("Please select portion");
      return;
    }

    const currentQuantity =
      selectedPortion === null || selectedPortion === undefined
        ? 0
        : (quantities[selectedPortion] || 0);

    if (
      selectedPortion !== null &&
      selectedPortion !== undefined &&
      currentQuantity > 0
    ) {
      const targetOutletId =
        modalConfig.data?.outlet_id || modalConfig.data?.outletId || outletId;

      // Use menuDetails.portions if available, otherwise fall back to modalConfig.data.portions
      const portionsToUse =
        menuDetails.portions?.length > 0
          ? menuDetails.portions
          : modalConfig.data?.portions || [];

      const selectedPortionObj = portionsToUse.find(
        (p) => Number(p.portion_id) === Number(selectedPortion)
      );
      const portionName = (selectedPortionObj?.portion_name || "")
        .toString()
        .toLowerCase();

      const menuItemData = {
        ...modalConfig.data,
        menuId: modalConfig.data.menuId || modalConfig.data.menu_id,
        menuName: modalConfig.data.menuName || modalConfig.data.menu_name,
        menu_cat_id:
          modalConfig.data.menu_cat_id || modalConfig.data.category_id,
        category_name: modalConfig.data.category_name,
        offer: modalConfig.data.offer,
        portions: portionsToUse,
      };

      const serverOrderItem = {
        menu_id: Number(menuItemData.menuId),
        quantity: Number(currentQuantity),
        portion_name: portionName,
        comment: comments[selectedPortion] || "",
      };

      const ensureActiveOrder = async () => {
        const stored = localStorage.getItem("activeOrderId");
        if (stored) {
          // Reuse locally stored active order only if backend still says it's active
          // (prevents "cooking order -> create new order" when local state is stale).
          const currentUserId = getUserId();
          if (currentUserId) {
            try {
              const detailsRes = await apiService.checkout.getOrderDetails({
                orderId: stored,
                userId: currentUserId,
              });
              const details = detailsRes?.order_details;

              const statusNorm = String(details?.order_status || "")
                .toLowerCase()
                .trim();
              // Block reuse for completed/cancelled/closed states.
              const isTerminal = [
                "completed",
                "cancelled",
                "rejected",
                "refunded",
                "paid",
              ].includes(
                statusNorm
              );

              const effectiveTableId =
                tableId || localStorage.getItem("tableId") || "";
              const effectiveTableNumber =
                localStorage.getItem("tableNumber") || "";
              const backendTableId = details?.table_id?.toString?.() || "";
              const backendTableNumbers = Array.isArray(details?.table_number)
                ? details.table_number.map((t) => String(t))
                : [];
              const hasSessionTableContext =
                !!effectiveTableId || !!effectiveTableNumber;
              const tableIdMatches =
                !!effectiveTableId &&
                !!backendTableId &&
                String(backendTableId) === String(effectiveTableId);
              const tableNumberMatches =
                !!effectiveTableNumber &&
                backendTableNumbers.includes(String(effectiveTableNumber));
              const hasOrderItems =
                (Number(details?.menu_count || 0) > 0) ||
                (Number(details?.combo_count || 0) > 0) ||
                (Array.isArray(detailsRes?.menu_details) &&
                  detailsRes.menu_details.length > 0) ||
                (Array.isArray(detailsRes?.combo_details) &&
                  detailsRes.combo_details.length > 0);
              const tableMatches = hasSessionTableContext
                ? tableIdMatches || tableNumberMatches
                : false;

              if (details && !isTerminal && tableMatches && hasOrderItems) {
                return { orderId: String(stored), createdNew: false };
              }

              localStorage.removeItem("activeOrderId");
            } catch {
              // If details fetch fails, fallback to backend check/create logic below.
            }
          } else {
            localStorage.removeItem("activeOrderId");
          }
        }

        const userId = getUserId();
        if (!userId || !targetOutletId) return null;

        const effectiveSectionId =
          sectionId || localStorage.getItem("sectionId") || "";
        const effectiveTableId =
          tableId || localStorage.getItem("tableId") || "";

        const existing = await apiService.checkout.checkExistingOrder({
          userId,
          outletId: targetOutletId,
          sectionId: effectiveSectionId,
          tableId: effectiveTableId,
        });
        const existingOrderId = existing?.order_id || existing?.orderId;
        if (existingOrderId) {
          localStorage.setItem("activeOrderId", String(existingOrderId));
          return { orderId: String(existingOrderId), createdNew: false };
        }

        const storedSettingsRaw = localStorage.getItem("orderSettings");
        const storedSettings = storedSettingsRaw
          ? JSON.parse(storedSettingsRaw)
          : null;
        const orderType =
          orderSettings?.order_type || storedSettings?.order_type || "dine-in";

        const created = await apiService.checkout
          .createOrder({
            outletId: targetOutletId,
            userId,
            sectionId: effectiveSectionId,
            tableId: effectiveTableId,
            orderType,
            orderItems: [serverOrderItem],
            action: "create_order",
          })
          .catch((err) => {
            const detail =
              typeof err?.detail === "string" ? err.detail.toLowerCase() : "";
            const isTableOccupied =
              err?.status === 400 &&
              detail.includes("table") &&
              detail.includes("occupied");

            const existingOrderIdFromError =
              err?.data?.existing_order_id || err?.data?.order_id;

            if (isTableOccupied && existingOrderIdFromError) {
              const orderIdStr = String(existingOrderIdFromError);
              localStorage.setItem("activeOrderId", orderIdStr);
              return { detail: { order_id: existingOrderIdFromError } };
            }

            throw err;
          });

        const createdOrderId = created?.order_id || created?.detail?.order_id;
        if (createdOrderId) {
          localStorage.setItem("activeOrderId", String(createdOrderId));
          return { orderId: String(createdOrderId), createdNew: true };
        }

        return null;
      };

      const nextCartItems = (() => {
        const menuId = Number(menuItemData.menuId);
        const portionId = Number(selectedPortion);
        const next = [...(cartItems || [])];
        const idx = next.findIndex(
          (i) => i.menuId == menuId && i.portionId == portionId
        );
        const nextItem = {
          ...(idx >= 0 ? next[idx] : {}),
          menuId,
          portionId,
          quantity: currentQuantity,
          comment: comments[selectedPortion] || "",
          outlet_id: targetOutletId,
        };

        if (currentQuantity === 0) {
          if (idx >= 0) next.splice(idx, 1);
        } else if (idx >= 0) {
          next[idx] = nextItem;
        } else {
          next.push(nextItem);
        }
        return next;
      })();

      try {
        // CART-ONLY MODE:
        // - Do NOT create/modify server orders
        // - Do NOT redirect to /checkout
        // - Just update local cart and return to menu list
        if (cartOnly) {
          addToCart(
            menuItemData,
            Number(selectedPortion),
            currentQuantity,
            comments[selectedPortion] || "",
            targetOutletId
          );

          closeModal("addToCart");

          // Keep QR outlet context by navigating to stored outlet URL.
          const outletCode = localStorage.getItem("outletCode");
          const storedSectionId = localStorage.getItem("sectionId");
          const storedTableNumber =
            localStorage.getItem("tableNumber") ||
            localStorage.getItem("tableId");

          if (outletCode && storedSectionId && storedTableNumber) {
            navigate(`/o${outletCode}/s${storedSectionId}/t${storedTableNumber}`);
          } else {
            navigate("/");
          }
          return;
        }

        const activeOrder = await ensureActiveOrder();
        if (!activeOrder?.orderId) {
          openModal("ERROR", {
            message: "Unable to create order. Please try again.",
          });
          return;
        }

        // If we didn't just create an order with this item, add it to the existing order
        if (!activeOrder.createdNew) {
          await apiService.checkout.addMenusToOrder({
            orderId: activeOrder.orderId,
            outletId: targetOutletId,
            orderItems: [serverOrderItem],
          });
        }

        // Sync UI cart pricing with server-calculated menu_details
        try {
          const userId = getUserId();
          const orderDetails = await apiService.checkout.getOrderDetails({
            orderId: activeOrder.orderId,
            userId,
          });
          const serverMenu = orderDetails?.menu_details?.find(
            (m) => Number(m.menu_id) === Number(menuItemData.menuId)
          );
          if (serverMenu) {
            const serverPrice = Number(serverMenu.price);
            const serverOffer = Number(serverMenu.offer || 0);
            const serverPortionName = serverMenu.portion_name || "";

            menuItemData.offer = Number.isFinite(serverOffer) ? serverOffer : menuItemData.offer;

            // Update the selected portion in `portions` so CartContext uses the server price.
            const updatedPortions = (menuItemData.portions || []).map((p) =>
              Number(p.portion_id) === Number(selectedPortion)
                ? {
                    ...p,
                    portion_name: serverPortionName || p.portion_name,
                    price: Number.isFinite(serverPrice) ? serverPrice : p.price,
                  }
                : p
            );

            // If we had only the fallback "Default" portion, ensure at least one portion exists
            if (updatedPortions.length === 0) {
              updatedPortions.push({
                portion_id: Number(selectedPortion),
                portion_name: serverPortionName || "Default",
                price: Number.isFinite(serverPrice) ? serverPrice : 0,
                unit_value: 1,
                unit_type: "",
              });
            }

            menuItemData.portions = updatedPortions;
          }
        } catch (e) {
          // If this fails, keep local pricing; checkout will still reflect server totals.
          console.warn("Failed to sync server menu details:", e);
        }

        addToCart(
          menuItemData,
          Number(selectedPortion),
          currentQuantity,
          comments[selectedPortion] || "",
          targetOutletId
        );

        closeModal("addToCart");
        navigate("/checkout");
        return;
      } catch (err) {
        console.error("Failed to add menu to order:", err);
        openModal("ERROR", {
          message:
            err?.message ||
            err?.response?.data?.detail ||
            "Failed to add item to cart. Please try again.",
        });
        return;
      }
    }

    closeModal("addToCart");
    if (!cartOnly) {
      navigate("/checkout");
    }
  };

  const hasValidQuantity = () => {
    const portionsToUse =
      menuDetails.portions?.length > 0
        ? menuDetails.portions
        : modalConfig.data?.portions || [];
    const hasMultiple =
      !modalConfig.data?.isCombo && (portionsToUse?.length || 0) > 1;

    if (hasMultiple && (selectedPortion === null || selectedPortion === undefined)) {
      return false;
    }

    return Object.values(quantities).some((quantity) => quantity > 0);
  };

  useEffect(() => {
    const fetchMenuDetails = async () => {
      try {
        if (modalConfig.data?.isCombo) return;

        const userId = getUserId();
        const menuId = modalConfig.data?.menuId || modalConfig.data?.menu_id;
        const menuCatId = modalConfig.data?.menuCatId || modalConfig.data?.menu_cat_id || modalConfig.data?.category_id;
        const targetOutletId =
          modalConfig.data?.outlet_id || modalConfig.data?.outletId || outletId;

        if (!menuId || !menuCatId) return;

        const details = await apiService.menus.getDetails({
          outletId: targetOutletId,
          menuId,
          menuCatId,
          userId,
        });

        if (details?.portions) {
          const newPortions = details.portions.map((portion) => ({
            ...portion,
            // Keep raw `price/default_price` so UI can apply fallback priority.
            price: portion.price,
            default_price: portion.default_price,
          }));

          setMenuDetails(prev => ({
            ...prev,
            portions: newPortions
          }));

          // Update quantities with any new portions found, preserving existing quantities
          setQuantities(prev => {
            const newQuantities = { ...prev };
            newPortions.forEach(portion => {
              if (newQuantities[portion.portion_id] === undefined) {
                const cartItem = cartItems.find(
                  item => item.menuId == menuId &&
                    item.portionId == portion.portion_id
                );
                newQuantities[portion.portion_id] = cartItem?.quantity || 1;
              }
            });
            return newQuantities;
          });

          // UX requirement:
          // - 1 portion: auto-select
          // - 2+ portions: do NOT preselect (unless user already has exactly one portion in cart)
          const cartPortionIdsForMenu = (cartItems || [])
            .filter((i) => i.menuId == menuId)
            .map((i) => Number(i.portionId))
            .filter((v) => Number.isFinite(v));
          const uniqueCartPortionIds = Array.from(new Set(cartPortionIdsForMenu));

          if (newPortions.length === 1) {
            setSelectedPortion(newPortions[0].portion_id);
          } else if (newPortions.length > 1) {
            if (uniqueCartPortionIds.length === 1) {
              const preferred = uniqueCartPortionIds[0];
              const exists = newPortions.some(
                (p) => Number(p.portion_id) === Number(preferred)
              );
              setSelectedPortion(exists ? preferred : null);
            } else {
              setSelectedPortion(null);
            }
          }
        }
      } catch (err) {
        console.error("API Error fetching menu details:", err);
      }
    };

    if (
      (modalConfig.data?.menuId || modalConfig.data?.menu_id) &&
      !modalConfig.data?.isCombo
    ) {
      fetchMenuDetails();
    }
  }, [modalConfig.data, cartItems, getUserId, outletId]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest(".relative")) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const renderPortionSelection = () => {
    const portions = menuDetails?.portions || [];

    const isFallbackDefaultOnly =
      portions.length === 1 &&
      Number(portions?.[0]?.portion_id) === 0 &&
      String(portions?.[0]?.portion_name || "").toLowerCase().trim() === "default";

    // Edge case: portions_data empty -> hide portion section (we still keep internal default pricing).
    if (portions.length === 0 || isFallbackDefaultOnly || modalConfig.data?.isCombo) {
      return null;
    }

    const hasMultiple = portions.length > 1;

    const menuDefault =
      menuDetails?.default_price ??
      modalConfig.data?.default_price ??
      modalConfig.data?.price ??
      null;

    const formatOption = (portion) => {
      const name = String(portion?.portion_name || "").trim() || "Portion";
      const price = resolvePortionPrice(portion, menuDefault);
      const priceText = price == null ? "N/A" : `₹${price}`;
      // Requirement: show "name - ₹price"
      return `${name} - ${priceText}`;
    };

    if (!hasMultiple) {
      const only = portions[0];
      return (
        <div className="w-full flex justify-between items-center border-2 border-gray-200 rounded-lg p-3 text-base text-gray-900 bg-gray-50">
          <span>{formatOption(only)}</span>
        </div>
      );
    }

    const selectedPortionObj = portions.find(
      (p) => Number(p?.portion_id) === Number(selectedPortion)
    );

    return (
      <div className="relative">
        <div
          className={`w-full flex justify-between items-center rounded-lg p-3 text-base select-none cursor-pointer border-[1.5px] ${
            portionError ? "border-red-600" : "border-gray-200"
          }`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span>
            {selectedPortionObj
              ? formatOption(selectedPortionObj)
              : "Select Portion"}
          </span>
          <i className={`fas fa-chevron-${isDropdownOpen ? "up" : "down"} text-gray-600`}></i>
        </div>

        {isDropdownOpen && portions.length > 0 && (
          <div className="absolute w-full mt-1 shadow-sm bg-white rounded-lg border-[1.5px] border-gray-200 z-[1000] overflow-hidden">
            {portions.map((portion) => (
              <div
                key={portion.portion_id}
                onClick={() => {
                  handlePortionChange(portion.portion_id);
                  setIsDropdownOpen(false);
                }}
                className="flex justify-between items-center p-3 border-b border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-all duration-150"
              >
                <div className="flex flex-col">
                  <span className={`text-base text-gray-900 ${selectedPortion === portion.portion_id ? "font-medium" : "font-normal"
                    }`}>
                    {formatOption(portion)}
                  </span>
                </div>
                {selectedPortion === portion.portion_id && (
                  <i className="fas fa-check text-green-600"></i>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseModal isOpen={true} title={modalTitle} onClose={closeModal}>
      <div className="mb-4">
        {renderPortionSelection() ? (
          <>
            <label className="text-gray-600 mb-2 block text-sm">
              Select Portion
            </label>
            <div className="w-full">{renderPortionSelection()}</div>
            {portionError ? (
              <small className="text-red-600 text-xs mt-1.5 block">
                {portionError}
              </small>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="mb-4">
        <label className="text-gray-600 mb-2 flex justify-between items-center">
          <span className="text-sm">
            Special Instructions for{" "}
            {(() => {
              if (!selectedPortion || !menuDetails?.portions?.length) {
                return "selected portion";
              }

              const portion = menuDetails.portions.find(p => p.portion_id === selectedPortion);

              if (!portion) {
                return "selected portion";
              }

              const label = `${portion.portion_name ? `${portion.portion_name} ` : ''}(${portion.unit_value}${portion.unit_type ? ` ${portion.unit_type}` : ''})`;
              return label;
            })()}
          </span>
          <small
            className={`text-xs ${(comments[selectedPortion]?.length || 0) > 50
              ? "text-red-600"
              : "text-gray-600"
              }`}
          ></small>
        </label>

        {/* Quick Suggestions */}
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            { icon: "🌶️", text: "Extra spicy" },
            { icon: "🥬", text: "No onions" },
            { icon: "🧄", text: "No garlic" },
            { icon: "🥄", text: "Extra sauce" },
            { icon: "🔥", text: "Well done" },
            { icon: "🥗", text: "Less spicy" },
            { icon: "🥚", text: "No egg" },
            { icon: "🥜", text: "No nuts" },
          ].map((suggestion, index) => {
            const commentText = comments[selectedPortion] || "";
            const suggestionList = commentText
              ? commentText.split(", ").filter(Boolean)
              : [];
            const suggestionSelected = suggestionList.includes(suggestion.text);
            const suggestionDisabled =
              suggestionList.length >= 4 && !suggestionSelected;

            return (
              <div
                key={index}
                onClick={() =>
                  !suggestionDisabled && handleSuggestionClick(suggestion.text)
                }
                className={`flex items-center gap-1 px-3 py-2 rounded-full text-[13px] select-none transition-all duration-200 ${suggestionSelected
                  ? "bg-green-50 border border-green-600 text-green-600"
                  : "bg-gray-100 border border-gray-200 text-gray-600"
                  } ${suggestionDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                  }`}
              >
                <span>{suggestion.icon}</span>
                <span>{suggestion.text}</span>
                {suggestionSelected && (
                  <span className="ml-1 text-[10px]">✓</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Comment textarea */}
        <div className="relative">
          <div className="flex justify-end mb-1">
            <span className="text-gray-500 text-sm mr-2">
              {comments[selectedPortion]?.length || 0}/50
            </span>
          </div>
          <textarea
            className={`w-full rounded-lg p-3 text-base transition-all duration-200 pr-[60px] min-h-[60px] max-h-[120px] resize-y ${comments[selectedPortion]?.length < 5 && comments[selectedPortion]?.length > 0
              ? "border-red-600"
              : comments[selectedPortion]?.length > 50
                ? "border-red-600"
                : "border-gray-200"
              } border focus:outline-none focus:ring-0 focus:border-green-600`}
            value={comments[selectedPortion] || ""}
            onChange={(e) => handleCommentChange(e.target.value)}
            placeholder={`Add instructions for ${menuDetails?.portions?.find(
              (p) => p.portion_id === selectedPortion
            )?.portion_name || 'selected'
              } portion...`}
          />
        </div>

        {/* Validation message */}
        {comments[selectedPortion]?.length > 0 && (
          <small className="text-red-600 text-xs mt-1.5 block">
            {comments[selectedPortion]?.length < 5
              ? "Instructions must be at least 5 characters"
              : comments[selectedPortion]?.length > 50
                ? "Instructions cannot exceed 50 characters"
                : ""}
          </small>
        )}

        {/* Helper text */}
        <small className={`text-gray-600 text-xs block ${comments[selectedPortion]?.length > 0 ? 'mt-0.5' : 'mt-1.5'}`}>
          Click to add/remove suggestions or type your custom instructions
        </small>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <div className="flex items-center border border-2 border-green-600 rounded-full p-1.5 bg-white flex-1">
          <button
            type="button"
            onClick={() =>
              handleQuantityChange((quantities[selectedPortion] || 0) - 1)
            }
            className={`w-10 h-10 rounded-3xl bg-[#07813a] text-white border-0 text-xl font-medium flex items-center justify-center mr-5 transition-all duration-200 ${(quantities[selectedPortion] || 0) <= 0 ? 'opacity-50' : 'opacity-100'
              }`}
            disabled={(quantities[selectedPortion] || 0) <= 0}
          >
            –
          </button>
          <span className="text-xl font-normal text-[#23232b] min-w-[24px] text-center flex-1">
            {quantities[selectedPortion] || 0}
          </span>
          <button
            type="button"
            onClick={() =>
              handleQuantityChange((quantities[selectedPortion] || 0) + 1)
            }
            className="w-10 h-10 rounded-3xl bg-[#07813a] text-white border-0 text-xl font-medium flex items-center justify-center ml-5 transition-all duration-200"
          >
            +
          </button>
        </div>

        <button
          type="button"
          className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 border-0 rounded-3xl text-base font-medium flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAddToCart}
          disabled={!hasValidQuantity()}
        >
          <i className="fa-solid fa-cart-shopping mr-2"></i>
          {isInCart ? "Update Cart" : "Add to Cart"}
        </button>
      </div>
    </BaseModal>
  );
};
