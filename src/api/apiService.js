import axiosInstance from './axios';
import {ENV} from '../config';
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
        app_source: "customer_app"
      });
      
      const details = response?.data?.details;
      return {
        ...details,
        images: details?.menu_images?.map(img => img.image) || []
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
      return response?.data;
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
    getDetails: async ({ outletId, orderItems }) => {
      const response = await axiosInstance.post(`${ENV.V2_COMMON_BASE}/user/get_checkout_detail`, {
        outlet_id: outletId,
        order_items: orderItems,
        app_source: "user_app"
      });
      return response?.data?.detail || {};
    },
    
    checkExistingOrder: async ({ userId, outletId }) => {
      try {
        const response = await axiosInstance.post(`${ENV.V2_COMMON_BASE}/user/check_order_exist`, {
          user_id: userId,
          outlet_id: outletId,
          app_source: "user_app"
        });
        
        return response.data?.detail || null;
      } catch (error) {
        // If no order exists, API returns error - this is expected behavior
        return null;
      }
    },

    addToExistingOrder: async ({ orderId, userId, outletId, orderItems }) => {
      const response = await axiosInstance.post(`${ENV.V2_COMMON_BASE}/user/add_to_existing_order`, {
        order_id: orderId.toString(),
        user_id: userId.toString(),
        outlet_id: outletId.toString(),
        app_source: "user_app",
        order_items: orderItems
      });
      return response.data?.detail || null;
    },

    cancelExistingAndCreateNew: async ({ 
      orderId, 
      userId, 
      outletId, 
      sectionId, 
      tableId, 
      orderItems 
    }) => {
      const response = await axiosInstance.post(
        `${ENV.V2_COMMON_BASE}/user/complete_or_cancel_existing_order_create_new_order`,
        {
          order_id: orderId.toString(),
          user_id: userId,
          order_status: "cancelled",
          outlet_id: outletId.toString(),
          section_id: sectionId.toString(),
          order_type: "dine-in",
          app_source: "user_app",
          table_id: tableId.toString(),
          order_items: orderItems
        }
      );
      return response.data?.detail || null;
    }
  },

  // Banner related APIs
  banners: {
    getList: async ({ outletId, userId }) => {
      // Get user ID from auth data if not provided
      if (!userId) {
        const authData = localStorage.getItem('auth');
        const auth = authData ? JSON.parse(authData) : null;
        userId = auth?.user_id;
      }

      const payload = {
        outlet_id: outletId,
        app_source: "customer_app"
      };

      // Only add user_id if it exists
      if (userId) {
        payload.user_id = userId;
      }

      const response = await axiosInstance.post(`${ENV.V2_COMMON_BASE}/user/banner_listview`, payload);
      return response?.data?.banners || [];
    },
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
          app_source: "customer_app"
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
      const response = await axiosInstance.post(`/user/cancel_order`, {
        outlet_id: outletId,
        order_id: orderId,
        note,
        app_source: "user_app"
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
        message: error.response?.data?.message || 'NOT FOUND',
        status: error.response?.status,
        // originalError: error
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
