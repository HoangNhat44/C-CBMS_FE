import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants";

const roleAPI = {
  getAllRoles: () => apiClient.get(API_ENDPOINTS.ROLES),
  updateRolePermissions: (id, permissionCodes) => apiClient.put(`${API_ENDPOINTS.ROLES}/${id}/permissions`, { permissionCodes }),
};

export default roleAPI;
