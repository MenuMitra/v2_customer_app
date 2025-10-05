// src/hooks/useCategories.js
import { useQuery } from '@tanstack/react-query';
import apiService from '../api/apiService';
import { useOutlet } from '../contexts/OutletContext';
import { useAuth } from '../contexts/AuthContext';

export const useCategories = () => {
  const { outletId } = useOutlet();
  const { getUserId } = useAuth();
  
  return useQuery({
    queryKey: ['categories', outletId],
    queryFn: () => apiService.categories.getList({ 
      outletId, 
      userId: getUserId() 
    }),
    enabled: !!outletId,
  });
};