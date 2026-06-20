import apiClient from "./apiClient";

const API_URL = "/news";

const newsAPI = {
  getAllNews: async () => {
    const res = await apiClient.get(API_URL);
    return res.data;
  },

  createNews: async (data) => {
    const res = await apiClient.post(API_URL, data);
    return res.data;
  },

  updateNews: async (id, data) => {
    const res = await apiClient.put(`${API_URL}/${id}`, data);
    return res.data;
  },

  deleteNews: async (id) => {
    const res = await apiClient.delete(`${API_URL}/${id}`);
    return res.data;
  },
};

export default newsAPI;
