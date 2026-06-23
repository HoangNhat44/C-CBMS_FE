import { useEffect, useState, useCallback } from "react";
import { 
  FaStar, 
  FaRegStar, 
  FaTimes, 
  FaPlus, 
  FaSearch, 
  FaTrashAlt, 
  FaEye, 
  FaEyeSlash, 
  FaCheckCircle, 
  FaInfoCircle,
  FaCalendarAlt,
  FaRegCommentDots,
  FaMapMarkerAlt
} from "react-icons/fa";
import feedbackService from "../../services/feedback.service";
import branchService from "../../services/branch.service";
import "./FeedbacksPage.css";

const mockBookings = [
  {
    _id: "6a3936aa974188f7b1badcc5",
    userId: "6a38f6096149376ca36423a0",
    branchId: "6a3148f6c7aee5bfd334c2b6",
    slotId: "6a3148f8c7aee5bfd334c2c7",
    date: "2026-01-21T04:00:00.000Z",
    amount: 180000,
    status: "completed",
    note: "Generated booking for 1/21/2026"
  },
  {
    _id: "6a3936aa974188f7b1badcc6",
    userId: "6a38f6096149376ca36423a0",
    branchId: "6a3148f6c7aee5bfd334c2b6",
    slotId: "6a3148f8c7aee5bfd334c2c8",
    date: "2026-01-17T03:00:00.000Z",
    amount: 400000,
    status: "completed",
    note: "Generated booking for 1/17/2026"
  }
];

const initialForm = {
  bookingId: "",
  rating: 5,
  comment: "",
};

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

  // Role simulation
  const [userRole, setUserRole] = useState(() => {
    const role = localStorage.getItem("simulated_role") || "owner";
    if (role === "owner" && !localStorage.getItem("token")) {
      localStorage.setItem("token", "simulated_owner_token_jwt");
    } else if (role === "staff" && !localStorage.getItem("token")) {
      localStorage.setItem("token", "simulated_staff_token_jwt");
    } else if (role === "customer" && !localStorage.getItem("token")) {
      localStorage.setItem("token", "simulated_customer_token_jwt");
    }
    return role;
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
      if (branchFilter) params.branchId = branchFilter;
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
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks, userRole]);

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

  // Handle Simulated Role Change
  const handleRoleChange = (role) => {
    setUserRole(role);
    localStorage.setItem("simulated_role", role);
    if (role === "owner") {
      localStorage.setItem("token", "simulated_owner_token_jwt");
      setBranchFilter("");
    } else if (role === "staff") {
      localStorage.setItem("token", "simulated_staff_token_jwt");
      setBranchFilter("6a3148f6c7aee5bfd334c2b5");
    } else if (role === "customer") {
      localStorage.setItem("token", "simulated_customer_token_jwt");
      setBranchFilter("");
    } else {
      localStorage.removeItem("token");
      setBranchFilter("");
    }
    setError("");
    setSuccess("");
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
        stars.push(<FaStar key={i} className="star-icon active" />);
      } else {
        stars.push(<FaRegStar key={i} className="star-icon" />);
      }
    }
    return stars;
  };

  return (
    <div className="feedbacks-container">
      {/* Role Simulator Bar */}
      <div className="role-simulator-bar">
        <span className="role-simulator-label">Vai trò giả lập (Kiểm thử):</span>
        <div className="role-simulator-buttons">
          <button 
            className={`role-btn ${userRole === "owner" ? "active owner" : ""}`}
            onClick={() => handleRoleChange("owner")}
          >
            Owner (Quản trị)
          </button>
          <button 
            className={`role-btn ${userRole === "staff" ? "active staff" : ""}`}
            onClick={() => handleRoleChange("staff")}
          >
            Staff (Nhân viên)
          </button>
          <button 
            className={`role-btn ${userRole === "customer" ? "active customer" : ""}`}
            onClick={() => handleRoleChange("customer")}
          >
            Customer (Khách hàng)
          </button>
          <button 
            className={`role-btn ${userRole === "guest" ? "active guest" : ""}`}
            onClick={() => handleRoleChange("guest")}
          >
            Guest (Khách vãng lai)
          </button>
        </div>
      </div>

      {/* Header Title */}
      <div className="feedbacks-header-row">
        <div>
          <h1 className="feedbacks-title">Đánh giá & Phản hồi</h1>
          <p className="feedbacks-subtitle">
            Xem và quản lý các ý kiến, xếp hạng sao từ khách hàng sử dụng dịch vụ đặt phòng chiếu.
          </p>
        </div>
        {userRole === "customer" && (
          <button className="btn-add-feedback" onClick={openAddModal}>
            <FaPlus /> Viết đánh giá
          </button>
        )}
      </div>

      {/* Feedback Alerts */}
      {success && (
        <div className="alert-message alert-success">
          <FaCheckCircle /> <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="alert-message alert-error">
          <FaInfoCircle /> <span>{error}</span>
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
                  <span className="dist-star-label">{star} <FaStar className="star-mini" /></span>
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
              <FaSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Tìm kiếm nội dung đánh giá..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="filter-input search-input"
              />
            </div>
          </div>

          {/* Branch Filter */}
          <div className="filter-group">
            <label className="filter-label">Chi nhánh</label>
            {userRole === "staff" ? (
              <div className="filter-static-branch">
                <FaMapMarkerAlt style={{ marginRight: "6px", color: "#64748b" }} />
                <span>Cinema Cafe Nguyen Trai</span>
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
          <FaRegCommentDots className="no-data-icon" />
          <h3>Không tìm thấy phản hồi nào</h3>
          <p>Thử thay đổi bộ lọc tìm kiếm hoặc viết một đánh giá mới.</p>
        </div>
      ) : (
        /* Feedback Grid List */
        <div className="feedbacks-grid">
          {feedbacks.map((item) => {
            const isStaffOrOwner = ["owner", "staff"].includes(userRole);
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
                  <span className="card-date"><FaCalendarAlt className="date-icon" /> {submissionDate}</span>
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

                {/* Staff Control Buttons removed for Read-only Owner/Staff roles */}

                {/* Customer Edit/Delete Buttons (Own Feedback Only) */}
                {userRole === "customer" && (
                  ["6a37585ba60654f216467814", "6a2ff8b8b0b4281986ed6826", "6a2ff8b8b0b4281986ed6835", "6a2ff8b8b0b4281986ed6836", "6a38f6096149376ca36423a0"]
                    .includes(item.customerId?._id || item.customerId)
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
                      <FaTrashAlt /> Xóa
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Write Feedback Modal (Customer Role Only) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content feedback-modal">
            <div className="modal-header">
              <h3>{isEditing ? "Chỉnh sửa đánh giá dịch vụ" : "Đánh giá dịch vụ đặt phòng"}</h3>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <FaTimes />
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
                          <FaStar className="star-picker-icon active" />
                        ) : (
                          <FaRegStar className="star-picker-icon" />
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
    </div>
  );
}

export default FeedbacksPage;
