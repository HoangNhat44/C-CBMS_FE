import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants";

const roleAPI = {
  getAllRoles: () => apiClient.get(API_ENDPOINTS.ROLES),
};

export default roleAPI;
