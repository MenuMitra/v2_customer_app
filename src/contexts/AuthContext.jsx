import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getDeviceInfo } from '../utils/deviceInfo';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [showAuthOffcanvas, setShowAuthOffcanvas] = useState(false);

  // Internal helper function to get auth data from localStorage
  const getAuthData = useCallback(() => {
    try {
      const authData = localStorage.getItem('auth');
      return authData ? JSON.parse(authData) : null;
    } catch (error) {
      console.error('Error parsing auth data:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Check localStorage for existing auth data on mount
    const authData = getAuthData();
    if (authData) {
      setUser({
        id: authData.userId,
        name: authData.name,
        role: authData.role,
        mobile: authData.mobile,
        accessToken: authData.accessToken,
        expiresAt: authData.expiresAt
      });
    }
  }, [getAuthData]);

  const handleLoginSuccess = (userData) => {
    console.log('Login Success - API Response:', userData);

    // Support both naming conventions from different API versions/endpoints
    const userId = userData.user_id || userData.id;
    const accessToken = userData.access_token || userData.accessToken;
    const expiresAt = userData.expires_at || userData.expires_on || userData.expiresAt;

    // Store auth data in localStorage
    const auth = {
      userId: userId,
      name: userData.name,
      role: userData.role,
      mobile: userData.mobile,
      accessToken: accessToken,
      expiresAt: expiresAt
    };

    console.log('Storing auth data:', auth);
    localStorage.setItem('auth', JSON.stringify(auth));

    window.dispatchEvent(new CustomEvent('outlet:refresh'));

    setUser({
      id: userId,
      name: userData.name,
      role: userData.role,
      mobile: userData.mobile,
      accessToken: accessToken,
      expiresAt: expiresAt
    });
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('auth');
    setUser(null);

    // Dispatch cache clear event
    window.dispatchEvent(new CustomEvent('cache:clear'));
  }, []);

  // Auth utility functions using React state
  const isAuthenticated = useCallback(() => {
    console.log('isAuthenticated check:', {
      user,
      userExists: !!user,
      accessToken: user?.accessToken,
      expiresAt: user?.expiresAt,
      expiresAtType: typeof user?.expiresAt
    });

    // Simplified check - just check if user exists and has access token
    if (!user) return false;

    // For now, just check if user exists and has access token
    const isValid = !!user.accessToken;

    console.log('Auth check result:', {
      isValid,
      accessTokenExists: !!user.accessToken,
      userExists: !!user
    });

    return isValid;
  }, [user]);

  const getAccessToken = useCallback(() => user?.accessToken, [user]);
  const getUserRole = useCallback(() => user?.role, [user]);
  const getUserId = useCallback(() => user?.id, [user]);
  const getUserMobile = useCallback(() => user?.mobile, [user]);
  const getUserName = useCallback(() => user?.name, [user]);
  const getDeviceInfoMemo = useCallback(() => getDeviceInfo(), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: isAuthenticated(), // Call the function here
        showAuthOffcanvas,
        setShowAuthOffcanvas,
        handleLoginSuccess,
        handleLogout,
        // Expose utility functions
        getAccessToken,
        getUserRole,
        getUserId,
        getUserMobile,
        getUserName,
        getDeviceInfo: getDeviceInfoMemo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
