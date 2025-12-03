import axios from 'axios';
import {ENV} from '../config/env';

const BASE_URL = `${ENV.V2_COMMON_BASE}/v2/user/`; // Replace with your actual base URL

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Response interceptor to simplify response handling
apiClient.interceptors.response.use(
  (response) => response.data, // Automatically extract response.data
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;
