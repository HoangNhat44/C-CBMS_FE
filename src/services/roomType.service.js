import apiClient from "./apiClient";

const API_URL = "/room-types";

const roomTypeAPI = {
  getAllRoomTypes: async () => {
    const res = await apiClient.get(API_URL);
    return res.data;
  },

  createRoomType: async (data) => {
    const res = await apiClient.post(API_URL, data);
    return res.data;
  },

  updateRoomType: async (id, data) => {
    const res = await apiClient.put(`${API_URL}/${id}`, data);
    return res.data;
  },
};

export default roomTypeAPI;

