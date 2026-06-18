import { useEffect, useState, useCallback } from "react";
import { FaTimes } from "react-icons/fa";
import categoryService from "../../services/category.service";
import "./CategoriesPage.css";

const initialForm = {
  name: "",
  description: "",
  isActive: true,
};

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Role simulation
  const [userRole, setUserRole] = useState(() => {
    const role = localStorage.getItem("simulated_role") || "owner";
    if ((role === "owner" || role === "staff") && !localStorage.getItem("token")) {
      localStorage.setItem("token", "simulated_owner_token_jwt");
    }
    return role;
  });

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add"); // "add" or "edit"
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

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
    fetchData();
  }, [fetchData]);

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

  // Handle simulated role change
  const handleRoleChange = (role) => {
    setUserRole(role);
    localStorage.setItem("simulated_role", role);
    if (role === "owner" || role === "staff") {
      localStorage.setItem("token", "simulated_owner_token_jwt");
    } else {
      localStorage.removeItem("token");
    }
    fetchData();
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

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này không?")) return;

    try {
      setError("");
      setSuccess("");
      await categoryService.deleteCategory(id);
      setSuccess("Xóa danh mục thành công!");
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.error
          ? `${err.response.data.message}: ${err.response.data.error}`
          : err.response?.data?.message || "Không thể xóa thể loại"
      );
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

  const isStaffOrOwner = userRole === "owner" || userRole === "staff";

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
    <div className="categories-container">
      {/* Role Simulator */}
      <div className="role-simulator">
        <span className="role-simulator__label">Chế độ phân vai (test):</span>
        <button
          className={`role-simulator__btn ${userRole === "owner" ? "active" : ""}`}
          onClick={() => handleRoleChange("owner")}
        >
          Owner
        </button>
        <button
          className={`role-simulator__btn ${userRole === "staff" ? "active" : ""}`}
          onClick={() => handleRoleChange("staff")}
        >
          Staff (Nhân viên)
        </button>

      </div>

      <header className="categories-header">
        <div>
          <span className="categories-header__eyebrow">Thực Đơn</span>
          <h1 className="categories-header__title">Danh Mục</h1>
          <p className="categories-header__desc">
            Quản lý các nhóm sản phẩm (đồ ăn, nước uống, combo...) phục vụ kinh doanh tại cụm rạp.
          </p>
        </div>
        {isStaffOrOwner && (
          <button className="categories-header__add-btn" onClick={openAddModal}>
            + Thêm danh mục
          </button>
        )}
      </header>

      {/* Alerts */}
      {success && <div className="message-alert success">{success}</div>}
      {error && <div className="message-alert error">{error}</div>}

      {/* Filters */}
      <section className="filter-bar">
        <input
          type="text"
          placeholder="Tìm tên thể loại, mô tả..."
          className="filter-bar__search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

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
                      {cat.isActive ? "Đang bán" : "Tạm dừng"}
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
                      <button className="action-btn delete" onClick={() => handleDelete(cat._id)}>
                        Xóa
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{modalType === "add" ? "Thêm thể loại mới" : "Chỉnh sửa thể loại"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <FaTimes />
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
    </div>
  );
}

export default CategoriesPage;
