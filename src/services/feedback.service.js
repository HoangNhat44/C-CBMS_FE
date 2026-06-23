import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants";

const feedbackService = {
  getAllFeedbacks: (params) => {
    return apiClient.get(API_ENDPOINTS.FEEDBACKS, { params });
  },

  getFeedbackById: (id) => {
    return apiClient.get(`${API_ENDPOINTS.FEEDBACKS}/${id}`);
  },

  createFeedback: (data) => {
    return apiClient.post(API_ENDPOINTS.FEEDBACKS, data);
  },

  updateFeedback: (id, data) => {
    return apiClient.put(`${API_ENDPOINTS.FEEDBACKS}/${id}`, data);
  },

  deleteFeedback: (id) => {
    return apiClient.delete(`${API_ENDPOINTS.FEEDBACKS}/${id}`);
  },
};

export default feedbackService;
