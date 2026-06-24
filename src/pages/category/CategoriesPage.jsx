import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { ownerMenuItems } from "../dashboard/Owner";
import { staffMenuItems } from "../dashboard/Staff";
import ChangePasswordModal from "../authentication/ChangePasswordModal";
import categoryService from "../../services/category.service";
import "./CategoriesPage.css";

const initialForm = {
  name: "",
  description: "",
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

function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
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
  const [user, setUser] = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [cpModalOpen, setCpModalOpen] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  const isStaff = user?.role === "staff" || (!user?.role && localStorage.getItem("current_dashboard") === "staff");
  const isOwner = user?.role === "owner" || (!user?.role && localStorage.getItem("current_dashboard") === "owner");

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      const categoryRes = await categoryService.getAllCategories(params);
      setCategories(categoryRes.data?.data || []);
    } catch (err) {
      setError(
        err.response?.data?.error
          ? `${err.response.data.message}: ${err.response.data.error}`
          : err.response?.data?.message || "Không thể tải danh sách thể loại"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(decoded);
      } else {
        localStorage.removeItem("token");
      }
    }
    fetchData();
  }, [fetchData]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    setUser(null);
    setDropOpen(false);
    navigate("/login", { replace: true });
  };

  const handleMenuChange = (key) => {
    if (key === "category") return;
    if (key === "product") {
      navigate("/products");
      return;
    }
    if (key === "review") {
      navigate("/feedbacks");
      return;
    }
    if (key === "bookinghistory") {
      navigate("/bookinghistory");
      return;
    }
    if (key === "walkin") {
      navigate("/walkin");
      return;
    }
    if (key === "room") {
      navigate("/room");
      return;
    }
    if (key === "roomtype") {
      navigate("/roomtype");
      return;
    }
    if (key === "news") {
      navigate("/news");
      return;
    }
    navigate(isStaff ? "/staff-dashboard" : "/owner-dashboard");
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
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setForm({
      name: cat.name,
      description: cat.description || "",
      isActive: cat.isActive ?? true,
    });
    setEditingId(cat._id);
    setModalType("edit");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      setError("Vui lòng nhập Tên thể loại");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      if (modalType === "add") {
        await categoryService.createCategory(form);
        setSuccess("Thêm thể loại thành công!");
      } else {
        await categoryService.updateCategory(editingId, form);
        setSuccess("Cập nhật thể loại thành công!");
      }

      setIsModalOpen(false);
      setForm(initialForm);
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.error
          ? `${err.response.data.message}: ${err.response.data.error}`
          : err.response?.data?.message || "Lỗi khi lưu thông tin thể loại"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      setError("");
      setSuccess("");
      const updatedCategory = {
        name: category.name,
        description: category.description || "",
        isActive: !category.isActive
      };
      await categoryService.updateCategory(category._id, updatedCategory);
      setSuccess(`Cập nhật trạng thái danh mục "${category.name}" thành công!`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể cập nhật trạng thái");
    }
  };

  const initials = getInitials(user?.fullName || user?.email || "");
  const isStaffOrOwner = isOwner || isStaff;

  // Filter categories client-side for search & active status
  const filteredCategories = categories.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "" ? true : statusFilter === "active" ? c.isActive : !c.isActive;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="dash">
      <Sidebar
        menuItems={isStaff ? staffMenuItems : ownerMenuItems}
        active="category"
        setActive={handleMenuChange}
        handleLogout={handleLogout}
        onLogoClick={() => navigate(isStaff ? "/staff-dashboard" : "/owner-dashboard")}
      />

      <div className="main">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <span className="breadcrumb">Trang chủ&nbsp;/&nbsp;</span>
            <span className="breadcrumb-active">Quản lý danh mục</span>
          </div>
          <div className="topbar-right">
            <div className="tb-user" ref={dropRef} style={{ position: "relative" }} onClick={() => setDropOpen((v) => !v)}>
              <div className="tb-avatar">{initials}</div>
              <div>
                <div className="tb-uname">{user?.fullName || user?.email}</div>
                <div className="tb-role" style={{ textTransform: "capitalize" }}>{user?.role}</div>
              </div>
              <i className="ti ti-chevron-down" style={{ fontSize: 14, color: "var(--text-muted)", marginLeft: 4 }} />

              {dropOpen && (
                <div className="categories-user-menu" style={{
                  position: "absolute", top: "calc(100% + 10px)", right: 0,
                  background: "#fff", border: "1px solid var(--border)",
                  borderRadius: 12, boxShadow: "0 8px 32px rgba(16,42,67,.12)",
                  minWidth: 180, zIndex: 200, overflow: "hidden",
                }}>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDropOpen(false);
                      setCpModalOpen(true);
                    }}
                    style={{
                      width: "100%", padding: "11px 16px",
                      background: "none", border: "none",
                      display: "flex", alignItems: "center", gap: 8,
                      fontSize: 13, fontWeight: 700, color: "var(--text-dark)",
                      cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                    }}
                  >
                    <i className="ti ti-key" />
                    Đổi mật khẩu
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: "100%", padding: "11px 16px",
                      background: "none", border: "none",
                      display: "flex", alignItems: "center", gap: 8,
                      fontSize: 13, fontWeight: 700, color: "#b42318",
                      cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                      borderTop: "1px solid var(--border-light)"
                    }}
                  >
                    <i className="ti ti-logout" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="content">
          <header className="categories-header">
            <div>
              <h1 className="pg-title">Quản lý Danh Mục</h1>
              <p className="pg-sub">
                Quản lý các nhóm sản phẩm (đồ ăn, nước uống, combo...) phục vụ kinh doanh tại cụm rạp.
              </p>
            </div>
            {isStaffOrOwner && (
              <button className="btn-primary" onClick={openAddModal}>
                <i className="ti ti-plus" /> Thêm danh mục
              </button>
            )}
          </header>

          {/* Alerts */}
          {success && <div className="message-alert success">{success}</div>}
          {error && <div className="message-alert error">{error}</div>}

          {/* Filters */}
          <section className="filter-bar">
            <div className="filter-bar__search-container" style={{ position: "relative", flex: 1 }}>
              <i className="ti ti-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Tìm tên thể loại, mô tả..."
                className="filter-bar__search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: "36px" }}
              />
            </div>

            {isStaffOrOwner && (
              <select
                className="filter-bar__select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả Trạng thái</option>
                <option value="active">Đang kích hoạt (Active)</option>
                <option value="inactive">Tạm khóa (Inactive)</option>
              </select>
            )}
          </section>

          {/* Table grid */}
          {loading ? (
            <div className="state-display">Đang tải danh sách...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="state-display">Không tìm thấy danh mục nào phù hợp.</div>
          ) : (
            <div className="table-wrapper">
              <table className="categories-table">
                <thead>
                  <tr>
                    <th>Tên danh mục</th>
                    <th>Mô tả chi tiết</th>
                    <th>Trạng thái</th>
                    {isStaffOrOwner && <th className="text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((cat) => (
                    <tr key={cat._id}>
                      <td className="font-semibold">{cat.name}</td>
                      <td className="text-muted">{cat.description || "—"}</td>
                      <td>
                        <span className={`status-badge ${cat.isActive ? "active" : "inactive"}`}>
                          {cat.isActive ? "Đang kích hoạt" : "Tạm khóa"}
                        </span>
                      </td>
                      {isStaffOrOwner && (
                        <td className="text-right action-cell">
                          <button 
                            className={`action-btn toggle-status ${cat.isActive ? "active" : "inactive"}`} 
                            onClick={() => handleToggleActive(cat)}
                            title={cat.isActive ? "Tạm dừng hoạt động" : "Kích hoạt lại"}
                          >
                            {cat.isActive ? "Tạm dừng" : "Kích hoạt"}
                          </button>
                          <button className="action-btn edit" onClick={() => openEditModal(cat)}>
                            Sửa
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{modalType === "add" ? "Thêm thể loại mới" : "Chỉnh sửa thể loại"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <i className="ti ti-x" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <label className="form-label">
                Tên danh mục *
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Bắp rang bơ, Nước uống, Đồ ăn nhẹ"
                  required
                />
              </label>

              <label className="form-label">
                Mô tả chi tiết
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Mô tả tóm tắt về nhóm sản phẩm này..."
                  rows="3"
                />
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleInputChange}
                />
                <span>Cho phép hiển thị ngoài màn hình bán hàng (Kích hoạt)</span>
              </label>

              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-btn cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="modal-btn submit" disabled={submitting}>
                  {submitting ? "Đang xử lý..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ChangePasswordModal isOpen={cpModalOpen} onClose={() => setCpModalOpen(false)} />
    </div>
  );
}

export default CategoriesPage;
