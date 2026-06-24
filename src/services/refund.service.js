import apiClient from "./apiClient";

const refundAPI = {
  // Gửi yêu cầu hoàn tiền
  createRefundRequest: (data) => apiClient.post("/refunds", data),

  // Lấy chi tiết yêu cầu hoàn tiền theo Booking ID
  getRefundByBookingId: (bookingId) => apiClient.get(`/refunds/booking/${bookingId}`),

  // Chủ cửa hàng phê duyệt yêu cầu hoàn tiền
  approveRefund: (refundId, data) => apiClient.put(`/refunds/${refundId}/approve`, data),
};

export default refundAPI;
