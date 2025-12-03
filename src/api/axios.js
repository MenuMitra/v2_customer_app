import axios from 'axios';
import {ENV} from '../config';
// API configuration
const API_BASE_URL = ENV.V2_COMMON_BASE;
export const API_VERSION = '/v2';
export const APP_PREFIX = '/user';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Update the request interceptor to properly add 'Bearer' prefix
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const { accessToken } = JSON.parse(authData);
        if (accessToken) {
          // Set the exact format as seen in the working requests
          config.headers.Authorization = `Bearer ${accessToken}`;
          // Add other common headers if needed
          config.headers['Accept'] = 'application/json';
        }
      }
      return config;
    } catch (error) {
      console.error('Error setting auth header:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance; 