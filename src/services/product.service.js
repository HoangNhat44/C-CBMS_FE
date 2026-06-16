import apiClient from './apiClient';

const productAPI = {
  // Lấy danh sách sản phẩm (đồ ăn/nước uống)
  getAllProducts: (branchId) => {
    const url = branchId ? `/products?branchId=${branchId}` : '/products';
    return apiClient.get(url);
  }
};

export default productAPI;
