import { useState, useEffect } from 'react';
import { useCacheData } from '../contexts/CacheDataContext';

/**
 * Custom hook for fetching banners with cache implementation
 * Follows the same pattern as CacheDataContext.fetchData
 */
export const useCachedBanners = ({ outletId, userId, enabled = true }) => {
  const { fetchData, dataSource } = useCacheData();
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !outletId) {
      setBanners([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchBanners = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get user ID from auth data if not provided
        let finalUserId = userId;
        if (!finalUserId) {
          const authData = localStorage.getItem('auth');
          const auth = authData ? JSON.parse(authData) : null;
          finalUserId = auth?.user_id;
        }

        const payload = {
          outlet_id: outletId,
          app_source: "customer_app"
        };

        // Only add user_id if it exists
        if (finalUserId) {
          payload.user_id = finalUserId;
        }

        // Use the cache context fetchData method
        const response = await fetchData('/user/banner_listview', payload, {
          forceRefresh: false,
          transformResponse: (data) => data?.banners || [],
          method: 'post'
        });

        // Ensure inactive banners are not shown
        const filtered = Array.isArray(response)
          ? response.filter((b) => String(b?.is_active) === '1')
          : [];
        setBanners(filtered);
      } catch (err) {
        console.error('Error fetching banners:', err);
        setError(err);
        setBanners([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, [outletId, userId, enabled, fetchData]);

  return {
    banners,
    isLoading,
    error,
    dataSource // Include data source to know if data came from cache or fresh
  };
};
