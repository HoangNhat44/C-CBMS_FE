import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { ownerMenuItems } from "../dashboard/Owner";
import Topbar from "../../components/Topbar";
import RequirePermission from "../../components/RequirePermission";
import slotAPI from "../../services/slot.service";
import "../dashboard/Dashboard.css";
import "./SlotsPage.css";

const initialForm = {
  name: "",
  startTime: "08:00",
  endTime: "10:00",
  timeType: "standard",
  isActive: true,
};

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export default function SlotsPage() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add"); // "add" or "edit"
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  // Layout states

  const navigate = useNavigate();

  // Fetch slots data
  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await slotAPI.getAllSlots();
      if (res.data?.success) {
        setSlots(res.data.data || []);
      } else {
        setSlots(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch slots", err);
      setError(err.response?.data?.message || "Không thể tải danh sách khung giờ (slots).");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        // Valid token logic
      } else {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
    fetchSlots();
  }, [fetchSlots, navigate]);


  // Auto-hide messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogout = () => {
    localStorage.removeItem("token");

    navigate("/login", { replace: true });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openAddModal = () => {
    setForm(initialForm);
    setModalType("add");
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (slot) => {
    setForm({
      name: slot.name,
      startTime: slot.startTime,
      endTime: slot.endTime,
      timeType: slot.timeType || "standard",
      isActive: slot.isActive,
    });
    setModalType("edit");
    setEditingId(slot._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const timeToMinutes = (tStr) => {
      if (!tStr) return 0;
      const [h, m] = tStr.split(":").map(Number);
      return h * 60 + m;
    };

    const startMin = timeToMinutes(form.startTime);
    const endMin = timeToMinutes(form.endTime);

    if (startMin >= endMin) {
      setError("Giờ bắt đầu phải nhỏ hơn giờ kết thúc (ví dụ: 08:00 - 10:00).");
      setSubmitting(false);
      return;
    }

    // Check overlap with existing slots
    const overlappingSlot = slots.find((s) => {
      if (modalType === "edit" && s._id === editingId) return false;
      const sMin = timeToMinutes(s.startTime);
      const eMin = timeToMinutes(s.endTime);
      return startMin < eMin && endMin > sMin;
    });

    if (overlappingSlot) {
      setError(
        `Khung giờ (${form.startTime} - ${form.endTime}) bị trùng/gối lên khung giờ "${overlappingSlot.name}" (${overlappingSlot.startTime} - ${overlappingSlot.endTime}). Vui lòng chọn thời gian khác!`
      );
      setSubmitting(false);
      return;
    }

    try {
      if (modalType === "add") {
        const res = await slotAPI.createSlot(form);
        if (res.data?.success) {
          setSuccess("Tạo mới khung giờ (slot) thành công!");
          setIsModalOpen(false);
          fetchSlots();
        } else {
          setError(res.data?.message || "Lỗi khi tạo mới khung giờ.");
        }
      } else {
        const res = await slotAPI.updateSlot(editingId, form);
        if (res.data?.success) {
          setSuccess("Cập nhật thông tin khung giờ thành công!");
          setIsModalOpen(false);
          fetchSlots();
        } else {
          setError(res.data?.message || "Lỗi khi cập nhật khung giờ.");
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Lỗi khi lưu thông tin khung giờ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (slot) => {
    const newStatus = !slot.isActive;
    const confirmMsg = newStatus
      ? `Bạn muốn kích hoạt hoạt động lại cho slot "${slot.name}" (${slot.startTime} - ${slot.endTime})?`
      : `Bạn có chắc muốn tạm dừng hoạt động slot "${slot.name}" (${slot.startTime} - ${slot.endTime})?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await slotAPI.updateSlotStatus(slot._id, newStatus);
      if (res.data?.success) {
        setSuccess(`Đã ${newStatus ? "kích hoạt" : "tạm khóa"} slot thành công!`);
        fetchSlots();
      } else {
        setError(res.data?.message || "Không thể thay đổi trạng thái slot.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Lỗi khi thay đổi trạng thái slot.");
    }
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Filtered slots list
  const filteredSlots = slots.filter((slot) => {
    const matchesSearch =
      slot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slot.startTime.includes(searchTerm) ||
      slot.endTime.includes(searchTerm);

    let matchesStatus = true;
    if (statusFilter === "active") matchesStatus = slot.isActive === true;
    if (statusFilter === "inactive") matchesStatus = slot.isActive === false;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSlots.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSlots = filteredSlots.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="dash">
      <Sidebar
        menuItems={ownerMenuItems}
        active="slot"
        handleLogout={handleLogout}
        onLogoClick={() => navigate("/owner-dashboard")}
      />

      <div className="main">
        <Topbar breadcrumbs={[{ label: "Trang chủ", link: "/owner-dashboard" }, { label: "Quản lý slot" }]} />

        <div className="content">
          <header className="slots-header">
            <div>
              <h1 className="pg-title">Quản lý Slot (Khung giờ)</h1>
              <p className="pg-sub">Quản lý cấu hình các khung giờ đặt phòng (sáng, trưa, tối, giờ vàng, giờ tiêu chuẩn) áp dụng cho hệ thống.</p>
            </div>
            <button className="btn-primary" onClick={openAddModal}>
              <i className="ti ti-plus" /> Thêm slot mới
            </button>
          </header>

          {success && <div className="message-alert success">{success}</div>}
          {error && <div className="message-alert error">{error}</div>}

          {/* Filters Bar */}
          <section className="filter-bar">
            <div className="filter-bar__search-container" style={{ position: "relative", flex: 1 }}>
              <i className="ti ti-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Tìm tên slot, giờ bắt đầu, giờ kết thúc..."
                className="filter-bar__search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: "36px" }}
              />
            </div>
            <select
              className="filter-bar__select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả Trạng thái</option>
              <option value="active">Đang kích hoạt (Active)</option>
              <option value="inactive">Tạm khóa (Inactive)</option>
            </select>
          </section>

          {/* Table list */}
          {loading ? (
            <div className="state-display">Đang tải danh sách slot...</div>
          ) : filteredSlots.length === 0 ? (
            <div className="state-display">Không tìm thấy slot nào phù hợp.</div>
          ) : (
            <div className="table-wrapper">
              <table className="slots-table">
                <thead>
                  <tr>
                    <th>Tên slot</th>
                    <th>Thời gian</th>
                    <th>Loại khung giờ</th>
                    <th>Trạng thái hoạt động</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSlots.map((slot) => (
                    <tr key={slot._id}>
                      <td className="font-semibold">{slot.name}</td>
                      <td className="time-range-display">⏰ {slot.startTime} - {slot.endTime}</td>
                      <td>
                        <span className={`time-type-badge ${slot.timeType}`}>
                          {slot.timeType === "golden" ? "🔥 Giờ Vàng" : "⚙️ Giờ Thường"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${slot.isActive ? "active" : "inactive"}`}>
                          {slot.isActive ? "Đang kích hoạt" : "Tạm ngưng"}
                        </span>
                      </td>
                      <td className="text-right action-cell">
                        <RequirePermission require={["UPDATE_SLOT_STATUS"]}>
                          <button
                            className={`action-btn toggle-status ${slot.isActive ? "active" : "inactive"}`}
                            onClick={() => handleToggleActive(slot)}
                            title={slot.isActive ? "Tạm khóa slot" : "Kích hoạt lại slot"}
                          >
                            {slot.isActive ? "Tạm khóa" : "Kích hoạt"}
                          </button>
                        </RequirePermission>
                        <RequirePermission require={["UPDATE_SLOT"]}>
                          <button className="action-btn edit" onClick={() => openEditModal(slot)}>
                            Sửa
                          </button>
                        </RequirePermission>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {filteredSlots.length > 0 && (
                <div className="pagination-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", background: "#ffffff", borderTop: "1px solid #f1f5f9", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ fontSize: "0.88rem", color: "#64748b", fontWeight: 600 }}>
                    Hiển thị <strong>{startIndex + 1}</strong> - <strong>{Math.min(startIndex + itemsPerPage, filteredSlots.length)}</strong> trên tổng <strong>{filteredSlots.length}</strong> khung giờ
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: currentPage === 1 ? "#f1f5f9" : "#ffffff", color: currentPage === 1 ? "#94a3b8" : "#334e68", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.85rem" }}
                    >
                      ← Trang trước
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "1px solid",
                          borderColor: currentPage === page ? "#0f766e" : "#cbd5e1",
                          background: currentPage === page ? "#0f766e" : "#ffffff",
                          color: currentPage === page ? "#ffffff" : "#334e68",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          cursor: "pointer"
                        }}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: (currentPage === totalPages || totalPages === 0) ? "#f1f5f9" : "#ffffff", color: (currentPage === totalPages || totalPages === 0) ? "#94a3b8" : "#334e68", cursor: (currentPage === totalPages || totalPages === 0) ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.85rem" }}
                    >
                      Trang sau →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{modalType === "add" ? "Thêm mới khung giờ (Slot)" : "Chỉnh sửa khung giờ"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <i className="ti ti-x" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <label className="form-label">
                Tên slot *
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Slot 1 (Sáng), Slot 5 (Tối)"
                  required
                />
              </label>

              <div className="form-row-2">
                <label className="form-label">
                  Giờ bắt đầu *
                  <input
                    type="time"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleInputChange}
                    disabled={modalType === "edit"} // Times are read-only (fixed) in edit mode
                    required
                  />
                </label>
                <label className="form-label">
                  Giờ kết thúc *
                  <input
                    type="time"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleInputChange}
                    disabled={modalType === "edit"} // Times are read-only (fixed) in edit mode
                    required
                  />
                </label>
              </div>

              {modalType === "edit" && (
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "-10px", fontStyle: "italic" }}>
                  💡 Khung giờ bắt đầu/kết thúc được cố định. Để thay đổi giờ, vui lòng tạo slot mới.
                </div>
              )}

              <label className="form-label">
                Loại khung giờ (Giá phòng) *
                <select
                  name="timeType"
                  value={form.timeType}
                  onChange={handleInputChange}
                  className="filter-input"
                  style={{ minHeight: "44px" }}
                  required
                >
                  <option value="standard">standard (Giờ thường)</option>
                  <option value="golden">golden (Giờ vàng)</option>
                </select>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleInputChange}
                />
                Cho phép hoạt động và lựa chọn khung giờ này
              </label>

              <div className="modal-footer">
                <button type="button" className="modal-btn cancel" onClick={() => setIsModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="modal-btn submit" disabled={submitting}>
                  {submitting ? "Đang lưu..." : modalType === "add" ? "Tạo slot" : "Lưu cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
