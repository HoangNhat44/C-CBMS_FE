import apiClient from './apiClient';

const bookingAPI = {
  // Lấy layout đặt lịch
  getBookingLayout: (branchId, date) => apiClient.get(`/bookings/layout?branchId=${branchId}&date=${date}`),

  // Lấy tất cả bookings
  getAllBookings: () => apiClient.get('/bookings'),

  // Lấy booking theo ID
  getBookingById: (id) => apiClient.get(`/bookings/${id}`),

  // Tạo booking mới
  createBooking: (data) => apiClient.post('/bookings', data),

  // Cập nhật booking
  updateBooking: (id, data) => apiClient.put(`/bookings/${id}`, data),

  // Xóa booking
  deleteBooking: (id) => apiClient.delete(`/bookings/${id}`),
};

export default bookingAPI;
