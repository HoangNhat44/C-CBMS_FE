import apiClient from './apiClient';

const authAPI = {
  // Login
  login: (email, password) => 
    apiClient.post('/auth/login', { email, password }),

  // Register
  register: (data) => 
    apiClient.post('/auth/register', data),

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    return Promise.resolve();
  },

  // Verify token
  verifyToken: () => 
    apiClient.get('/auth/verify'),
};

export default authAPI;
