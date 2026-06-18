import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants";

const productService = {
  getAllProducts: (params = {}) => {
    return apiClient.get(API_ENDPOINTS.PRODUCTS, { params });
  },
  getProductById: (id) => {
    return apiClient.get(`${API_ENDPOINTS.PRODUCTS}/${id}`);
  },
  createProduct: (data) => {
    return apiClient.post(API_ENDPOINTS.PRODUCTS, data);
  },
  updateProduct: (id, data) => {
    return apiClient.put(`${API_ENDPOINTS.PRODUCTS}/${id}`, data);
  },
  deleteProduct: (id) => {
    return apiClient.delete(`${API_ENDPOINTS.PRODUCTS}/${id}`);
  },
};

export default productService;
