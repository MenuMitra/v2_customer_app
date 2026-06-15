import { getDeviceInfo } from './deviceInfo';

export { getDeviceInfo };

export const clearAuthData = () => {
  // Clear all auth-related data
  localStorage.removeItem('auth');
  
  // Clear any other auth-related items
  // localStorage.removeItem('other_auth_related_item');
  
  // Clear any session storage if used
  // sessionStorage.clear();
};

export const getAuthData = () => {
  try {
    const authData = localStorage.getItem('auth');
    return authData ? JSON.parse(authData) : null;
  } catch (error) {
    console.error('Error parsing auth data:', error);
    return null;
  }
};

export const isAuthenticated = () => {
  const authData = getAuthData();
  if (!authData) return false;

  // Check if token is expired
  const expiresAt = new Date(authData.expiresAt).getTime();
  const now = new Date().getTime();
  
  return authData.accessToken && expiresAt > now;
};

export const getAccessToken = () => {
  const authData = getAuthData();
  return authData?.accessToken;
};

export const getUserRole = () => {
  const authData = getAuthData();
  return authData?.role;
};

export const getUserId = () => {
  const authData = getAuthData();
  return authData?.userId;
};

export const getUserMobile = () => {
  const authData = getAuthData();
  return authData?.mobile;
};

export const getUserName = () => {
  const authData = getAuthData();
  return authData?.name;
};
