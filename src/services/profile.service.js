import apiClient from './apiClient';

const profileService = {
  // Lấy thông tin cá nhân của người dùng đang đăng nhập
  getProfile: () => apiClient.get('/profile'),

  // Cập nhật thông tin cá nhân
  updateProfile: (data) => apiClient.put('/profile', data),
};

export default profileService;
