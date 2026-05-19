import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants";

const userAPI = {
  getAllUsers: () => apiClient.get(API_ENDPOINTS.USERS),
  getUserById: (id) => apiClient.get(`${API_ENDPOINTS.USERS}/${id}`),
  createUser: (data) => apiClient.post(API_ENDPOINTS.USERS, data),
  updateUser: (id, data) => apiClient.put(`${API_ENDPOINTS.USERS}/${id}`, data),
  deleteUser: (id) => apiClient.delete(`${API_ENDPOINTS.USERS}/${id}`),
};

export default userAPI;
