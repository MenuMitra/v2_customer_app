// import { useState } from 'react';
// import { useAuth } from '../../contexts/AuthContext';
// import { useOutlet } from '../../contexts/OutletContext';
// import { useCacheData } from '../../contexts/CacheDataContext';

// const API_BASE_URL = 'https://menu4.xyz/v2';

// export const useFavorite = () => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const { getUserId } = useAuth();
//   const { outletId } = useOutlet();
//   const { fetchData, clearCacheItem } = useCacheData();

//   // Helper function to get auth data
//   const getAuthData = () => {
//     try {
//       const authData = localStorage.getItem('auth');
//       return authData ? JSON.parse(authData) : null;
//     } catch (error) {
//       console.error('Error parsing auth data:', error);
//       return null;
//     }
//   };

//   const getFavorites = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const authData = getAuthData();
//       const accessToken = authData?.accessToken;
//       const userId = authData?.userId;

//       if (!accessToken || !userId) {
//         throw new Error('Please login to view favorites');
//       }

//       // Use caching system
//       const response = await fetchData('user/get_favourite_list', {
//         outlet_id: outletId,
//         user_id: userId,
//         app_source: "user_app",
//       });

//       if (response.detail && response.detail.lists) {
//         return Object.values(response.detail.lists).flat();
//       }
//       return [];
//     } catch (err) {
//       setError(err.message || 'Failed to load favorite items');
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const toggleFavorite = async (menuId, isFavorite) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const authData = getAuthData();
//       const accessToken = authData?.accessToken;
//       const userId = authData?.userId;

//       if (!accessToken || !userId) {
//         throw new Error('Please login to manage favorites');
//       }

//       const endpoint = isFavorite 
//         ? `remove_favourite_menu`
//         : `save_favourite_menu`;

//       const response = await fetchData(endpoint, {
//         outlet_id: outletId,
//         user_id: userId,
//         menu_id: menuId,
//         app_source: "user_app",
//       }, { forceRefresh: true });

//       // Clear favorites cache after adding/removing a favorite
//       clearCacheItem('user/get_favourite_list');

//       return response;
//     } catch (err) {
//       setError(err.message || 'Failed to update favorite status');
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   return {
//     getFavorites,
//     toggleFavorite,
//     loading,
//     error
//   };
// }; 