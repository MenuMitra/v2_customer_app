import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { clearAppData } from "../utils/clearAppData";
import { useOutlet } from "./OutletContext";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user, setShowAuthOffcanvas } = useAuth();
  const { outletId, sectionId, orderSettings } = useOutlet();

  // Initialize cart items from localStorage
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    const auth = localStorage.getItem('auth');

    // Only restore cart if user is authenticated
    if (savedCart && auth) {
      return JSON.parse(savedCart);
    }
    return [];
  });

  // Add effect to clear cart when user changes
  useEffect(() => {
    if (!user) {
      console.log('CartContext - User is null, checking auth in localStorage');
      // Check if there's actually no auth data in localStorage
      const auth = localStorage.getItem('auth');
      if (!auth) {
        console.log('CartContext - No auth found, clearing cart');
        // Only clear cart if user is actually logged out
        setCartItems([]);
        localStorage.removeItem("cart");
      } else {
        console.log('CartContext - Auth found in localStorage, keeping cart');
      }
    }
  }, [user]); // This effect runs whenever user auth state changes

  // Add new useEffect to watch for outlet changes and clear mismatched items
  useEffect(() => {
    console.log('CartContext - outletId changed:', outletId);
    if (outletId && cartItems.length > 0) {
      // Filter out items that don't match current outlet
      const filteredItems = cartItems.filter(item => {
        // If the item has an outlet_id and it doesn't match current outlet, remove it
        if (item.outlet_id && item.outlet_id == outletId) {
          return true;
        }
        // If no outlet_id on item, keep it but it might be legacy
        if (!item.outlet_id) return true;

        console.log('CartContext - Filtering out item due to outlet mismatch:', {
          itemOutlet: item.outlet_id,
          currentOutlet: outletId
        });
        return false;
      });

      // Update cart if items were removed
      if (filteredItems.length !== cartItems.length) {
        console.log('CartContext - Updating cart with filtered items (mismatch cleared)');
        setCartItems(filteredItems);
      }
    }
  }, [outletId]); // This effect runs whenever outletId changes

  // Save cart items to localStorage when updated
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Modify addToCart to include outlet_id
  const addToCart = (
    menuItem,
    portionId,
    quantity,
    comment,
    forcedOutletId = null
  ) => {
    console.log('=== CartContext addToCart called ===');
    console.log('menuItem:', menuItem);
    console.log('portionId:', portionId);
    console.log('quantity:', quantity);
    console.log('comment:', comment);
    console.log('forcedOutletId:', forcedOutletId);

    const activeOutletId = forcedOutletId || outletId;
    console.log('using activeOutletId:', activeOutletId);

    // Check if user is authenticated
    const authData = localStorage.getItem("auth");
    if (!authData || !user) {
      console.log('User not authenticated, showing auth offcanvas');
      setShowAuthOffcanvas(true);
      return;
    }

    setCartItems((prevItems) => {
      console.log('Previous cart items:', prevItems);

      const existingItemIndex = prevItems.findIndex(
        (item) =>
          item.menuId == menuItem.menuId && item.portionId == portionId
      );

      console.log('Existing item index:', existingItemIndex);

      // Get the selected portion details
      const selectedPortion = menuItem.portions?.find(
        (p) => p.portion_id === portionId
      );

      console.log('Selected portion:', selectedPortion);

      // Validate price - ensure it's a valid number
      const validPrice = selectedPortion?.price
        ? parseFloat(selectedPortion.price) || 0
        : 0;

      console.log('Valid price:', validPrice);

      if (existingItemIndex !== -1) {
        const updatedItems = [...prevItems];
        if (quantity === 0) {
          console.log('Removing item from cart');
          updatedItems.splice(existingItemIndex, 1);
        } else {
          console.log('Updating existing item');
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: quantity,
            comment: comment,
            outlet_id: activeOutletId,
            price: validPrice,
            offer: menuItem.offer || null,
          };
        }
        console.log('Updated cart items state:', updatedItems);
        return updatedItems;
      } else if (quantity > 0) {
        const newItem = {
          menuId: menuItem.menuId,
          menuName: menuItem.menuName,
          portionId: portionId,
          portionName: selectedPortion?.portion_name,
          price: validPrice,
          quantity: quantity,
          comment: comment,
          outlet_id: activeOutletId,
          menu_cat_id: menuItem.menu_cat_id || menuItem.category_id,
          category_name: menuItem.category_name,
          offer: menuItem.offer || null,
        };
        console.log('Adding new item to cart:', newItem);
        const newCartItems = [...prevItems, newItem];
        console.log('New cart items:', newCartItems);
        return newCartItems;
      }
      console.log('No changes to cart');
      return prevItems;
    });
  };

  // Format cart for API
  const getFormattedOrderData = (userId) => {
    const orderData = {
      outlet_id: outletId,
      user_id: userId,
      section_id: orderSettings.section_id,
      order_type: orderSettings.order_type,
      order_items: cartItems.map((item) => ({
        menu_id: item.menuId,
        quantity: item.quantity,
        portion_name: item.portionName?.toLowerCase() || "",
        comment: item.comment || "",
      })),
      action: orderSettings.action,
    };

    // Only add coupon if it exists
    if (orderSettings.coupon) {
      orderData.coupon = orderSettings.coupon;
    }

    return orderData;
  };

  // Remove item from cart
  const removeFromCart = (menuId, portionId) => {
    setCartItems((prevItems) => {
      const next = prevItems.filter(
        (item) => !(item.menuId == menuId && item.portionId == portionId)
      );
      if (next.length === 0) {
        localStorage.removeItem("activeOrderId");
      }
      return next;
    });
  };

  // Update item quantity
  const updateQuantity = (menuId, portionId, quantity) => {
    // Check if user is authenticated
    const authData = localStorage.getItem("auth");
    if (!authData || !user) {
      setShowAuthOffcanvas(true);
      return;
    }

    if (quantity === 0) {
      removeFromCart(menuId, portionId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.menuId == menuId && item.portionId == portionId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Update the clearCart method to be simpler since we handle logout separately
  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem("cart");
    localStorage.removeItem("activeOrderId");
  }, []); // Remove onLogout dependency since we handle it via useEffect

  // Update getCartTotal to handle invalid prices
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = parseFloat(item.price) || 0;
      const itemQuantity = parseInt(item.quantity) || 0;
      return total + (itemPrice * itemQuantity);
    }, 0);
  };

  // Get cart items count (unique items, not quantities)
  const getCartCount = () => {
    return cartItems.length; // This will return the number of unique items in cart
  };

  // Update comment for an item
  const updateComment = (menuId, portionId, comment) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.menuId == menuId && item.portionId == portionId
          ? { ...item, comment }
          : item
      )
    );
  };

  // Update getCartItemComment to be portion-specific
  const getCartItemComment = (menuId, portionId) => {
    const cartItem = cartItems.find(
      (item) => item.menuId == menuId && item.portionId == portionId
    );
    return cartItem?.comment || "";
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getFormattedOrderData,
    updateComment,
    getCartItemComment,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
