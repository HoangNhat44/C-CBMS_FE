import { useEffect, useState } from "react";

const emptyForm = {
  branchId: "",
  roomTypeId: "",
  roomName: "",
  capacity: 1,
  image: "",
  facilities: "",
  status: "available",
};

export default function RoomForm({ room, branches, roomTypes, selectedBranchId, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (room) {
      setFormData({
        branchId: room.branchId?._id || room.branchId || selectedBranchId || "",
        roomTypeId: room.roomTypeId?._id || room.roomTypeId || "",
        roomName: room.roomName || "",
        capacity: room.capacity || 1,
        image: room.image || "",
        facilities: (room.facilities || []).join(", "),
        status: room.status || "available",
      });
      return;
    }

    setFormData({ ...emptyForm, branchId: selectedBranchId || "" });
  }, [room, selectedBranchId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? Number(value) : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...formData,
      image: formData.image,
      facilities: formData.facilities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="card room-form-card">
      <div className="card-head">
        <div className="card-title">
          <i className="ti ti-door" aria-hidden="true" />
          {room ? "Cập nhật phòng" : "Tạo phòng mới"}
        </div>
      </div>

      <form className="room-form" onSubmit={handleSubmit}>
        <div className="room-form-grid">
          <label>
            Chi nhánh
            <select name="branchId" value={formData.branchId} onChange={handleChange} required>
              <option value="">Chọn chi nhánh</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Loại phòng
            <select name="roomTypeId" value={formData.roomTypeId} onChange={handleChange} required>
              <option value="">Chọn loại phòng</option>
              {roomTypes.map((type) => (
                <option key={type._id} value={type._id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tên phòng
            <input
              name="roomName"
              value={formData.roomName}
              onChange={handleChange}
              placeholder="VD: Room A1"
              required
            />
          </label>

          <label>
            Sức chứa
            <input
              name="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Trạng thái
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="available">Có sẵn</option>
              <option value="maintenance">Bảo trì</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </label>

          <label>
            Tiện ích
            <input
              name="facilities"
              value={formData.facilities}
              onChange={handleChange}
              placeholder="Máy lạnh, TV, Karaoke"
            />
          </label>
        </div>

        <label>
          Ảnh phòng
          <input
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="Nhập URL ảnh"
            type="text"
          />
        </label>

        <div className="room-form-actions">
          <button type="button" className="btn-outline" onClick={onCancel}>
            Hủy
          </button>
          <button type="submit" className="btn-primary">
            {room ? "Lưu thay đổi" : "Tạo phòng"}
          </button>
        </div>
      </form>
    </div>
  );
}
