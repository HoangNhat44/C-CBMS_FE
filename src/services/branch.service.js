import apiClient from "./apiClient";

const API_URL = "/branches";

const branchAPI = {
  getAllBranches: async () => {
    const res = await apiClient.get(API_URL);
    return res.data;
  },
};

export default branchAPI;
