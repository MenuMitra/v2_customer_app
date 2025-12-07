import { useState, useEffect } from "react";
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
        <div className="w-full flex justify-between items-center border-2 border-gray-200 rounded-lg p-3 text-base text-gray-900 cursor-not-allowed opacity-60">
          <span>No portion sizes available</span>
        </div>
      );
    }

    // Find the selected portion object
    const selectedPortionObj = portions.find(p => p.portion_id === selectedPortion);

    return (
      <div className="relative">
        <div
          className="w-full flex justify-between items-center rounded-lg p-3 text-base text-gray-900 select-none cursor-pointer border-[1.5px] border-gray-200"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span>
            {selectedPortionObj
              ? `${selectedPortionObj.portion_name ? `${selectedPortionObj.portion_name} - ` : ''}₹${selectedPortionObj.price} (${selectedPortionObj.unit_value}${selectedPortionObj.unit_type ? ` ${selectedPortionObj.unit_type}` : ''})`
              : "Select a portion size"}
          </span>
          <i className={`fas fa-chevron-${isDropdownOpen ? "up" : "down"} text-gray-600`}></i>
        </div>

        {isDropdownOpen && portions.length > 0 && (
          <div className="absolute w-full mt-1 shadow-sm bg-transparent rounded-lg border-[1.5px] border-gray-200 z-[1000] overflow-hidden">
            {portions.map((portion) => (
              <div
                key={portion.portion_id}
                onClick={() => {
                  handlePortionChange(portion.portion_id);
                  setIsDropdownOpen(false);
                }}
                className="flex justify-between items-center p-3 border-b border-gray-200 bg-gray-100 cursor-pointer transition-all duration-200"
              >
                <div className="flex flex-col">
                  <span className={`text-base text-gray-900 ${
                    selectedPortion === portion.portion_id ? "font-medium" : "font-normal"
                  }`}>
                    {`${portion.portion_name ? `${portion.portion_name} - ` : ''}₹${portion.price} (${
                      portion.unit_value
                    }${portion.unit_type ? ` ${portion.unit_type}` : ''})`}
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
        <label className="text-gray-600 mb-2 block text-sm">
          Select Portion
        </label>
        <div className="w-full">{renderPortionSelection()}</div>
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
            className={`text-xs ${
              (comments[selectedPortion]?.length || 0) > 50
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
                className={`flex items-center gap-1 px-3 py-2 rounded-full text-[13px] select-none transition-all duration-200 ${
                  suggestionSelected
                    ? "bg-green-50 border border-green-600 text-green-600"
                    : "bg-gray-100 border border-gray-200 text-gray-600"
                } ${
                  suggestionDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
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
            className={`w-full rounded-lg p-3 text-base transition-all duration-200 ${
              comments[selectedPortion]?.length < 5 && comments[selectedPortion]?.length > 0
                ? "border-red-600"
                : comments[selectedPortion]?.length > 50
                ? "border-red-600"
                : "border-gray-200"
            } border focus:outline-none focus:ring-0`}
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
              resize: "vertical"
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
        <div className="flex items-center border border-green-600 rounded-full p-1.5 bg-white flex-1">
          <button
            type="button"
            onClick={() =>
              handleQuantityChange(quantities[selectedPortion] - 1)
            }
            className={`w-10 h-10 rounded-full bg-[#07813a] text-white border-0 text-xl font-medium flex items-center justify-center mr-5 transition-all duration-200 ${
              quantities[selectedPortion] <= 0 ? 'opacity-50' : 'opacity-100'
            }`}
            disabled={quantities[selectedPortion] <= 0}
          >
            –
          </button>
          <span className="text-xl font-normal text-[#23232b] min-w-[24px] text-center flex-1">
            {quantities[selectedPortion]}
          </span>
          <button
            type="button"
            onClick={() =>
              handleQuantityChange(quantities[selectedPortion] + 1)
            }
            className="w-10 h-10 rounded-full bg-[#07813a] text-white border-0 text-xl font-medium flex items-center justify-center ml-5 transition-all duration-200"
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
