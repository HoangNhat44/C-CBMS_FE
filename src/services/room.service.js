import apiClient from "./apiClient";

const API_URL = "/rooms";

const roomAPI = {
  getAllRooms: async ({ branchId = "", status = "" } = {}) => {
    const params = new URLSearchParams();
    if (branchId) params.append("branchId", branchId);
    if (status) params.append("status", status);

    const res = await apiClient.get(`${API_URL}${params.toString() ? `?${params.toString()}` : ""}`);
    return res.data;
  },

  getRoomById: async (id) => {
    const res = await apiClient.get(`${API_URL}/${id}`);
    return res.data;
  },

  createRoom: async (formData) => {
    const res = await apiClient.post(API_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  updateRoom: async (id, formData) => {
    const res = await apiClient.put(`${API_URL}/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  updateRoomStatus: async (id, status) => {
    const res = await apiClient.patch(`${API_URL}/${id}/status`, { status });
    return res.data;
  },
};

export default roomAPI;
