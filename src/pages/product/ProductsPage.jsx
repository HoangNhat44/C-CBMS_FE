import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { ownerMenuItems } from "../dashboard/Owner";
import { staffMenuItems } from "../dashboard/Staff";
import Topbar from "../../components/Topbar";
import productService from "../../services/product.service";
import branchService from "../../services/branch.service";
import categoryService from "../../services/category.service";
import "./ProductsPage.css";

const STATIC_CATEGORIES = [
  { _id: "655f46f4b6d4e82b8c9e0001", name: "Bắp rang bơ (Popcorn)" },
  { _id: "655f46f4b6d4e82b8c9e0002", name: "Nước ngọt (Beverages)" },
  { _id: "655f46f4b6d4e82b8c9e0003", name: "Đồ ăn nhẹ (Snacks)" },
  { _id: "655f46f4b6d4e82b8c9e0004", name: "Combo tiện lợi (Combos)" }
];

const initialForm = {
  name: "",
  price: "",
  categoryId: STATIC_CATEGORIES[0]._id,
  image: "",
  description: "",
  availableBranches: [],
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

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState(STATIC_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add"); // "add" or "edit"
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);

  // Layout states
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const isStaff = user?.role === "staff" || (!user?.role && localStorage.getItem("current_dashboard") === "staff");
  const isOwner = user?.role === "owner" || (!user?.role && localStorage.getItem("current_dashboard") === "owner");

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Fetch branches
      const branchRes = await branchService.getAllBranches();
      const branchData = branchRes.data?.data || [];
      setBranches(branchData);

      // 2. Fetch categories dynamically
      try {
        const categoryRes = await categoryService.getAllCategories();
        const categoryData = categoryRes.data?.data || [];
        if (categoryData.length > 0) {
          setCategories(categoryData);
        }
      } catch (catErr) {
        console.error("Lỗi khi tải danh mục động, sử dụng danh mục tĩnh:", catErr);
      }

      // 3. Fetch products
      const params = {};
      if (selectedCategory) params.categoryId = selectedCategory;

      const tokenUser = decodeToken(localStorage.getItem("token"));
      const isStaffUser = tokenUser?.role === "staff";

      if (isStaffUser && tokenUser?.branchId) {
        params.branchId = tokenUser.branchId;
      } else if (selectedBranch) {
        params.branchId = selectedBranch;
      }

      const productRes = await productService.getAllProducts(params);
      setProducts(productRes.data?.data || []);
    } catch (err) {
      setError(
        err.response?.data?.error
          ? `${err.response.data.message}: ${err.response.data.error}`
          : err.response?.data?.message || "Không thể tải danh sách dữ liệu"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, selectedCategory]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(decoded);
        if (decoded.role === "staff" && decoded.branchId) {
          setSelectedBranch(decoded.branchId);
        }
      } else {
        localStorage.removeItem("token");
      }
    }
    fetchData();
  }, [fetchData]);



  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-hide error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login", { replace: true });
  };

  const handleMenuChange = (key) => {
    if (key === "product") return;
    if (key === "category") {
      navigate("/categories");
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
    if (key === "facility") {
      navigate("/branches");
      return;
    }
    if (key === "slot") {
      navigate("/slots");
      return;
    }
    if (key === "promotion" || key === "revenue" || key === "service" || key === "adduser") {
      navigate(isStaff ? "/staff-dashboard" : "/owner-dashboard", { state: { activeTab: key } });
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

  const handleBranchCheckboxChange = (branchId, isChecked) => {
    setForm((prev) => {
      const currentBranches = [...prev.availableBranches];
      if (isChecked) {
        return {
          ...prev,
          availableBranches: [...currentBranches, branchId],
        };
      } else {
        return {
          ...prev,
          availableBranches: currentBranches.filter((id) => id !== branchId),
        };
      }
    });
  };

  const openAddModal = () => {
    setForm({
      ...initialForm,
      categoryId: categories[0]?._id || STATIC_CATEGORIES[0]._id,
    });
    setModalType("add");
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setForm({
      name: product.name,
      price: product.price,
      categoryId: product.categoryId?._id || categories[0]?._id || STATIC_CATEGORIES[0]._id,
      image: product.image || "",
      description: product.description || "",
      availableBranches: product.availableBranches?.map(b => typeof b === 'object' ? b._id : b) || [],
      isActive: product.isActive ?? true,
    });
    setEditingId(product._id);
    setModalType("edit");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isStaffUser = userRole === "staff";

    // For staff, branch is automatically linked in the BE, so we do not enforce client-side selection
    const finalBranches = isStaffUser ? [] : form.availableBranches;

    if (!form.name || !form.price || (!isStaffUser && finalBranches.length === 0)) {
      setError("Vui lòng nhập đầy đủ Tên, Giá và chọn ít nhất 1 Chi nhánh");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const payload = {
        ...form,
        price: Number(form.price),
        availableBranches: finalBranches,
      };

      if (modalType === "add") {
        await productService.createProduct(payload);
        setSuccess("Thêm sản phẩm thành công!");
      } else {
        await productService.updateProduct(editingId, payload);
        setSuccess("Cập nhật sản phẩm thành công!");
      }

      setIsModalOpen(false);
      setForm(initialForm);
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.error
          ? `${err.response.data.message}: ${err.response.data.error}`
          : err.response?.data?.message || "Lỗi khi lưu thông tin sản phẩm"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      setError("");
      setSuccess("");
      const updatedProduct = { ...product, isActive: !product.isActive };
      if (updatedProduct.categoryId && typeof updatedProduct.categoryId === "object") {
        updatedProduct.categoryId = updatedProduct.categoryId._id;
      }
      if (updatedProduct.availableBranches && updatedProduct.availableBranches.length > 0) {
        updatedProduct.availableBranches = updatedProduct.availableBranches.map(b => b._id || b);
      }
      await productService.updateProduct(product._id, updatedProduct);
      setSuccess(`Cập nhật trạng thái sản phẩm "${product.name}" thành công!`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể cập nhật trạng thái");
    }
  };

  const userRole = isStaff ? "staff" : isOwner ? "owner" : "guest";
  const isStaffOrOwner = isOwner || isStaff;

  // Client-side search and status filter
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === "" ? true : (statusFilter === "active" ? p.isActive : !p.isActive);

    return matchesSearch && matchesStatus;
  });

  const staffBranchName = user?.branchId?.name || "Chi nhánh của bạn";

  return (
    <div className="dash">
      <Sidebar
        menuItems={isStaff ? staffMenuItems : ownerMenuItems}
        active="product"
        setActive={handleMenuChange}
        handleLogout={handleLogout}
        onLogoClick={() => navigate(isStaff ? "/staff-dashboard" : "/owner-dashboard")}
      />

      <div className="main">
        <Topbar breadcrumbs={[{ label: "Trang chủ", link: isStaff ? "/staff-dashboard" : "/owner-dashboard" }, { label: "Quản lý thực đơn" }]} />

        <div className="content">
          <header className="products-header">
            <div>
              <h1 className="pg-title">Sản Phẩm & Đồ Ăn Kèm</h1>
              <p className="pg-sub">
                Quản lý danh sách bắp nước, đồ ăn vặt và sản phẩm dịch vụ tại phòng chiếu phim.
              </p>
            </div>
            {isStaffOrOwner && (
              <button className="btn-primary" onClick={openAddModal}>
                <i className="ti ti-plus" /> Thêm sản phẩm
              </button>
            )}
          </header>

          {/* Messages */}
          {success && <div className="message-alert success">{success}</div>}
          {error && <div className="message-alert error">{error}</div>}

          {/* Filter Bar */}
          <section className="filter-bar">
            <div className="filter-bar__search-container" style={{ position: "relative", flex: 1 }}>
              <i className="ti ti-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Tìm tên sản phẩm, mô tả..."
                className="filter-bar__search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: "36px" }}
              />
            </div>

            {userRole === "staff" ? (
              <div className="filter-bar__static-branch" style={{ display: "flex", alignItems: "center", padding: "0 12px", fontSize: "14px", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: "8px", background: "#f8fafc" }}>
                <i className="ti ti-map-pin" style={{ marginRight: "6px" }} />
                <span>Chi nhánh: {staffBranchName}</span>
              </div>
            ) : (
              <select
                className="filter-bar__select"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="">Tất cả Chi nhánh</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            <select
              className="filter-bar__select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Tất cả Loại sản phẩm</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            {isStaffOrOwner && (
              <select
                className="filter-bar__select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả Trạng thái</option>
                <option value="active">Đang kinh doanh (Active)</option>
                <option value="inactive">Tạm dừng (Inactive)</option>
              </select>
            )}
          </section>

          {/* Products Display */}
          {loading ? (
            <div className="state-display">Đang tải danh sách sản phẩm...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="state-display">Không tìm thấy sản phẩm nào phù hợp.</div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => {
                const prodCategory = categories.find(c => c._id === (product.categoryId?._id || product.categoryId))?.name || "Khác";
                return (
                  <article className="product-card" key={product._id} onClick={() => setSelectedDetailProduct(product)} style={{ cursor: "pointer" }}>
                    <div className="product-card__image-container">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="product-card__img" />
                      ) : (
                        <div className="product-card__placeholder">
                          <i className="ti ti-coffee" style={{ fontSize: "32px", color: "var(--text-faint)" }} />
                        </div>
                      )}
                      <span className="product-card__category">{prodCategory}</span>
                    </div>

                    <div className="product-card__content">
                      <div className="product-card__title-row">
                        <h3 className="product-card__name">{product.name}</h3>
                        {isStaffOrOwner && (
                          <span className={`product-card__status-badge ${product.isActive ? "active" : "inactive"}`}>
                            {product.isActive ? "Kinh doanh" : "Tạm dừng"}
                          </span>
                        )}
                      </div>

                      <p className="product-card__desc">{product.description || "Chưa có mô tả chi tiết."}</p>

                      {userRole !== "staff" && (
                        <div className="product-card__branches">
                          <div className="product-card__branches-header">
                            <i className="ti ti-map-pin" style={{ marginRight: "4px", color: "#0d9488" }} />
                            <span>Bán tại:</span>
                          </div>
                          <div className="product-card__branch-badges">
                            {product.availableBranches && product.availableBranches.length > 0 ? (
                              product.availableBranches.map((b) => (
                                <span key={b._id || b} className="branch-badge">
                                  {b.name || "Chi nhánh"}
                                </span>
                              ))
                            ) : (
                              <span className="branch-badge empty">Chưa có chi nhánh</span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="product-card__price-row">
                        <span className="product-card__price-label">Giá bán:</span>
                        <span className="product-card__price">{product.price.toLocaleString("vi-VN")} đ</span>
                      </div>

                      {isStaffOrOwner && (
                        <div className="product-card__actions">
                          <button
                            className={`btn-toggle-status ${product.isActive ? "active" : "inactive"}`}
                            onClick={(e) => { e.stopPropagation(); handleToggleActive(product); }}
                            title={product.isActive ? "Tạm dừng kinh doanh" : "Mở bán lại"}
                          >
                            {product.isActive ? "Tạm dừng" : "Kích hoạt"}
                          </button>
                          <button className="btn-edit" onClick={(e) => { e.stopPropagation(); openEditModal(product); }}>
                            Sửa
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{modalType === "add" ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <i className="ti ti-x" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <label className="form-label">
                Tên sản phẩm *
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Bắp rang bơ phô mai cỡ lớn"
                  required
                />
              </label>

              <div className="form-row">
                <label className="form-label">
                  Giá bán (VNĐ) *
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 45000"
                    min="0"
                    required
                  />
                </label>

                <label className="form-label">
                  Phân loại sản phẩm *
                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleInputChange}
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="form-label">
                Đường dẫn hình ảnh
                <input
                  type="text"
                  name="image"
                  value={form.image}
                  onChange={handleInputChange}
                  placeholder="Nhập link ảnh (ví dụ: https://images.com/popcorn.jpg)"
                />
              </label>

              <label className="form-label">
                Mô tả chi tiết
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Nhập mô tả sản phẩm đồ ăn thức uống..."
                  rows="3"
                />
              </label>

              {userRole !== "staff" && (
                <div className="form-label">
                  Chi nhánh khả dụng *
                  <p className="field-help">Chọn ít nhất một chi nhánh mà sản phẩm này được bán:</p>
                  <div className="branches-checkbox-group">
                    {branches.length === 0 ? (
                      <p className="no-branches-warning">Đang tải danh sách chi nhánh hoặc chưa có chi nhánh nào...</p>
                    ) : (
                      branches.map((b) => (
                        <label key={b._id} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={form.availableBranches.includes(b._id)}
                            onChange={(e) => handleBranchCheckboxChange(b._id, e.target.checked)}
                          />
                          {b.name}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              <label className="checkbox-item active-toggle">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleInputChange}
                />
                Kinh doanh sản phẩm này (Active)
              </label>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? "Đang lưu..." : "Lưu lại"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedDetailProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedDetailProduct(null)}>
          <div className="modal-content product-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết sản phẩm</h2>
              <button className="modal-close" onClick={() => setSelectedDetailProduct(null)}>
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body product-detail-body">
              <div className="detail-image-container">
                {selectedDetailProduct.image ? (
                  <img src={selectedDetailProduct.image} alt={selectedDetailProduct.name} className="detail-image" />
                ) : (
                  <div className="detail-placeholder">
                    <i className="ti ti-coffee" style={{ fontSize: "32px", color: "var(--text-faint)" }} />
                  </div>
                )}
              </div>
              <div className="detail-info">
                <h3 className="detail-title">{selectedDetailProduct.name}</h3>
                <span className={`product-card__status-badge ${selectedDetailProduct.isActive ? "active" : "inactive"}`} style={{ display: "inline-block", marginBottom: "12px" }}>
                  {selectedDetailProduct.isActive ? "Kinh doanh" : "Tạm dừng"}
                </span>
                <div className="detail-item">
                  <strong>Phân loại:</strong> <span>{categories.find(c => c._id === (selectedDetailProduct.categoryId?._id || selectedDetailProduct.categoryId))?.name || "Khác"}</span>
                </div>
                <div className="detail-item">
                  <strong>Giá bán:</strong> <span className="detail-price">{selectedDetailProduct.price.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="detail-item">
                  <strong>Mô tả:</strong>
                  <p className="detail-desc">{selectedDetailProduct.description || "Chưa có mô tả chi tiết cho sản phẩm này."}</p>
                </div>
                {userRole !== "staff" && (
                  <div className="detail-item">
                    <strong>Bán tại chi nhánh:</strong>
                    <div className="detail-branches">
                      {selectedDetailProduct.availableBranches && selectedDetailProduct.availableBranches.length > 0
                        ? selectedDetailProduct.availableBranches.map(b => b.name || "Chi nhánh").join(", ")
                        : "Chưa có chi nhánh"}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-submit" onClick={() => setSelectedDetailProduct(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ProductsPage;
