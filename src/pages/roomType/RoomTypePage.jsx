import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { ownerMenuItems } from "../dashboard/Owner";
import roomTypeAPI from "../../services/roomType.service";
import "../dashboard/Dashboard.css";
import "./RoomTypePage.css";

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

  const handleMenuChange = (key) => {
    if (key === "roomtype") return;
    if (key === "room") { navigate("/room"); return; }
    else if (key === "news") { navigate("/news"); return; }
    else if (key === "category") { navigate("/categories"); return; }
    else if (key === "product") { navigate("/products"); return; }
    else if (key === "review") { navigate("/feedbacks"); return; }
    else if (key === "bookinghistory") { navigate("/bookinghistory"); return; }
    else if (key === "facility") { navigate("/branches"); return; }
    else if (key === "slot") { navigate("/slots"); return; }
    else {
      navigate("/owner-dashboard", { state: { activeTab: key } });
    }
  };

  const openCreateForm = () => {
    setEditingRoomType(null);
    setFormData(emptyForm);
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
    setShowForm(true);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : (name === "capacity" ? Number(value) : value),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingRoomType) {
        const res = await roomTypeAPI.updateRoomType(editingRoomType._id, formData);
        if (!res.success) throw new Error(res.message || "Update room type failed");
      } else {
        const res = await roomTypeAPI.createRoomType(formData);
        if (!res.success) throw new Error(res.message || "Create room type failed");
      }

      setShowForm(false);
      setEditingRoomType(null);
      await fetchRoomTypes();
    } catch (error) {
      console.error("Save room type failed", error);
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
        setActive={handleMenuChange}
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
                  Ảnh đại diện
                  <input name="image" value={formData.image} onChange={handleChange} placeholder="URL ảnh" />
                </label>
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
                      <img src={roomType.image} alt={roomType.name} />
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

