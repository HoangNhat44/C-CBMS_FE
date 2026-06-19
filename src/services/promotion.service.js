import apiClient from "./apiClient";

const API_URL = "/promotions";

const promotionAPI = {
  getAllPromotions: async (branchId = "") => {
    const res = await apiClient.get(`${API_URL}${branchId ? `?branchId=${branchId}` : ""}`);
    return res.data;
  },

  applyPromotion: async (code, branchId = "") => {
    const res = await apiClient.post(`${API_URL}/apply`, { code, branchId });
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
