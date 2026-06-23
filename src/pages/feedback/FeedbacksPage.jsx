import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { ownerMenuItems } from "../dashboard/Owner";
import { staffMenuItems } from "../dashboard/Staff";
import ChangePasswordModal from "../authentication/ChangePasswordModal";
import feedbackService from "../../services/feedback.service";
import branchService from "../../services/branch.service";
import "./FeedbacksPage.css";

// Danh sách đơn đặt phòng của khách hàng đăng nhập - Leader sẽ tích hợp API thực tế tại đây
const mockBookings = [];

const initialForm = {
  bookingId: "",
  rating: 5,
  comment: "",
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

function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Layout states
  const [user, setUser] = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [cpModalOpen, setCpModalOpen] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  const isStaff = user?.role === "staff" || (!user?.role && localStorage.getItem("current_dashboard") === "staff");
  const isOwner = user?.role === "owner" || (!user?.role && localStorage.getItem("current_dashboard") === "owner");

  const openAddModal = () => {
    const reviewedIds = feedbacks.map((f) => f.bookingId?._id || f.bookingId);
    const unreviewed = mockBookings.filter((b) => !reviewedIds.includes(b._id));
    
    if (unreviewed.length > 0) {
      setForm({
        bookingId: unreviewed[0]._id,
        rating: 5,
        comment: "",
      });
    } else {
      setForm({
        bookingId: "",
        rating: 5,
        comment: "",
      });
    }
    setIsEditing(false);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setForm({
      bookingId: item.bookingId?._id || item.bookingId || "",
      rating: item.rating,
      comment: item.comment || "",
    });
    setIsEditing(true);
    setEditingId(item._id);
    setIsModalOpen(true);
  };

  const getBookingDetails = (bookingId) => {
    let b = mockBookings.find((x) => x._id === bookingId);
    if (b) {
      return {
        ...b,
        bookingDate: b.date,
        finalTotal: b.amount,
        branchId: { 
          name: b.branchId === "6a3148f6c7aee5bfd334c2b6" ? "Cinema Cafe Le Loi" : "Chi nhánh khác" 
        },
        roomId: { 
          roomName: b.slotId === "6a3148f8c7aee5bfd334c2c7" ? "Slot 5 (16:00 - 18:00)" : "Slot 6 (18:00 - 20:00)" 
        }
      };
    }
    
    const f = feedbacks.find((x) => (x.bookingId?._id || x.bookingId) === bookingId);
    if (f && f.bookingId) {
      return {
        bookingDate: f.bookingId.bookingDate || f.createdAt,
        branchId: { name: f.branchId?.name || "Chi nhánh" },
        roomId: { roomName: f.roomId?.roomName || "Phòng" },
        finalTotal: f.bookingId.finalTotal || 0,
      };
    }
    return null;
  };

  // Fetch branches for dropdown filter
  const fetchBranches = useCallback(async () => {
    try {
      const res = await branchService.getAllBranches();
      setBranches(res.data?.data || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách chi nhánh:", err);
    }
  }, []);

  // Fetch feedbacks matching current filters
  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      
      const tokenUser = decodeToken(localStorage.getItem("token"));
      const isStaffUser = tokenUser?.role === "staff";
      
      if (isStaffUser && tokenUser?.branchId) {
        params.branchId = tokenUser.branchId;
      } else if (branchFilter) {
        params.branchId = branchFilter;
      }
      
      if (ratingFilter) params.rating = ratingFilter;
      if (searchTerm) params.search = searchTerm;
      if (sortBy) params.sortBy = sortBy;

      const res = await feedbackService.getAllFeedbacks(params);
      setFeedbacks(res.data?.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Không thể tải danh sách phản hồi"
      );
    } finally {
      setLoading(false);
    }
  }, [branchFilter, ratingFilter, searchTerm, sortBy]);

  // Load initial data
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(decoded);
        if (decoded.role === "staff" && decoded.branchId) {
          setBranchFilter(decoded.branchId);
        }
      } else {
        localStorage.removeItem("token");
      }
    }
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

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

  // Auto-hide messages after 5 seconds
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
    if (key === "review") return;
    if (key === "category") {
      navigate("/categories");
      return;
    }
    if (key === "product") {
      navigate("/products");
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

  // Delete feedback (Staff / Owner only)
  const handleDeleteFeedback = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phản hồi này vĩnh viễn? Thao tác này không thể hoàn tác.")) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      const res = await feedbackService.deleteFeedback(id);
      if (res.data?.success) {
        setSuccess("Đã xóa phản hồi thành công!");
        fetchFeedbacks();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Không thể xóa phản hồi");
    }
  };

  // Handle feedback form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission (Create or Edit feedback)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.bookingId) {
      setError("Vui lòng chọn đơn đặt phòng cần đánh giá.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      if (isEditing) {
        const res = await feedbackService.updateFeedback(editingId, {
          rating: form.rating,
          comment: form.comment
        });
        if (res.data?.success) {
          setSuccess("Cập nhật đánh giá thành công!");
          setIsModalOpen(false);
          setForm(initialForm);
          setIsEditing(false);
          setEditingId(null);
          fetchFeedbacks();
        }
      } else {
        const postData = {
          bookingId: form.bookingId.trim(),
          rating: form.rating,
          comment: form.comment,
          isVisible: true
        };

        const res = await feedbackService.createFeedback(postData);
        if (res.data?.success) {
          setSuccess("Gửi đánh giá thành công! Cảm ơn ý kiến của bạn.");
          setIsModalOpen(false);
          setForm(initialForm);
          fetchFeedbacks();
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Không thể gửi phản hồi. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate statistics based on current feedback entries
  const totalReviews = feedbacks.length;
  const averageRating = totalReviews > 0 
    ? (feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
    : "0.0";

  // Star counts distribution
  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  feedbacks.forEach((f) => {
    if (starCounts[f.rating] !== undefined) {
      starCounts[f.rating]++;
    }
  });

  // Render yellow/grey stars helper
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<i key={i} className="ti ti-star-filled star-icon active" style={{ color: "#f59e0b" }} />);
      } else {
        stars.push(<i key={i} className="ti ti-star star-icon" style={{ color: "#cbd5e1" }} />);
      }
    }
    return stars;
  };

  const initials = getInitials(user?.fullName || user?.email || "");
  const isStaffOrOwner = isStaff || isOwner;
  const userRole = user?.role || (isStaff ? "staff" : isOwner ? "owner" : "guest");
  const staffBranchName = user?.branchId?.name || "Chi nhánh của bạn";

  return (
    <div className={isStaffOrOwner ? "dash" : "booking-page-layout"}>
      {isStaffOrOwner ? (
        <Sidebar
          menuItems={isStaff ? staffMenuItems : ownerMenuItems}
          active="review"
          setActive={handleMenuChange}
          handleLogout={handleLogout}
          onLogoClick={() => navigate(isStaff ? "/staff-dashboard" : "/owner-dashboard")}
        />
      ) : (
        <Header />
      )}

      <div className={isStaffOrOwner ? "main" : "public-main-content"} style={isStaffOrOwner ? {} : { maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
        {isStaffOrOwner && (
          <div className="topbar">
            <div className="topbar-left">
              <span className="breadcrumb">Trang chủ&nbsp;/&nbsp;</span>
              <span className="breadcrumb-active">Đánh giá khách hàng</span>
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
                  <div className="feedbacks-user-menu" style={{
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
        )}

        <div className="content">
          {/* Header Title */}
          <div className="feedbacks-header-row">
            <div>
              <h1 className="pg-title">Đánh giá & Phản hồi</h1>
              <p className="pg-sub">
                Xem và quản lý các ý kiến, xếp hạng sao từ khách hàng sử dụng dịch vụ đặt phòng chiếu.
              </p>
            </div>
            {userRole === "customer" && (
              <button className="btn-add-feedback btn-primary" onClick={openAddModal}>
                <i className="ti ti-plus" /> Viết đánh giá
              </button>
            )}
          </div>

          {/* Feedback Alerts */}
          {success && (
            <div className="message-alert success">
              <i className="ti ti-circle-check" style={{ marginRight: 8 }} /> <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="message-alert error">
              <i className="ti ti-info-circle" style={{ marginRight: 8 }} /> <span>{error}</span>
            </div>
          )}

          {/* Statistics Analytics Panel */}
          <div className="analytics-grid">
            <div className="analytics-card average-rating-card">
              <div className="average-rating-num">{averageRating}</div>
              <div className="average-rating-stars">
                {renderStars(Math.round(Number(averageRating)))}
              </div>
              <div className="average-rating-total">
                Tổng cộng <strong>{totalReviews}</strong> đánh giá
              </div>
            </div>

            <div className="analytics-card distribution-card">
              <h3 className="distribution-title">Phân bổ xếp hạng</h3>
              <div className="distribution-list">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = starCounts[star];
                  const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div key={star} className="distribution-row">
                      <span className="dist-star-label">
                        {star} <i className="ti ti-star-filled star-mini" style={{ color: "#fbbf24" }} />
                      </span>
                      <div className="dist-progress-bg">
                        <div 
                          className="dist-progress-fill" 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <span className="dist-count-label">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filter and Query Controls */}
          <div className="filters-card">
            <div className="filters-row">
              {/* Search keyword */}
              <div className="filter-group search-group">
                <label className="filter-label">Tìm kiếm từ khóa</label>
                <div className="search-input-wrapper">
                  <i className="ti ti-search search-icon" style={{ left: "12px", position: "absolute", color: "#94a3b8" }} />
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm nội dung đánh giá..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="filter-input search-input"
                    style={{ paddingLeft: "36px" }}
                  />
                </div>
              </div>

              {/* Branch Filter */}
              <div className="filter-group">
                <label className="filter-label">Chi nhánh</label>
                {userRole === "staff" ? (
                  <div className="filter-static-branch">
                    <i className="ti ti-map-pin" style={{ marginRight: "6px", color: "#64748b" }} />
                    <span>{staffBranchName}</span>
                  </div>
                ) : (
                  <select 
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="filter-input"
                  >
                    <option value="">Tất cả chi nhánh</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Rating Filter */}
              <div className="filter-group">
                <label className="filter-label">Số sao</label>
                <select 
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="filter-input"
                >
                  <option value="">Tất cả xếp hạng</option>
                  <option value="5">5 sao</option>
                  <option value="4">4 sao</option>
                  <option value="3">3 sao</option>
                  <option value="2">2 sao</option>
                  <option value="1">1 sao</option>
                </select>
              </div>

              {/* Sorting Option */}
              <div className="filter-group">
                <label className="filter-label">Sắp xếp</label>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-input"
                >
                  <option value="newest">Mới nhất trước</option>
                  <option value="highestRating">Đánh giá cao nhất</option>
                  <option value="lowestRating">Đánh giá thấp nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải danh sách phản hồi...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="no-data-card">
              <i className="ti ti-message no-data-icon" style={{ fontSize: "3rem", color: "#94a3b8" }} />
              <h3>Không tìm thấy phản hồi nào</h3>
              <p>Thử thay đổi bộ lọc tìm kiếm hoặc viết một đánh giá mới.</p>
            </div>
          ) : (
            /* Feedback Grid List */
            <div className="feedbacks-grid">
              {feedbacks.map((item) => {
                const submissionDate = new Date(item.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                return (
                  <div 
                    key={item._id} 
                    className={`feedback-card ${!item.isVisible ? "hidden-feedback" : ""}`}
                  >
                    {/* Card Header: User Avatar & Name */}
                    <div className="feedback-card-header">
                      <div className="user-avatar">
                        {item.customerId?.image ? (
                          <img src={item.customerId.image} alt={item.customerId.fullName} />
                        ) : (
                          <div className="avatar-placeholder">
                            {item.customerId?.fullName?.charAt(0).toUpperCase() || "K"}
                          </div>
                        )}
                      </div>
                      <div className="user-meta">
                        <h4 className="user-name">{item.customerId?.fullName || "Khách ẩn danh"}</h4>
                        <p className="user-email">{item.customerId?.email || ""}</p>
                      </div>
                    </div>

                    {/* Rating Stars */}
                    <div className="card-rating-row">
                      <div className="card-stars">{renderStars(item.rating)}</div>
                      <span className="card-date">
                        <i className="ti ti-calendar date-icon" style={{ marginRight: 4 }} /> {submissionDate}
                      </span>
                    </div>

                    {/* Booking & Branch tags */}
                    <div className="card-tags-row">
                      <span className="tag-chip tag-branch">
                        {item.branchId?.name || "Chi nhánh khác"}
                      </span>
                      <span className="tag-chip tag-room">
                        Phòng: {item.roomId?.roomName || "N/A"}
                      </span>
                    </div>

                    {/* Comment content */}
                    <div className="feedback-comment-content">
                      "{item.comment || "Không có bình luận viết tay."}"
                    </div>

                    {/* Customer Edit/Delete Buttons (Own Feedback Only) */}
                    {userRole === "customer" && (
                      (item.customerId?._id || item.customerId) === user?.userId
                    ) && (
                      <div className="feedback-card-actions">
                        <button 
                          className="btn-action btn-toggle-visible show"
                          onClick={() => openEditModal(item)}
                          title="Chỉnh sửa đánh giá"
                        >
                          Sửa đánh giá
                        </button>
                        <button 
                          className="btn-action btn-delete-feedback"
                          onClick={() => handleDeleteFeedback(item._id)}
                          title="Xóa đánh giá"
                        >
                          <i className="ti ti-trash" /> Xóa
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Write Feedback Modal (Customer Role Only) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content feedback-modal">
            <div className="modal-header">
              <h3>{isEditing ? "Chỉnh sửa đánh giá dịch vụ" : "Đánh giá dịch vụ đặt phòng"}</h3>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <i className="ti ti-x" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {/* Booking Info Box (Read-only, completely hides Booking ID) */}
                <div className="form-group">
                  <label className="form-label">Đơn đặt phòng đang đánh giá</label>
                  {form.bookingId ? (() => {
                    const bookingDetails = getBookingDetails(form.bookingId);
                    if (!bookingDetails) return <div className="booking-info-empty">Không tìm thấy chi tiết đơn đặt phòng.</div>;
                    const dateStr = new Date(bookingDetails.bookingDate).toLocaleDateString("vi-VN");
                    return (
                      <div className="booking-info-box">
                        <div className="booking-info-details">
                          <p><strong>Ngày đặt:</strong> {dateStr}</p>
                          <p><strong>Chi nhánh:</strong> {bookingDetails.branchId?.name}</p>
                          <p><strong>Phòng:</strong> {bookingDetails.roomId?.roomName}</p>
                          {bookingDetails.finalTotal > 0 && (
                            <p><strong>Tổng tiền:</strong> {bookingDetails.finalTotal.toLocaleString("vi-VN")}đ</p>
                          )}
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="booking-info-alert">
                      Bạn đã hoàn thành đánh giá cho tất cả các đơn đặt phòng của mình!
                    </div>
                  )}
                </div>

                {/* Rating Interactive stars */}
                <div className="form-group">
                  <label className="form-label required">Mức độ hài lòng (Số sao)</label>
                  <div className="star-picker">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star}
                        className="star-picker-wrapper"
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => setForm((prev) => ({ ...prev, rating: star }))}
                      >
                        {star <= (hoveredStar || form.rating) ? (
                          <i className="ti ti-star-filled star-picker-icon active" style={{ color: "#f59e0b", fontSize: "1.85rem" }} />
                        ) : (
                          <i className="ti ti-star star-picker-icon" style={{ color: "#cbd5e1", fontSize: "1.85rem" }} />
                        )}
                      </span>
                    ))}
                    <span className="star-picker-text">
                      {(hoveredStar || form.rating) === 5 && "Rất tốt, cực kỳ hài lòng!"}
                      {(hoveredStar || form.rating) === 4 && "Hài lòng, dịch vụ ổn."}
                      {(hoveredStar || form.rating) === 3 && "Bình thường, tạm được."}
                      {(hoveredStar || form.rating) === 2 && "Không hài lòng lắm."}
                      {(hoveredStar || form.rating) === 1 && "Rất tệ, dịch vụ kém."}
                    </span>
                  </div>
                </div>

                {/* Comment Textarea */}
                <div className="form-group">
                  <label className="form-label">Ý kiến đóng góp thêm (Bình luận)</label>
                  <textarea 
                    name="comment"
                    value={form.comment}
                    onChange={handleFormChange}
                    placeholder="Hãy viết cảm nhận của bạn về chất lượng dịch vụ phòng, nhân viên rạp, hay độ sạch sẽ để rạp cải tiến..."
                    rows="4"
                    className="form-input-control textarea-control"
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                 <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={submitting || (!isEditing && !form.bookingId)}
                >
                  {submitting ? "Đang gửi..." : "Gửi đánh giá"}
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

export default FeedbacksPage;
