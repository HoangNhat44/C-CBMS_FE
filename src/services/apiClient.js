import axios from 'axios';

const configuredBaseUrl = process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '');
const API_BASE_URL = configuredBaseUrl
  ? `${configuredBaseUrl}${configuredBaseUrl.endsWith('/api') ? '' : '/api'}`
  : '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add token if available
    let token = localStorage.getItem('token');
    if (!token) {
      const currentDashboard = localStorage.getItem('current_dashboard');
      if (currentDashboard === 'staff') {
        token = 'simulated_staff_token_jwt';
      } else if (currentDashboard === 'owner') {
        token = 'simulated_owner_token_jwt';
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Standardize permission error messages across the entire app
      // Completely replace response data to ensure we overwrite any primitive strings sent by backend
      error.response.data = { message: "Bạn không có quyền để thực hiện hành động này" };
    }
    return Promise.reject(error);
  }
);

export default apiClient;
