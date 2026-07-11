import apiClient from "./apiClient";

const permissionAPI = {
  getAllPermissions: () => apiClient.get('/permissions'),
};

export default permissionAPI;
