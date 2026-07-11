import apiClient from './apiClient';

const slotAPI = {
  // Lấy danh sách tất cả slots
  getAllSlots: () => apiClient.get('/slots'),

  // Lấy chi tiết slot theo ID
  getSlotById: (id) => apiClient.get(`/slots/${id}`),

  // Tạo mới slot (Chỉ Owner)
  createSlot: (data) => apiClient.post('/slots', data),

  // Cập nhật slot
  updateSlot: (id, data) => apiClient.put(`/slots/${id}`, data),

  // Cập nhật trạng thái slot (kích hoạt/tạm khóa)
  updateSlotStatus: (id, isActive) => apiClient.patch(`/slots/${id}/status`, { isActive }),
};

export default slotAPI;
