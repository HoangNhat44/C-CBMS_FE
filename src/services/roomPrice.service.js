import apiClient from './apiClient';

const roomPriceAPI = {
  // Get price matrix for branch & dayType
  getMatrix: (branchId, dayType = "weekday") =>
    apiClient.get('/room-prices/matrix', { params: { branchId, dayType } }),

  // Update price matrix and auto-record audit log
  updateMatrix: (data) =>
    apiClient.put('/room-prices/matrix', data),

  // Get price history audit log list
  getHistory: (params = {}) =>
    apiClient.get('/room-prices/history', { params }),
};

export default roomPriceAPI;
