import apiClient from "./apiClient";

const roomTypeAPI = {
  getAllRoomTypes: async () => {
    const res = await apiClient.get("/room-types");
    return res.data;
  },
};

export default roomTypeAPI;
