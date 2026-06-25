import apiClient from './apiClient';

const slotAPI = {
  // Lấy danh sách tất cả slots
  getAllSlots: () => apiClient.get('/slots'),

  // Lấy chi tiết slot theo ID
  getSlotById: (id) => apiClient.get(`/slots/${id}`),

  // Tạo mới slot (Chỉ Owner)
  createSlot: (data) => apiClient.post('/slots', data),

  // Cập nhật slot (Chỉ Owner)
  updateSlot: (id, data) => apiClient.put(`/slots/${id}`, data),

  // Vô hiệu hóa/Xóa mềm slot (Chỉ Owner)
  deleteSlot: (id) => apiClient.delete(`/slots/${id}`),
};

export default slotAPI;
