const ENV = import.meta.env.VITE_APP_ENV || 'development';

const CONFIG = {
  development: {
    API_BASE_URL: 'https://ghanish.in/v2/user/',
  },
  production: {
    API_BASE_URL: 'https://menusmitra.xyz/v2/user/',
  },
};

// Ensure we have a valid environment, fallback to development if not
const CURRENT_ENV = CONFIG[ENV] ? ENV : 'development';

// Export the configuration for the current environment
export const API_CONFIG = {
  BASE_URL: CONFIG[CURRENT_ENV].API_BASE_URL,
};

// Helper function to get complete API URL
export const getApiUrl = (endpoint) => {
  // Remove leading slash if it exists to prevent double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}${cleanEndpoint}`;
}; 