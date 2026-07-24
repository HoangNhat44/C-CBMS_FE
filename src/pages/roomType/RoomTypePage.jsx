import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { ownerMenuItems } from "../dashboard/Owner";
import roomTypeAPI from "../../services/roomType.service";
import "../dashboard/Dashboard.css";
import "./RoomTypePage.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL?.replace(/\/api\/?$/, "").replace(/\/$/, "") || "";

const emptyForm = {
  name: "",
  capacity: 1,
  description: "",
  image: "",
  isActive: true,
};

const fallbackRoomTypes = [
  {
    _id: "local-roomtype-1",
    name: "Phòng tiêu chuẩn",
    capacity: 4,
    description: "Phòng tiêu chuẩn với đầy đủ tiện ích cơ bản.",
    price: 500000,
    image: "",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "local-roomtype-2",
    name: "Phòng VIP",
    capacity: 6,
    description: "Phòng VIP với tiện ích cao cấp.",
    price: 1000000,
    image: "",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export default function RoomTypePage() {
  const navigate = useNavigate();

  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRoomType, setEditingRoomType] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [apiOffline, setApiOffline] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);




  const fetchRoomTypes = async () => {
    try {
      setLoading(true);
      const res = await roomTypeAPI.getAllRoomTypes();
      if (res.success) {
        setRoomTypes(res.data || []);
        setApiOffline(false);
      }
    } catch (error) {
      console.error("Fetch room types failed", error);
      setApiOffline(true);
      setRoomTypes((prev) => (prev.length > 0 ? prev : fallbackRoomTypes));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");

    navigate("/login", { replace: true });
  };

  const openCreateForm = () => {
    setEditingRoomType(null);
    setFormData(emptyForm);
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingRoomType(item);
    setFormData({
      name: item.name || "",
      capacity: item.capacity || 1,
      description: item.description || "",
      image: item.image || "",
      isActive: item.isActive !== false,
    });
    setImageFile(null);
    if (item.image) {
      setImagePreview(item.image.startsWith("http") ? item.image : `${API_BASE}${item.image}`);
    } else {
      setImagePreview("");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowForm(true);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : (name === "capacity" ? Number(value) : value),
    }));
    
    if (name === "image" && !imageFile) {
      setImagePreview(value.startsWith("http") ? value : (value ? `${API_BASE}${value}` : ""));
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("capacity", formData.capacity);
      fd.append("description", formData.description);
      fd.append("isActive", formData.isActive);

      if (imageFile) {
        fd.append("image", imageFile);
      } else if (formData.image) {
        fd.append("image", formData.image);
      } else if (editingRoomType?.image && imagePreview) {
        fd.append("image", editingRoomType.image);
      }

      if (editingRoomType) {
        const res = await roomTypeAPI.updateRoomType(editingRoomType._id, fd);
        if (!res.success) throw new Error(res.message || "Update room type failed");
      } else {
        const res = await roomTypeAPI.createRoomType(fd);
        if (!res.success) throw new Error(res.message || "Create room type failed");
      }

      setShowForm(false);
      setEditingRoomType(null);
      setImageFile(null);
      setImagePreview("");
      await fetchRoomTypes();
    } catch (error) {
      console.error("Save room type failed", error);
      
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        alert(error.response.data?.message || "Bạn không có quyền để thực hiện hành động này");
        return;
      }

      setApiOffline(true);

      const localRoomType = {
        ...formData,
        _id: editingRoomType?._id || `local-roomtype-${Date.now()}`,
        createdAt: editingRoomType?.createdAt || new Date().toISOString(),
      };

      setRoomTypes((prev) =>
        editingRoomType
          ? prev.map((item) => (item._id === editingRoomType._id ? localRoomType : item))
          : [localRoomType, ...prev]
      );
      setShowForm(false);
      setEditingRoomType(null);
    }
  };

  const handleToggleStatus = async (item) => {
    try {

      const res = await roomTypeAPI.updateRoomType(item._id, { isActive: !item.isActive });
      if (!res.success) throw new Error(res.message || "Update room type failed");

      setRoomTypes((prev) =>
        prev.map((roomType) => (roomType._id === item._id ? { ...roomType, isActive: !roomType.isActive } : roomType))
      );
    } catch (error) {
      console.error("Toggle room type status failed", error);

      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        alert(error.response.data?.message || "Bạn không có quyền để thực hiện hành động này");
        return;
      }

      setApiOffline(true);
      setRoomTypes((prev) =>
        prev.map((roomType) => (roomType._id === item._id ? { ...roomType, isActive: !roomType.isActive } : roomType))
      );
    }
  };

  return (
    <div className="dash">
      <Sidebar
        menuItems={ownerMenuItems}
        active="roomtype"
        handleLogout={handleLogout}
        onLogoClick={() => navigate("/owner-dashboard")}
      />

      <div className="main">
        <Topbar breadcrumbs={[{ label: "Trang chủ", link: "/owner-dashboard" }, { label: "Quản lý loại phòng" }]} />

        <div className="content">
          <div className="roomtype-page-head">
            <div>
              <div className="pg-title">Quản lý loại phòng</div>
              <div className="pg-sub">Các loại phòng dùng chung cho toàn bộ chi nhánh.</div>
              {apiOffline && (
                <div className="roomtype-offline-note">
                  Backend chưa phản hồi, trang đang dùng dữ liệu tạm trên trình duyệt.
                </div>
              )}
            </div>
            {!showForm && (
              <button className="btn-primary" onClick={openCreateForm}>
                <i className="ti ti-plus" /> Tạo loại phòng
              </button>
            )}
          </div>

          {showForm && (
            <div className="card roomtype-form-card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-door" aria-hidden="true" />
                  {editingRoomType ? "Cập nhật loại phòng" : "Tạo loại phòng"}
                </div>
              </div>
              <form className="roomtype-form" onSubmit={handleSubmit}>
                <label>
                  Tên loại phòng
                  <input name="name" value={formData.name} onChange={handleChange} placeholder="VD: Phòng tiêu chuẩn" required />
                </label>
                <label>
                  Sức chứa (người)
                  <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} min="1" required />
                </label>
                <label>
                  Mô tả
                  <textarea name="description" value={formData.description} onChange={handleChange} rows="3" placeholder="Mô tả chi tiết về loại phòng" />
                </label>
                <label>
                  Hoặc nhập URL ảnh đại diện từ web
                  <input name="image" value={formData.image} onChange={handleChange} placeholder="VD: https://..." />
                </label>
                {/* Image Upload Section */}
                <div className="image-upload-section">
                  <label className="image-upload-label">Ảnh đại diện (Tải lên từ máy)</label>
                  <div
                    className={`image-upload-zone ${imagePreview ? "has-preview" : ""}`}
                    onClick={() => !imagePreview && fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <div className="image-preview-container">
                        <img src={imagePreview} alt="Preview" className="image-preview" />
                        <div className="image-preview-overlay">
                          <button
                            type="button"
                            className="image-preview-change"
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                          >
                            Đổi ảnh
                          </button>
                          <button
                            type="button"
                            className="image-preview-remove"
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="image-upload-placeholder">
                        <span className="image-upload-icon">📷</span>
                        <span>Nhấn để chọn ảnh hoặc kéo thả vào đây</span>
                        <span className="image-upload-hint">JPG, PNG, WebP, GIF — tối đa 5MB</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                </div>
                <label className="roomtype-checkbox">
                  <input name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} />
                  Loại phòng này đang hoạt động
                </label>
                <div className="roomtype-form-actions">
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingRoomType(null);
                    }}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingRoomType ? "Lưu thay đổi" : "Tạo loại phòng"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="roomtype-loading">Đang tải dữ liệu...</div>
          ) : roomTypes.length === 0 ? (
            <div className="roomtype-empty">
              <i className="ti ti-door-off" />
              <p>Chưa có loại phòng nào. Hãy tạo loại phòng đầu tiên!</p>
            </div>
          ) : (
            <div className="roomtype-grid">
              {roomTypes.map((roomType) => (
                <div key={roomType._id} className="roomtype-card">
                  {roomType.image && (
                    <div className="roomtype-card-image">
                      <img src={roomType.image.startsWith("http") ? roomType.image : `${API_BASE}${roomType.image}`} alt={roomType.name} />
                    </div>
                  )}
                  <div className="roomtype-card-body">
                    <div className="roomtype-card-header">
                      <h3 className="roomtype-card-title">{roomType.name}</h3>
                      <span className={`roomtype-status ${roomType.isActive ? "active" : "inactive"}`}>
                        {roomType.isActive ? "Hoạt động" : "Tạm dừng"}
                      </span>
                    </div>
                    <div className="roomtype-card-info">
                      <div className="roomtype-info-item">
                        <i className="ti ti-users" />
                        <span>Sức chứa: {roomType.capacity} người</span>
                      </div>
                    </div>
                    {roomType.description && (
                      <p className="roomtype-card-description">{roomType.description}</p>
                    )}
                    <div className="roomtype-card-actions">
                      <button className="btn-edit" onClick={() => openEditForm(roomType)}>
                        <i className="ti ti-edit" /> Sửa
                      </button>
                      <button className={`btn-toggle ${roomType.isActive ? "btn-inactive" : "btn-active"}`} onClick={() => handleToggleStatus(roomType)}>
                        <i className={`ti ${roomType.isActive ? "ti-pause" : "ti-player-play"}`} />
                        {roomType.isActive ? "Tạm dừng" : "Kích hoạt"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

