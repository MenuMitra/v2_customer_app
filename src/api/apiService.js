import axiosInstance from './axios';
import { ENV } from '../config';
// API version constant
export const apiService = {
  // Common API calls that return different data shapes
  common: {
    getAllMenuListByCategory: async ({ outletId }) => {
      // Get user ID from auth data if available
      const authData = localStorage.getItem('auth');
      const auth = authData ? JSON.parse(authData) : null;
      const userId = auth?.userId;

      const response = await axiosInstance.post(`${ENV.V2_COMMON_BASE}/user/get_all_menu_list_by_category`, {
        outlet_id: outletId,
        app_source: "user_app",
        user_id: userId || null
      });

      return response?.data?.detail || {};
    },
  },

  // Categories - uses common API but returns only categories
  categories: {
    getList: async ({ outletId }) => {
      const data = await apiService.common.getAllMenuListByCategory({ outletId });
      return data.category || [];
    },
  },

  // Menu Items - uses common API but returns filtered data
  menus: {
    getByCategory: async ({ outletId, categoryId }) => {
      const data = await apiService.common.getAllMenuListByCategory({ outletId });

      return {
        category: data.category?.find(cat =>
          cat.menu_cat_id.toString() === categoryId.toString()
        ),
        menus: data.menus?.filter(menu =>
          menu.menu_cat_id.toString() === categoryId.toString()
        ) || []
      };
    },
    getSpecialMenus: async ({ outletId, userId }) => {
      const response = await axiosInstance.post(`${ENV.V2_COMMON_BASE}/user/get_special_menu_list`, {
        outlet_id: outletId,
        user_id: userId,
        app_source: "user_app"
      });
      return response?.data?.detail || {};
    },
    getDetails: async ({ outletId, menuId, menuCatId, userId }) => {
      const response = await axiosInstance.post(`${ENV.V2_COMMON_BASE}/user/get_menu_details`, {
        outlet_id: outletId,
        menu_id: Number(menuId),
        menu_cat_id: Number(menuCatId),
        user_id: userId ? Number(userId) : null,
        app_source: "user_app"
      });

      const details = response?.data?.details;
      const images = details?.menu_images?.map(img => img.image) || [];

      // `get_menu_details` returns portion options under `portions_data`.
      // Normalize to the app's `portions` shape: { portion_id, portion_name, price, unit_value, unit_type }.
      const rawPortionsData = Array.isArray(details?.portions_data)
        ? details.portions_data
        : [];
      const rawPortions = rawPortionsData.map((p) => ({
        portion_id: Number(p?.menu_portions_id ?? p?.portion_id ?? 0),
        portion_name: String(p?.portions_name ?? p?.portion_name ?? "").trim() || "Default",
        // Keep both fields so UI can apply fallback priority.
        price: p?.price,
        default_price: p?.default_price,
        unit_value: p?.unit_value ?? "",
        unit_type: p?.unit_type ?? "",
      }));
      const fallbackPrice =
        details?.default_price ??
        details?.dine_in_price ??
        details?.parcel_price ??
        details?.delivery_price ??
        details?.drive_through_price ??
        null;
      const portions =
        rawPortions.length > 0
          ? rawPortions
          : (fallbackPrice != null
            ? [
              {
                portion_id: 0,
                portion_name: "Default",
                price: Number(fallbackPrice),
                default_price: Number(fallbackPrice),
                unit_value: 1,
                unit_type: "",
              },
            ]
            : []);

      return {
        ...details,
        images,
        portions
      };
    },
    // POS: menu_view (Product Detail) endpoint
    viewDetails: async ({ outletId, menuId, userId }) => {
      const response = await axiosInstance.post(
        `${ENV.V2_COMMON_BASE}/user/menu_view`,
        {
          outlet_id: String(outletId),
          menu_id: Number(menuId),
          user_id: userId ? String(userId) : null,
          app_source: "pos_app",
        }
      );

      const details = response?.data?.detail || response?.data?.details || null;
      const images = Array.isArray(details?.images)
        ? details.images.map((img) => img?.image || img).filter(Boolean)
        : [];

      const rawPortions = Array.isArray(details?.portions_data)
        ? details.portions_data
        : [];

      // Map POS portions_data -> existing app "portions" shape
      const portions = rawPortions.map((p) => {
        const price =
          p?.dine_in_price ??
          p?.parcel_price ??
          p?.delivery_price ??
          p?.drive_through_price ??
          p?.default_price ??
          p?.price ??
          0;
        return {
          portion_id: Number(p?.menu_portions_id ?? p?.portion_id ?? 0),
          portion_name: String(p?.portions_name ?? p?.portion_name ?? "").trim() || "Default",
          price: Number(price) || 0,
          unit_value: p?.unit_value ?? "",
          unit_type: p?.unit_type ?? "",
          flag: p?.flag ?? null,
        };
      });

      // If server sends no portions, provide fallback from default pricing fields
      const fallbackPrice =
        details?.default_price ??
        details?.dine_in_price ??
        details?.parcel_price ??
        details?.delivery_price ??
        details?.drive_through_price ??
        null;

      const normalizedPortions =
        portions.length > 0
          ? // Prefer "flag==1" (default portion) first when present
            [...portions].sort((a, b) => Number(b?.flag === 1) - Number(a?.flag === 1))
          : (fallbackPrice != null
            ? [
              {
                portion_id: 0,
                portion_name: "Default",
                price: Number(fallbackPrice),
                unit_value: 1,
                unit_type: "",
              },
            ]
            : []);

      if (!details) return null;

      // Normalize keys to match the rest of the app where possible
      return {
        ...details,
        menu_name: details?.menu_name ?? details?.name,
        menu_food_type: details?.menu_food_type ?? details?.food_type,
        images,
        portions: normalizedPortions,
      };
    },
    searchMenus: async ({ outletId, userId, keyword }) => {
      // Get user ID from auth data if not provided
      if (!userId) {
        const authData = localStorage.getItem('auth');
        const auth = authData ? JSON.parse(authData) : null;
        userId = auth?.userId;
      }

      const payload = {
        outlet_id: outletId,
        user_id: userId || null,
        app_source: "user_app",
      };
      if (keyword !== undefined && keyword !== null && keyword.trim() !== "") {
        payload.keyword = keyword.trim();
      }
      const response = await axiosInstance.post(`${ENV.V2_COMMON_BASE}/user/search_menu`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      const data = response?.data;
      const list = data?.detail?.menu_list;

      // Normalize portions from `portions_data` so UI can show price correctly in Search.
      if (Array.isArray(list)) {
        const normalized = list.map((menu) => {
          const rawPortions = Array.isArray(menu?.portions_data)
            ? menu.portions_data
            : [];

          const menuDefaultPrice =
            menu?.default_price ??
            menu?.price ??
            null;

          const portions =
            rawPortions.length > 0
              ? rawPortions.map((p) => {
                  const v =
                    p?.price ??
                    p?.default_price ??
                    menuDefaultPrice ??
                    0;
                  const n = Number(v);
                  return {
                    portion_id: Number(p?.menu_portions_id ?? p?.portion_id ?? 0),
                    portion_name: String(p?.portions_name ?? p?.portion_name ?? "")
                      .trim() || "Default",
                    price: Number.isFinite(n) ? n : 0,
                    default_price: p?.default_price ?? menuDefaultPrice ?? null,
                    unit_value: p?.unit_value ?? "",
                    unit_type: p?.unit_type ?? "",
                    flag: p?.flag ?? null,
                  };
                })
              : (menuDefaultPrice != null
                  ? [
                      {
                        portion_id: 0,
                        portion_name: "Default",
                        price: Number(menuDefaultPrice) || 0,
                        default_price: Number(menuDefaultPrice) || 0,
                        unit_value: 1,
                        unit_type: "",
                        flag: 1,
                      },
                    ]
                  : []);

          return {
            ...menu,
            portions,
          };
        });

        return {
          ...data,
          detail: {
            ...(data?.detail || {}),
            menu_list: normalized,
          },
        };
      }

      return data;
    },
  },

  // Favorites
  favorites: {
    getList: async ({ outletId, userId }) => {
      const response = await axiosInstance.post(`${ENV.V2_COMMON_BASE}/user/get_favourite_list`, {
        outlet_id: outletId,
        user_id: userId,
        app_source: "user_app"
      });
      return response?.data?.detail?.lists || {};
    },
    add: async ({ outletId, userId, menuId }) => {
      const response = await axiosInstance.post(`${ENV.V2_COMMON_BASE}/user/save_favourite_menu`, {
        outlet_id: outletId,
        user_id: userId,
        menu_id: menuId,
        app_source: "user_app"
      });
      return response.data;
    },
    remove: async ({ outletId, userId, menuId }) => {
      const response = await axiosInstance.post(`${ENV.V2_COMMON_BASE}/user/remove_favourite_menu`, {
        outlet_id: outletId,
        user_id: userId,
        menu_id: menuId,
        app_source: "user_app"
      });
      return response.data;
    },
  },

  // Add a new section for checkout related APIs
  checkout: {
    getDetails: async ({ outletId, orderItems, orderComboItems }) => {
      const payload = {
        outlet_id: outletId,
        order_items: orderItems || [],
        app_source: "user_app",
      };

      // Some backends accept combos in a separate list for checkout preview.
      if (Array.isArray(orderComboItems) && orderComboItems.length > 0) {
        payload.order_combo_items = orderComboItems;
      }

      const response = await axiosInstance.post(
        `${ENV.V2_COMMON_BASE}/user/get_checkout_detail`,
        payload
      );
      return response?.data?.detail || {};
    },

    createOrder: async ({
      outletId,
      userId,
      sectionId,
      tableId,
      orderType,
      orderItems,
      coupon,
      action = "create_order",
      appSource = "user_app",
    }) => {
      const items = orderItems || [];
      const order_items = [];
      const order_combo_items = [];

      for (const item of items) {
        const hasCombo =
          item.combo_master_id != null &&
          item.combo_master_id !== undefined &&
          item.combo_master_id !== "";

        if (hasCombo) {
          order_combo_items.push({
            combo_master_id: Number(item.combo_master_id),
            quantity: Number(item.quantity),
            comment: item.comment || "",
          });
        } else {
          order_items.push({
            menu_id: String(item.menu_id ?? item.menuId),
            quantity: Number(item.quantity),
            comment: item.comment || "",
          });
        }
      }

      const payload = {
        outlet_id: String(outletId),
        user_id: String(userId),
        section_id: String(sectionId),
        order_type: orderType || "dine-in",
        order_items,
        order_combo_items,
        action,
        app_source: appSource,
      };

      if (coupon) payload.coupon = coupon;
      if (payload.order_type === "dine-in" && tableId) {
        payload.table_id = String(tableId);
      }

      const response = await axiosInstance.post(
        `${ENV.V2_COMMON_BASE}/common/create_order`,
        payload
      );
      return response?.data || {};
    },

    addMenusToOrder: async ({ orderId, outletId, orderItems }) => {
      const response = await axiosInstance.post(
        `${ENV.V2_COMMON_BASE}/common/add_menus_to_order`,
        {
          order_id: String(orderId),
          outlet_id: String(outletId),
          order_items: (orderItems || []).map((item) => {
            if (
              item.combo_master_id != null &&
              item.combo_master_id !== undefined &&
              item.combo_master_id !== ""
            ) {
              return {
                combo_master_id: String(item.combo_master_id),
                quantity: String(item.quantity),
                portion_name: item.portion_name || "",
                comment: item.comment || "",
              };
            }
            return {
              menu_id: String(item.menu_id),
              quantity: String(item.quantity),
              portion_name: item.portion_name || "",
              comment: item.comment || "",
            };
          }),
          app_source: "user_app",
        }
      );
      return response?.data || {};
    },

    getOrderDetails: async ({ orderId, userId }) => {
      const response = await axiosInstance.post(
        `${ENV.V2_COMMON_BASE}/user/get_order_details`,
        {
          order_id: String(orderId),
          user_id: Number(userId),
          app_source: "user_app",
        }
      );
      return response?.data?.detail || null;
    },

    checkExistingOrder: async ({ userId, outletId, tableId, sectionId }) => {
      console.log('Checking existing order for:', {
        userId,
        outletId,
        tableId,
        sectionId,
      });
      try {
        const payload = {
          user_id: userId?.toString(),
          outlet_id: outletId?.toString(),
          app_source: "user_app"
        };
        if (tableId) {
          payload.table_id = tableId.toString();
        }
        if (sectionId) {
          payload.section_id = sectionId.toString();
        }
        console.log('checkExistingOrder payload:', payload);
        const response = await axiosInstance.post(`${ENV.V2_COMMON_BASE}/user/check_order_exist`, payload);

        console.log('checkExistingOrder response:', response.data);
        return response.data?.detail || null;
      } catch (error) {
        console.error('checkExistingOrder error:', error);
        // If no order exists, API returns error - this is expected behavior
        return null;
      }
    },

    addToExistingOrder: async ({ orderId, userId, outletId, orderItems }) => {
      const menuItems = [];
      const comboItems = [];

      for (const item of orderItems || []) {
        const comboId = item?.combo_master_id ?? item?.comboMasterId ?? null;
        if (comboId !== null && comboId !== undefined && comboId !== "") {
          comboItems.push({
            combo_master_id: Number(comboId),
            quantity: Number(item?.quantity ?? 0),
            comment: item?.comment || "",
          });
          continue;
        }

        const portionId = item?.portion_id ?? item?.portionId ?? null;
        const portionName = item?.portion_name ?? item?.portionName ?? "";
        const payload = {
          menu_id: Number(item?.menu_id ?? item?.menuId),
          quantity: Number(item?.quantity ?? 0),
          comment: item?.comment || "",
        };

        // Backend may fail when portion_id is 0/invalid; omit it to allow default pricing.
        if (
          portionId !== null &&
          portionId !== undefined &&
          Number.isFinite(Number(portionId)) &&
          Number(portionId) !== 0
        ) {
          payload.portion_id = Number(portionId);
        }
        if (portionName) {
          payload.portion_name = String(portionName).toLowerCase();
        }

        menuItems.push(payload);
      }

      // Some backend deployments enforce non-empty `order_items` even when
      // combo payload is provided in `order_combo_items`.
      // For combo-only carts, mirror combo objects in `order_items` to satisfy
      // validation while preserving the explicit combo list.
      const orderItemsPayload =
        menuItems.length > 0
          ? menuItems
          : comboItems.map((combo) => ({
              combo_master_id: Number(combo.combo_master_id),
              quantity: Number(combo.quantity),
              comment: combo.comment || "",
            }));

      const response = await axiosInstance.post(
        `${ENV.V2_COMMON_BASE}/user/add_to_existing_order`,
        {
          order_id: orderId.toString(),
          user_id: userId.toString(),
          outlet_id: outletId.toString(),
          app_source: "user_app",
          order_items: orderItemsPayload,
          ...(comboItems.length > 0 ? { order_combo_items: comboItems } : {}),
        }
      );
      return response.data?.detail || null;
    },

    cancelExistingAndCreateNew: async ({
      orderId,
      userId,
      orderStatus = "cancelled",
      outletId,
      sectionId,
      tableId,
      orderType,
      orderItems,
      appSource = "user_app"
    }) => {
      const payload = {
        order_id: orderId.toString(),
        user_id: userId.toString(),
        order_status: orderStatus,
        outlet_id: outletId.toString(),
        section_id: sectionId.toString(),
        order_type: orderType || "dine-in",
        app_source: appSource,
        order_items: orderItems.map((item) => {
          if (
            item.combo_master_id != null &&
            item.combo_master_id !== undefined &&
            item.combo_master_id !== ""
          ) {
            return {
              combo_master_id: String(item.combo_master_id),
              quantity: Number(item.quantity),
              comment: item.comment || "",
              portion_name: item.portion_name || "",
            };
          }
          return {
            menu_id: item.menu_id.toString(),
            quantity: Number(item.quantity),
            comment: item.comment || "",
            portion_name: item.portion_name || "",
          };
        }),
      };

      // Only add table_id if it's provided and not null/undefined
      if (tableId && tableId !== "null") {
        payload.table_id = tableId.toString();
      }

      const response = await axiosInstance.post(
        `${ENV.V2_COMMON_BASE}/user/complete_or_cancel_existing_order_create_new_order`,
        payload
      );
      return response.data?.detail || null;
    }
  },

  // Customer related APIs
  customer: {
    getRestaurantDetails: async ({ outletId }) => {
      const response = await axiosInstance.post(`/user/get_restaurant_details`, {
        outlet_id: outletId,
        app_source: "user_app"
      });
      return response?.data?.detail || {};
    },
    getSavings: async ({ userId }) => {
      const response = await axiosInstance.post(`/user/get_user_count`, {
        user_id: parseInt(userId),
        app_source: "user_app"
      });
      return response?.data?.detail || {};
    },

    getAllRestaurants: async () => {
      const response = await axiosInstance.get(`${ENV.V2_COMMON_BASE}/user/get_all_restaurants`, {
        headers: {
          app_source: "user_app"
        }
      });
      return response?.data?.detail?.outlets || [];
    },

    getOrderHistory: async ({ userId, outletId }) => {
      const response = await axiosInstance.post(`${ENV.V2_COMMON_BASE}/user/get_completed_and_cancel_order_list`, {
        user_id: parseInt(userId),
        outlet_id: outletId,
        app_source: "user_app"
      });
      return response?.data?.detail?.lists || {};
    },

    // Add this new method
    getOngoingOrders: async ({ userId, outletId }) => {
      const response = await axiosInstance.post(`/user/get_ongoing_or_placed_order`, {
        user_id: parseInt(userId),
        outlet_id: outletId,
        app_source: "user_app"
      });
      return response?.data?.detail?.orders || [];
    },

    cancelOrder: async ({ outletId, orderId, note }) => {
      const response = await axiosInstance.post(`${ENV.V2_COMMON_BASE}/user/cancel_order`, {
        outlet_id: String(outletId),
        order_id: String(orderId),
        note: note || "",
        app_source: "user_app",
      });
      return response.data;
    },
  },

  // ... other API endpoints grouped by feature
};

// Error handling wrapper
const withErrorHandling = (apiCall) => {
  return async (...args) => {
    try {
      const response = await apiCall(...args);
      return response;
    } catch (error) {
      // Standardize error format
      const standardError = {
        message:
          error.response?.data?.message ||
          error.response?.data?.detail ||
          "NOT FOUND",
        detail: error.response?.data?.detail || null,
        status: error.response?.status,
        data: error.response?.data || null,
      };
      throw standardError;
    }
  };
};

// Wrap all API calls with error handling
Object.keys(apiService).forEach(feature => {
  Object.keys(apiService[feature]).forEach(method => {
    apiService[feature][method] = withErrorHandling(apiService[feature][method]);
  });
});

export default apiService;
