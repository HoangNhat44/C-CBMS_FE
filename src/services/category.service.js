import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants";

const categoryService = {
  getAllCategories: (params = {}) => {
    return apiClient.get(API_ENDPOINTS.CATEGORIES, { params });
  },
  getCategoryById: (id) => {
    return apiClient.get(`${API_ENDPOINTS.CATEGORIES}/${id}`);
  },
  createCategory: (data) => {
    return apiClient.post(API_ENDPOINTS.CATEGORIES, data);
  },
  updateCategory: (id, data) => {
    return apiClient.put(`${API_ENDPOINTS.CATEGORIES}/${id}`, data);
  },
  deleteCategory: (id) => {
    return apiClient.delete(`${API_ENDPOINTS.CATEGORIES}/${id}`);
  },
};

export default categoryService;
