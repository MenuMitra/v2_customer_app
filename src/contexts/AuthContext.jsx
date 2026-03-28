import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

// Device info constant
const DEVICE_INFO = {
  fcm_token: "457896354789",
  device_id: "8974561234",
  device_model: "Laptop 122"
};

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
    
    // Store auth data in localStorage
    const auth = {
      userId: userData.user_id,
      name: userData.name,
      role: userData.role,
      mobile: userData.mobile,
      accessToken: userData.access_token,
      expiresAt: userData.expires_on  // Using expires_on from API
    };
    
    console.log('Storing auth data:', auth);
    localStorage.setItem('auth', JSON.stringify(auth));

    window.dispatchEvent(new CustomEvent('outlet:refresh'));
    
    setUser({
      id: userData.user_id,
      name: userData.name,
      role: userData.role,
      mobile: userData.mobile,
      accessToken: userData.access_token,
      expiresAt: userData.expires_on  // Using expires_on from API
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
  const getDeviceInfo = useCallback(() => DEVICE_INFO, []);

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
        getDeviceInfo
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
