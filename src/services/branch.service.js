import apiClient from './apiClient';

const branchAPI = {
  // Lấy tất cả chi nhánh
  getAllBranches: () => apiClient.get('/branches'),

  // Lấy chi nhánh theo ID
  getBranchById: (id) => apiClient.get(`/branches/${id}`),
};

export default branchAPI;
