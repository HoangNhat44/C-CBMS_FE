import apiClient from './apiClient';

const authAPI = {
  // Login
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  // Register
  register: (data) =>
    apiClient.post('/auth/register', data),

  // Forgot password
  forgotPassword: (email) =>
    apiClient.post('/auth/forgot-password', { email }),

  // Reset password
  resetPassword: (token, password, confirmPassword) =>
    apiClient.post('/auth/reset-password', {
      token,
      password,
      confirmPassword,
    }),

  // Change password
  changePassword: (currentPassword, newPassword, confirmPassword) =>
    apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    }),

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