import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { ownerMenuItems } from "../dashboard/Owner";
import Topbar from "../../components/Topbar";
import branchAPI from "../../services/branch.service";
import "../dashboard/Dashboard.css";
import "./BranchesPage.css";

const initialForm = {
  name: "",
  address: "",
  phone: "",
  openingTime: "08:00",
  closingTime: "23:00",
  image: "",
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

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
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

  // Fetch branches data
  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await branchAPI.getAllBranches();
      if (res.data?.success) {
        setBranches(res.data.data || []);
      } else {
        setBranches(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch branches", err);
      setError(err.response?.data?.message || "Không thể tải danh sách chi nhánh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        // Valid token, logic continues
      } else {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
    fetchBranches();
  }, [fetchBranches, navigate]);



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

  // Convert image to Base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setError("File ảnh vượt quá giới hạn 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        image: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = () => {
    setForm(initialForm);
    setModalType("add");
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (branch) => {
    setForm({
      name: branch.name,
      address: branch.address,
      phone: branch.phone || "",
      openingTime: branch.openingTime || "08:00",
      closingTime: branch.closingTime || "23:00",
      image: branch.image || "",
      isActive: branch.isActive,
    });
    setModalType("edit");
    setEditingId(branch._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (modalType === "add") {
        const res = await branchAPI.createBranch(form);
        if (res.data?.success) {
          setSuccess("Tạo mới chi nhánh thành công!");
          setIsModalOpen(false);
          fetchBranches();
        } else {
          setError(res.data?.message || "Lỗi khi tạo mới chi nhánh.");
        }
      } else {
        const res = await branchAPI.updateBranch(editingId, form);
        if (res.data?.success) {
          setSuccess("Cập nhật thông tin chi nhánh thành công!");
          setIsModalOpen(false);
          fetchBranches();
        } else {
          setError(res.data?.message || "Lỗi khi cập nhật chi nhánh.");
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Đã xảy ra lỗi hệ thống.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (branch) => {
    const newStatus = !branch.isActive;
    const confirmMsg = newStatus
      ? `Bạn muốn kích hoạt hoạt động lại cho chi nhánh "${branch.name}"?`
      : `Bạn có chắc muốn vô hiệu hóa chi nhánh "${branch.name}"?\n(Nhân viên sẽ không thể đặt phòng tại quầy ở chi nhánh này nữa)`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await branchAPI.updateBranch(branch._id, { ...branch, isActive: newStatus });
      if (res.data?.success) {
        setSuccess(`Đã ${newStatus ? "kích hoạt" : "vô hiệu hóa"} chi nhánh thành công!`);
        fetchBranches();
      } else {
        setError(res.data?.message || "Không thể thay đổi trạng thái chi nhánh.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Lỗi khi thay đổi trạng thái chi nhánh.");
    }
  };

  const handleDelete = async (branch) => {
    if (!window.confirm(`Bạn có chắc muốn vô hiệu hóa hoạt động của chi nhánh "${branch.name}"?`)) return;

    try {
      const res = await branchAPI.deleteBranch(branch._id);
      if (res.data?.success) {
        setSuccess(`Vô hiệu hóa chi nhánh thành công!`);
        fetchBranches();
      } else {
        setError(res.data?.message || "Không thể vô hiệu hóa chi nhánh.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Lỗi khi gửi yêu cầu vô hiệu hóa chi nhánh.");
    }
  };

  // Filtered branches list
  const filteredBranches = branches.filter((branch) => {
    const matchesSearch =
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === "active") matchesStatus = branch.isActive === true;
    if (statusFilter === "inactive") matchesStatus = branch.isActive === false;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="dash">
      <Sidebar
        menuItems={ownerMenuItems}
        active="facility"
        handleLogout={handleLogout}
        onLogoClick={() => navigate("/owner-dashboard")}
      />

      <div className="main">
        <Topbar breadcrumbs={[{ label: "Trang chủ", link: "/owner-dashboard" }, { label: "Quản lý cơ sở" }]} />

        <div className="content">
          <header className="branches-header">
            <div>
              <h1 className="pg-title">Quản lý cơ sở (Chi nhánh)</h1>
              <p className="pg-sub">Quản lý hệ thống cửa hàng, địa chỉ, giờ hoạt động và thông tin liên hệ các cơ sở của rạp.</p>
            </div>
            <button className="btn-primary" onClick={openAddModal}>
              <i className="ti ti-plus" /> Thêm cơ sở mới
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
                placeholder="Tìm tên chi nhánh, địa chỉ..."
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
              <option value="active">Đang mở cửa (Active)</option>
              <option value="inactive">Đã tạm ngưng (Inactive)</option>
            </select>
          </section>

          {/* Table list */}
          {loading ? (
            <div className="state-display">Đang tải danh sách chi nhánh...</div>
          ) : filteredBranches.length === 0 ? (
            <div className="state-display">Không tìm thấy chi nhánh nào phù hợp.</div>
          ) : (
            <div className="table-wrapper">
              <table className="branches-table">
                <thead>
                  <tr>
                    <th>Ảnh</th>
                    <th>Tên chi nhánh</th>
                    <th>Địa chỉ</th>
                    <th>Số điện thoại</th>
                    <th>Giờ hoạt động</th>
                    <th>Trạng thái</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBranches.map((branch) => (
                    <tr key={branch._id}>
                      <td>
                        {branch.image ? (
                          <img src={branch.image} alt={branch.name} className="branch-table-thumb" />
                        ) : (
                          <div className="branch-table-thumb-placeholder">🏠</div>
                        )}
                      </td>
                      <td className="font-semibold">{branch.name}</td>
                      <td className="text-muted">{branch.address}</td>
                      <td>{branch.phone || "—"}</td>
                      <td className="time-range-text">⏰ {branch.openingTime} - {branch.closingTime}</td>
                      <td>
                        <span className={`status-badge ${branch.isActive ? "active" : "inactive"}`}>
                          {branch.isActive ? "Đang hoạt động" : "Tạm ngưng"}
                        </span>
                      </td>
                      <td className="text-right action-cell">
                        <button
                          className={`action-btn toggle-status ${branch.isActive ? "active" : "inactive"}`}
                          onClick={() => handleToggleActive(branch)}
                          title={branch.isActive ? "Tạm ngưng hoạt động" : "Mở hoạt động lại"}
                        >
                          {branch.isActive ? "Tạm ngưng" : "Kích hoạt"}
                        </button>
                        <button className="action-btn edit" onClick={() => openEditModal(branch)}>
                          Sửa
                        </button>
                        {branch.isActive && (
                          <button className="action-btn delete" onClick={() => handleDelete(branch)} title="Vô hiệu hóa chi nhánh">
                            Vô hiệu hóa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{modalType === "add" ? "Thêm cơ sở chi nhánh mới" : "Chỉnh sửa thông tin chi nhánh"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <i className="ti ti-x" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <label className="form-label">
                Tên chi nhánh *
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Cinema Cafe Quận 1"
                  required
                />
              </label>

              <label className="form-label">
                Địa chỉ *
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleInputChange}
                  placeholder="Số nhà, Tên đường, Quận/Huyện, TP..."
                  required
                />
              </label>

              <label className="form-label">
                Số điện thoại liên hệ
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: 0912345678"
                />
              </label>

              <div className="form-row-2">
                <label className="form-label">
                  Giờ mở cửa
                  <input
                    type="time"
                    name="openingTime"
                    value={form.openingTime}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <label className="form-label">
                  Giờ đóng cửa
                  <input
                    type="time"
                    name="closingTime"
                    value={form.closingTime}
                    onChange={handleInputChange}
                    required
                  />
                </label>
              </div>

              <label className="form-label">
                Ảnh đại diện chi nhánh
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ padding: "8px 0" }}
                />
                {form.image && (
                  <div className="branch-form-img-preview">
                    <img src={form.image} alt="Preview" />
                  </div>
                )}
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleInputChange}
                />
                Kích hoạt hoạt động cho chi nhánh này
              </label>

              <div className="modal-footer">
                <button type="button" className="modal-btn cancel" onClick={() => setIsModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="modal-btn submit" disabled={submitting}>
                  {submitting ? "Đang lưu..." : modalType === "add" ? "Tạo chi nhánh" : "Lưu cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
