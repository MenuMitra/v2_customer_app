import { useQuery } from '@tanstack/react-query';
import apiService from '../api/apiService';

export const useBanners = ({ outletId, userId, enabled = true }) => {
  return useQuery({
    queryKey: ['banners', outletId, userId],
    queryFn: () => apiService.banners.getList({ outletId, userId }),
    enabled: enabled && !!outletId,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};
