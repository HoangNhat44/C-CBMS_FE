import apiClient from "./apiClient";

const API_URL = "/room-types";

const roomTypeAPI = {
  getAllRoomTypes: async () => {
    const res = await apiClient.get(API_URL);
    return res.data;
  },

  getPublicRoomTypes: async () => {
    const res = await apiClient.get(`${API_URL}/public`);
    return res.data;
  },

  createRoomType: async (formData) => {
    const res = await apiClient.post(API_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  updateRoomType: async (id, formData) => {
    const res = await apiClient.put(`${API_URL}/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default roomTypeAPI;
