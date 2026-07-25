import apiClient from "./apiClient";

const notificationAPI = {
  // Lấy danh sách thông báo của người dùng hiện tại
  getNotifications: () => apiClient.get("/notifications"),

  // Đánh dấu một thông báo là đã đọc
  markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),

  // Đánh dấu tất cả thông báo là đã đọc
  markAllAsRead: () => apiClient.put("/notifications/read-all"),
};

export default notificationAPI;
