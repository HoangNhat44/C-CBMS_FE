import apiClient from "./apiClient";

const paymentAPI = {
  // Tạo link thanh toán PayOS
  createPaymentUrl: (bookingId, paymentType = "full") =>
    apiClient.post("/payments/create-url", {
      booking_id: bookingId,
      payment_type: paymentType,
    }),

  // Hủy/Đóng liên kết QR tạm
  closeQr: (paymentId, paymentLinkId, orderCode) =>
    apiClient.post("/payments/close-qr", {
      payment_id: paymentId,
      payment_link_id: paymentLinkId,
      order_code: orderCode,
    }),

  // Thanh toán thủ công cho Admin
  processPayment: (bookingId, amountPaid) =>
    apiClient.post("/payments/process", {
      booking_id: bookingId,
      amount_paid: amountPaid,
    }),

  // Lấy chi tiết giao dịch
  getPaymentById: (id) => apiClient.get(`/payments/${id}`),
};

export default paymentAPI;
