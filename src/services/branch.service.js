import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants";

const branchService = {
  getAllBranches: () => {
    return apiClient.get(API_ENDPOINTS.BRANCHES);
  },
};

export default branchService;
