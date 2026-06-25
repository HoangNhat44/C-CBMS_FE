import apiClient from './apiClient';

const branchAPI = {
  // Lấy tất cả chi nhánh
  getAllBranches: () => apiClient.get('/branches'),

  // Lấy chi nhánh theo ID
  getBranchById: (id) => apiClient.get(`/branches/${id}`),

  // Tạo mới chi nhánh (Chỉ Owner)
  createBranch: (data) => apiClient.post('/branches', data),

  // Cập nhật thông tin chi nhánh (Chỉ Owner)
  updateBranch: (id, data) => apiClient.put(`/branches/${id}`, data),

  // Xóa mềm chi nhánh (Chỉ Owner)
  deleteBranch: (id) => apiClient.delete(`/branches/${id}`),
};

export default branchAPI;
