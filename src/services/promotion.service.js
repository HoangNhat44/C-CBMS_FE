import apiClient from "./apiClient";

const API_URL = "/promotions";

const promotionAPI = {
  getAllPromotions: async () => {
    const res = await apiClient.get(API_URL);
    return res.data;
  },

  createPromotion: async (data) => {
    const res = await apiClient.post(API_URL, data);
    return res.data;
  },

  updatePromotion: async (id, data) => {
    const res = await apiClient.put(`${API_URL}/${id}`, data);
    return res.data;
  },
};

export default promotionAPI;
