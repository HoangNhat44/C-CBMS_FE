import { useEffect, useState, useCallback } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import feedbackService from "../../services/feedback.service";
import branchService from "../../services/branch.service";
import roomAPI from "../../services/room.service";
import { useAuth } from "../../context/AuthContext";
import "./FeedbacksPage.css";

function PublicFeedbacksPage() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [branchFilter, setBranchFilter] = useState("");
  const [rooms, setRooms] = useState([]);
  const [roomFilter, setRoomFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Edit states
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await branchService.getAllBranches();
      setBranches(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (branchFilter) params.branchId = branchFilter;
      if (roomFilter) params.roomId = roomFilter;
      if (ratingFilter) params.rating = ratingFilter;
      if (sortBy) params.sortBy = sortBy;
      
      const res = await feedbackService.getAllFeedbacks(params);
      let data = res.data?.data || [];
      // Filter out non-visible
      data = data.filter(f => f.isVisible !== false);
      setFeedbacks(data);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách phản hồi");
    } finally {
      setLoading(false);
    }
  }, [branchFilter, roomFilter, ratingFilter, sortBy]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  useEffect(() => {
    const params = branchFilter ? { branchId: branchFilter } : {};
    roomAPI.getAllRooms(params).then(res => {
      setRooms(res.data || []);
      setRoomFilter("");
    }).catch(err => console.error(err));
  }, [branchFilter]);

  // Frontend search filter for robust filtering if backend doesn't support roomId
  const filteredFeedbacks = feedbacks.filter((item) => {
    if (roomFilter && item.roomId?._id !== roomFilter) return false;
    return true;
  });

  const totalReviews = filteredFeedbacks.length;
  const averageRating = totalReviews > 0
    ? (filteredFeedbacks.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
    : "0.0";

  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  filteredFeedbacks.forEach((f) => {
    if (starCounts[f.rating] !== undefined) {
      starCounts[f.rating]++;
    }
  });

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

  const handleStartEdit = (item) => {
    setEditingFeedback(item);
    setEditRating(item.rating);
    setEditComment(item.comment || "");
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      await feedbackService.updateFeedback(editingFeedback._id, {
        rating: editRating,
        comment: editComment
      });
      setEditingFeedback(null);
      fetchFeedbacks();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể cập nhật đánh giá");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này không?")) {
      return;
    }
    try {
      setSaving(true);
      const res = await feedbackService.deleteFeedback(feedbackId);
      if (res.data?.success || res.success) {
        alert("Xóa đánh giá thành công!");
        fetchFeedbacks();
      }
    } catch (err) {
      console.error(err);
      alert("Xóa đánh giá thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const currentUserId = user?._id || user?.id;

  return (
    <div className="lp" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <div className="public-main-content" style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px", flex: 1, width: "100%", marginTop: "80px" }}>
        <div className="content">
          <div className="feedbacks-header-row">
            <div>
              <h1 className="pg-title">Đánh giá khách hàng</h1>
              <p className="pg-sub">Xem những đánh giá và trải nghiệm từ khách hàng về các dịch vụ của chúng tôi.</p>
            </div>
          </div>

          {error && (
            <div className="message-alert error">
              <i className="ti ti-info-circle" style={{ marginRight: 8 }} /> <span>{error}</span>
            </div>
          )}

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

          <div className="filters-card">
            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label">Chi nhánh</label>
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
              </div>

              <div className="filter-group">
                <label className="filter-label">Chọn phòng</label>
                <select
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                  className="filter-input"
                  disabled={rooms.length === 0}
                >
                  <option value="">Tất cả các phòng</option>
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id}>{r.roomName}</option>
                  ))}
                </select>
              </div>

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

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải danh sách phản hồi...</p>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
             <div className="no-data-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
              <i className="ti ti-message no-data-icon" style={{ fontSize: "3rem", color: "#94a3b8" }} />
              <h3>Không tìm thấy phản hồi nào</h3>
              <p>Thử thay đổi bộ lọc tìm kiếm.</p>
            </div>
          ) : (
            <div className="feedbacks-grid">
              {filteredFeedbacks.map((item) => {
                const submissionDate = new Date(item.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                const isOwnFeedback = currentUserId && (
                  (item.customerId?._id && String(item.customerId._id) === String(currentUserId)) ||
                  (typeof item.customerId === "string" && String(item.customerId) === String(currentUserId)) ||
                  (item.customerId?.id && String(item.customerId.id) === String(currentUserId))
                );

                return (
                  <div
                    key={item._id}
                    className="feedback-card"
                  >
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
                      </div>
                    </div>

                    <div className="card-rating-row">
                      <div className="card-stars">{renderStars(item.rating)}</div>
                      <span className="card-date">
                        <i className="ti ti-calendar date-icon" style={{ marginRight: 4 }} /> {submissionDate}
                      </span>
                    </div>

                    <div className="card-tags-row">
                      <span className="tag-chip tag-branch">
                        {item.branchId?.name || "Chi nhánh khác"}
                      </span>
                      <span className="tag-chip tag-room">
                        Phòng: {item.roomId?.roomName || "N/A"}
                      </span>
                    </div>

                    <div className="feedback-comment-content">
                      "{item.comment || "Không có bình luận viết tay."}"
                    </div>

                    {isOwnFeedback && (
                      <div className="feedback-card-actions" style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px", marginTop: "auto", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button
                          className="btn-action"
                          style={{
                            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                            color: "#ffffff",
                            padding: "6px 12px",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            borderRadius: "6px",
                            cursor: "pointer",
                            border: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                          onClick={() => handleDeleteFeedback(item._id)}
                        >
                          <i className="ti ti-trash" /> Xóa
                        </button>
                        <button
                          className="btn-action"
                          style={{
                            background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                            color: "#ffffff",
                            padding: "6px 12px",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            borderRadius: "6px",
                            cursor: "pointer",
                            border: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                          onClick={() => handleStartEdit(item)}
                        >
                          <i className="ti ti-edit" /> Sửa đánh giá
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
      <Footer />

      {/* Edit Feedback Modal */}
      {editingFeedback && (
        <div className="modal-overlay">
          <div className="modal-content feedback-modal">
            <div className="modal-header">
              <h3>Chỉnh sửa đánh giá của bạn</h3>
              <button className="btn-close-modal" onClick={() => setEditingFeedback(null)}>
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">Điểm đánh giá</label>
                <div className="star-picker">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className="star-picker-wrapper"
                      onClick={() => setEditRating(star)}
                    >
                      <i
                        className={`ti ${
                          star <= editRating ? "ti-star-filled" : "ti-star"
                        } star-picker-icon ${star <= editRating ? "active" : ""}`}
                        style={{ fontSize: "1.85rem", cursor: "pointer", color: star <= editRating ? "#f59e0b" : "#cbd5e1", marginRight: "4px" }}
                      />
                    </span>
                  ))}
                  <span className="star-picker-text">{editRating} / 5 sao</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Bình luận của bạn</label>
                <textarea
                  className="form-input-control textarea-control"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", minHeight: "100px" }}
                  placeholder="Chia sẻ thêm cảm nhận của bạn về phòng chiếu phim và dịch vụ..."
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setEditingFeedback(null)}
                disabled={saving}
              >
                Hủy
              </button>
              <button
                className="btn-submit"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicFeedbacksPage;
