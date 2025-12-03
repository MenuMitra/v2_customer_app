import React, { useState, useEffect } from "react";
import BaseModal from "../BaseModal";
import { useCart } from "../../../contexts/CartContext";
import { useModal } from "../../../contexts/ModalContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useOutlet } from "../../../contexts/OutletContext";
import axios from "axios";
import {ENV} from '../../../config';

export const AddToCartModal = () => {
  const { closeModal, modalConfig } = useModal();
  const { addToCart, cartItems } = useCart();
  const { user, setShowAuthOffcanvas, getAccessToken } = useAuth();
  const { outletId } = useOutlet();

  // First, fix the initial states
  const [selectedPortion, setSelectedPortion] = useState(null); // Start with null instead of assuming a portion ID

  // Initialize quantities with empty object
  const [quantities, setQuantities] = useState({});

  // Initialize menuDetails
  const [menuDetails, setMenuDetails] = useState({
    portions: []
  });

  // Track comments for all portions
  const [comments, setComments] = useState(() => {
    const initial = {};
    modalConfig.data?.portions?.forEach((portion) => {
      const cartItem = cartItems.find(
        (item) =>
          item.menuId === modalConfig.data?.menuId &&
          item.portionId === portion.portion_id
      );
      initial[portion.portion_id] = cartItem?.comment || "";
    });
    return initial;
  });

  // Check if item exists in cart
  const isInCart = cartItems.some(
    (item) => item.menuId === modalConfig.data?.menuId
  );

  // Find existing cart item for current portion
  const getCurrentCartItem = (portionId) => {
    return cartItems.find(
      (item) =>
        item.menuId === modalConfig.data?.menuId && item.portionId === portionId
    );
  };

  // Update quantity when portion changes
  const handlePortionChange = (portionId) => {
    setSelectedPortion(portionId);

    // Set quantity to 1 if it's 0 or undefined
    setQuantities((prev) => ({
      ...prev,
      [portionId]: prev[portionId] || 1,
    }));
  };

  // Set modal title based on cart status and include menu name
  const modalTitle = `${isInCart ? "Update" : "Add"} - ${
    modalConfig.data?.menuName || modalConfig.data?.menu_name || ""
  }`;

  // Add auth check at the start of the component
  useEffect(() => {
    const authData = localStorage.getItem("auth");
    if (!authData || !user) {
      closeModal("addToCart"); // Close the cart modal
      setShowAuthOffcanvas(true); // Show auth modal
      return;
    }
  }, [user, closeModal, setShowAuthOffcanvas]);

  // Remove the problematic useEffect (lines 80-95) and replace with this:
  useEffect(() => {
    // Handle increment/decrement action from VerticalMenuCard
    if (modalConfig.data?.action && selectedPortion) {
      const action = modalConfig.data.action;
      const currentQuantity = quantities[selectedPortion] || 0;
      
      if (action === 'increment') {
        const newQuantity = currentQuantity + 1;
        setQuantities((prev) => ({
          ...prev,
          [selectedPortion]: newQuantity,
        }));
        
        // Update cart immediately
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
        
        // Update cart immediately
        if (modalConfig.data) {
          addToCart(
            modalConfig.data,
            selectedPortion,
            newQuantity,
            comments[selectedPortion] || ""
          );
        }
      }
      
      // Clear the action to prevent re-triggering
      modalConfig.data.action = null;
    }
  }, [modalConfig.data?.action, selectedPortion]); // Remove quantities from dependencies

  // Update the handleQuantityChange function to remove the action logic:
  const handleQuantityChange = (newQuantity) => {
    // Check if user is authenticated
    const authData = localStorage.getItem("auth");
    if (!authData || !user) {
      closeModal("addToCart"); // Close the cart modal
      setShowAuthOffcanvas(true); // Show auth modal
      return;
    }

    const finalQuantity = Math.max(0, newQuantity);
    setQuantities((prev) => ({
      ...prev,
      [selectedPortion]: finalQuantity,
    }));

    // Only update cart immediately if item is already in cart (existing behavior)
    if (isInCart && modalConfig.data) {
      addToCart(
        modalConfig.data,
        selectedPortion,
        finalQuantity,
        comments[selectedPortion] || ""
      );
    }
  };

  // Update comment handler to work with selected portion
  const handleCommentChange = (newComment) => {
    setComments((prev) => ({
      ...prev,
      [selectedPortion]: newComment,
    }));
  };

  // Update suggestion handler
  const handleSuggestionClick = (suggestionText) => {
    const currentComment = comments[selectedPortion] || "";
    const currentSuggestions = currentComment
      ? currentComment.split(", ").filter(Boolean)
      : [];
    const isSelected = currentSuggestions.includes(suggestionText);

    if (isSelected) {
      // Remove the suggestion
      const filteredSuggestions = currentSuggestions.filter(
        (s) => s !== suggestionText
      );
      const newComment = filteredSuggestions.join(", ");
      handleCommentChange(newComment);
    } else {
      // Check if we've reached the maximum number of suggestions (4)
      if (currentSuggestions.length >= 4) {
        return; // Don't add more suggestions if we've reached the limit
      }

      // Add the suggestion
      const newComment = currentComment
        ? `${currentComment}, ${suggestionText}`
        : suggestionText;
      handleCommentChange(newComment);
    }
  };

  // Update handleAddToCart to only add the selected portion
  const handleAddToCart = () => {
    // Check if user is authenticated
    const authData = localStorage.getItem("auth");
    if (!authData || !user) {
      closeModal("addToCart"); // Close the cart modal
      setShowAuthOffcanvas(true); // Show auth modal
      return;
    }

    // Only add/update the selected portion if we have valid data
    if (selectedPortion && quantities[selectedPortion] > 0) {
      // Ensure modalConfig.data has all required fields
      const menuItemData = {
        ...modalConfig.data,
        menuId: modalConfig.data.menuId || modalConfig.data.menu_id,
        menuName: modalConfig.data.menuName || modalConfig.data.menu_name,
        menu_cat_id: modalConfig.data.menu_cat_id || modalConfig.data.category_id,
        category_name: modalConfig.data.category_name,
        offer: modalConfig.data.offer, // This will be undefined if not present
        portions: menuDetails.portions || modalConfig.data.portions, // Use updated portions if available
      };

      addToCart(
        menuItemData,
        Number(selectedPortion),
        quantities[selectedPortion],
        comments[selectedPortion] || ""
      );
    }

    closeModal("addToCart");
  };

  // Add a function to check if any portion has quantity > 0
  const hasValidQuantity = () => {
    return Object.values(quantities).some((quantity) => quantity > 0);
  };

  // Update the useEffect to properly handle the API response
  useEffect(() => {
    const fetchMenuDetails = async () => {
      try {
        const token = getAccessToken();

        const response = await axios.post(
          `${ENV.V2_COMMON_BASE}/user/get_full_half_price_of_menu`,
          {
            outlet_id: outletId,
            menu_id: modalConfig.data?.menuId || modalConfig.data?.menu_id,
            app_source: "user_app",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data?.detail?.menu_detail) {
          const newPortions = response.data.detail.menu_detail.portions.map(portion => ({
            ...portion,
            price: parseFloat(portion.price) || 0
          }));

          // Set the first portion as selected if none is selected
          if (!selectedPortion && newPortions.length > 0) {
            setSelectedPortion(newPortions[0].portion_id);
          }

          // Initialize quantities for new portions
          setQuantities(prev => {
            const newQuantities = { ...prev };
            newPortions.forEach(portion => {
              if (!(portion.portion_id in newQuantities)) {
                const cartItem = cartItems.find(
                  item => item.menuId === modalConfig.data?.menuId && 
                         item.portionId === portion.portion_id
                );
                newQuantities[portion.portion_id] = cartItem?.quantity || 1;
              }
            });
            return newQuantities;
          });

          // Update menuDetails
          setMenuDetails(prev => ({
            ...prev,
            portions: newPortions
          }));
        }
      } catch (err) {
        console.error("API Error:", err);
      }
    };

    if (modalConfig.data?.menuId || modalConfig.data?.menu_id) {
      fetchMenuDetails();
    }
  }, [modalConfig.data, cartItems, getAccessToken, outletId]); // Remove selectedPortion from dependencies

  // Add state for dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Add click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest(".position-relative")) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Update renderPortionSelection to always show UI without loading or error states
  const renderPortionSelection = () => {
    const portions = menuDetails?.portions || [];

    if (portions.length === 0) {
      return (
        <div
          className="form-control d-flex justify-content-between align-items-center border border-2 rounded-3 p-3 fs-6 text-dark disabled"
          style={{
            cursor: "not-allowed"
          }}
        >
          <span>No portion sizes available</span>
        </div>
      );
    }

    // Find the selected portion object
    const selectedPortionObj = portions.find(p => p.portion_id === selectedPortion);

    return (
      <div className="position-relative">
        <div
          className="form-control d-flex justify-content-between align-items-center rounded-3 p-3 fs-6 text-dark user-select-none"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={{
            border: "1.5px solid #e9ecef",
            cursor: "pointer"
          }}
        >
          <span>
            {selectedPortionObj
              ? `${selectedPortionObj.portion_name ? `${selectedPortionObj.portion_name} - ` : ''}₹${selectedPortionObj.price} (${selectedPortionObj.unit_value}${selectedPortionObj.unit_type ? ` ${selectedPortionObj.unit_type}` : ''})`
              : "Select a portion size"}
          </span>
          <i
            className={`fas fa-chevron-${isDropdownOpen ? "up" : "down"} text-secondary`}
          ></i>
        </div>

        {isDropdownOpen && portions.length > 0 && (
          <div
            className="position-absolute w-100 mt-1 shadow-sm bg-transparent rounded-3 border"
            style={{
              border: "1.5px solid #e9ecef",
              zIndex: 1000,
              overflow: "hidden"
            }}
          >
            {portions.map((portion) => (
              <div
                key={portion.portion_id}
                onClick={() => {
                  handlePortionChange(portion.portion_id);
                  setIsDropdownOpen(false);
                }}
                className={`d-flex justify-content-between align-items-center p-3 border-bottom bg-light`}
                style={{
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <div className="d-flex flex-column">
                  <span
                    style={{
                      color: "#212529"
                    }}
                    className={`fs-6 ${
                      selectedPortion === portion.portion_id ? "fw-medium" : "fw-normal"
                    }`}
                  >
                    {`${portion.portion_name ? `${portion.portion_name} - ` : ''}₹${portion.price} (${
                      portion.unit_value
                    }${portion.unit_type ? ` ${portion.unit_type}` : ''})`}
                  </span>
                </div>
                {selectedPortion === portion.portion_id && (
                  <i className="fas fa-check text-success"></i>
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
        <label className="text-secondary mb-2" style={{ fontSize: "14px" }}>
          Select Portion
        </label>
        <div className="row">
          <div className="col-12">{renderPortionSelection()}</div>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-secondary mb-2 d-flex justify-content-between align-items-center">
          <span style={{ fontSize: "14px" }}>
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
            style={{
              color:
                (comments[selectedPortion]?.length || 0) > 50
                  ? "#dc3545"
                  : "#6c757d",
              fontSize: "12px",
            }}
          ></small>
        </label>

        {/* Quick Suggestions */}
        <div className="d-flex flex-wrap gap-2 mb-3">
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
                style={{
                  backgroundColor: suggestionSelected ? "#e8f5e9" : "#f8f9fa",
                  border: `1px solid ${
                    suggestionSelected ? "#28a745" : "#e9ecef"
                  }`,
                  borderRadius: "20px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  color: suggestionSelected ? "#28a745" : "#6c757d",
                  cursor: suggestionDisabled ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  userSelect: "none",
                  opacity: suggestionDisabled ? 0.5 : 1,
                }}
              >
                <span>{suggestion.icon}</span>
                <span>{suggestion.text}</span>
                {suggestionSelected && (
                  <span style={{ marginLeft: "4px", fontSize: "10px" }}>✓</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Comment textarea */}
        <div className="position-relative">
          <div className="d-flex justify-content-end mb-1">
            <span className="text-muted small me-2">
              {comments[selectedPortion]?.length || 0}/50
            </span>
          </div>
          <textarea
            className={`form-control rounded-3 p-3 fs-6 ${
              comments[selectedPortion]?.length < 5 && comments[selectedPortion]?.length > 0
                ? "border-danger"
                : comments[selectedPortion]?.length > 50
                ? "border-danger"
                : "border-light"
            }`}
            value={comments[selectedPortion] || ""}
            onChange={(e) => handleCommentChange(e.target.value)}
            placeholder={`Add instructions for ${
              menuDetails?.portions?.find(
                (p) => p.portion_id === selectedPortion
              )?.portion_name || 'selected'
            } portion...`}
            style={{
              paddingRight: "60px",
              minHeight: "60px",
              maxHeight: "120px",
              resize: "vertical",
              transition: "all 0.2s ease"
            }}
            onFocus={(e) => {
              if (comments[selectedPortion]?.length <= 50) {
                e.target.style.border = "1.5px solid #28a745";
              }
            }}
            onBlur={(e) => {
              e.target.style.border =
                comments[selectedPortion]?.length < 5 ||
                comments[selectedPortion]?.length > 50
                  ? "1.5px solid #dc3545"
                  : "1.5px solid #e9ecef";
            }}
          />

          {/* {comments[selectedPortion] && (
            <button
              onClick={() => handleCommentChange("")}
              className="position-absolute end-0 top-0 mt-2 me-2 btn btn-light btn-sm rounded-pill"
              style={{
                fontSize: "12px",
                zIndex: 2
              }}
            >
              Clear
            </button>
          )} */}
        </div>

        {/* Validation message */}
        {comments[selectedPortion]?.length > 0 && (
          <small
            style={{
              color: "#dc3545",
              fontSize: "12px",
              marginTop: "6px",
              display: "block",
            }}
          >
            {comments[selectedPortion]?.length < 5
              ? "Instructions must be at least 5 characters"
              : comments[selectedPortion]?.length > 50
              ? "Instructions cannot exceed 50 characters"
              : ""}
          </small>
        )}

        {/* Helper text */}
        <small
          style={{
            color: "#6c757d",
            fontSize: "12px",
            marginTop: comments[selectedPortion]?.length > 0 ? "2px" : "6px",
            display: "block",
          }}
        >
          Click to add/remove suggestions or type your custom instructions
        </small>
      </div>

      <div className="d-flex align-items-center gap-3 mt-4">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "1px solid #28a745",
            borderRadius: "999px",
            padding: "5px 5px",
            background: "white",
            flex: "1",
          }}
        >
          <button
            type="button"
            onClick={() =>
              handleQuantityChange(quantities[selectedPortion] - 1)
            }
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#07813a",
              color: "white",
              border: "none",
              fontSize: "20px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "20px",
              transition: "background 0.2s",
              opacity: quantities[selectedPortion] <= 0 ? 0.5 : 1,
            }}
            disabled={quantities[selectedPortion] <= 0}
          >
            –
          </button>
          <span
            style={{
              fontSize: "20px",
              fontWeight: 400,
              color: "#23232b",
              minWidth: "24px",
              textAlign: "center",
              flex: "1",
            }}
          >
            {quantities[selectedPortion]}
          </span>
          <button
            type="button"
            onClick={() =>
              handleQuantityChange(quantities[selectedPortion] + 1)
            }
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#07813a",
              color: "white",
              border: "none",
              fontSize: "20px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: "20px",
              transition: "background 0.2s",
            }}
          >
            +
          </button>
        </div>

        <button
          type="button"
          className="btn btn-primary py-3 border-0 rounded-pill fs-6 fw-500  d-flex align-items-center"
          onClick={handleAddToCart}
          disabled={!hasValidQuantity()}
          style={{
            opacity: hasValidQuantity() ? 1 : 0.5,
          }}
        >
          <i className="fa-solid fa-cart-shopping me-2"></i>
          {isInCart ? "Update Cart" : "Add to Cart"}
        </button>
      </div>
    </BaseModal>
  );
};
