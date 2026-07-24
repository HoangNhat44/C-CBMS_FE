import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import bookingAPI from "../../services/booking.service";
import paymentAPI from "../../services/payment.service";
import refundAPI from "../../services/refund.service";
import feedbackService from "../../services/feedback.service";
import authAPI from "../../services/auth.service";
import PaymentQRModal from "../../components/PaymentQRModal";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { ownerMenuItems } from "../dashboard/Owner";
import { staffMenuItems } from "../dashboard/Staff";
import "../dashboard/Dashboard.css";
import "./BookingDetailPage.css";

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}



function BookingDetailPage() {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        return {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      }
    }
    return null;
  });
  
  // QR Modal States
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrData, setQrData] = useState({ qrCode: "", checkoutUrl: "", amount: 0 });

  // Refund States
  const [refund, setRefund] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [ownerNotes, setOwnerNotes] = useState("");
  const [proofImageBase64, setProofImageBase64] = useState("");

  // Feedback States
  const [feedback, setFeedback] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);




  const handleLogout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
    navigate("/login", { replace: true });
  };

  // Load User Info
  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = decodeToken(token);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          setCurrentUser({
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
          });
        }
        
        try {
          const verifyRes = await authAPI.verifyToken();
          if (verifyRes.data?.success) {
            setCurrentUser(verifyRes.data.data.user);
          } else {
            localStorage.removeItem("token");
            setCurrentUser(null);
          }
        } catch (verifyErr) {
          console.error("Token verification failed:", verifyErr);
          localStorage.removeItem("token");
          setCurrentUser(null);
        }
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (!bookingId) return;

    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await bookingAPI.getBookingById(bookingId);
        if (res.data?.success) {
          const bData = res.data.data;
          setBooking(bData);
          
          if (bData.status === "request_refund" || bData.status === "refunded") {
            try {
              const refundRes = await refundAPI.getRefundByBookingId(bookingId);
              if (refundRes.data?.success) {
                setRefund(refundRes.data.data);
              }
            } catch (rErr) {
              console.error("Failed to load refund details", rErr);
            }
          }

          if (bData.status === "completed") {
            try {
              const fbRes = await feedbackService.getAllFeedbacks({ bookingId });
              if (fbRes.data?.success && fbRes.data.data && fbRes.data.data.length > 0) {
                setFeedback(fbRes.data.data[0]);
              }
            } catch (fbErr) {
              console.error("Failed to load feedback details", fbErr);
            }
          }
        } else {
          setError("Không tìm thấy thông tin chi tiết đặt phòng.");
        }
      } catch (err) {
        console.error("Failed to load booking details", err);
        setError(err.response?.data?.message || "Lỗi khi tải thông tin chi tiết đặt phòng.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePayNow = async () => {
    try {
      setSubmitting(true);
      const res = await paymentAPI.createPaymentUrl(bookingId, "full");
      if (res.data?.success) {
        setQrData({
          qrCode: res.data.qrCode,
          checkoutUrl: res.data.checkoutUrl,
          amount: res.data.amount || (booking.roomTotal + booking.productTotal - (booking.discountAmount || 0)),
        });
        setIsQrOpen(true);
      } else {
        alert("Không thể tạo mã thanh toán VietQR.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi khi khởi tạo thanh toán: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus, confirmMsg, successMsg) => {
    if (!window.confirm(confirmMsg)) return;

    try {
      setSubmitting(true);
      const res = await bookingAPI.updateBookingStatus(bookingId, { status: newStatus });
      if (res.data?.success) {
        alert(successMsg || "Cập nhật trạng thái đặt phòng thành công!");
        setBooking(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert("Cập nhật thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = () => {
    handleUpdateStatus(
      "cancelled", 
      "Bạn có chắc chắn muốn hủy đơn đặt phòng này?", 
      "Đã hủy đặt phòng thành công!"
    );
  };

  const handleRequestRefund = () => {
    if (!booking) return;

    // Compare date to determine same-day
    const bookingDateObj = new Date(booking.bookingDate);
    bookingDateObj.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isSameDay = bookingDateObj.getTime() <= today.getTime();

    if (isSameDay) {
      if (window.confirm("Đơn đặt phòng này diễn ra trong ngày hôm nay. Theo quy định, hủy đơn đặt phòng trong ngày sẽ KHÔNG ĐƯỢC HOÀN LẠI TIỀN. Bạn có chắc chắn muốn hủy đơn và chấp nhận không hoàn tiền?")) {
        submitSameDayCancellation();
      }
    } else {
      setShowRefundModal(true);
    }
  };

  const submitSameDayCancellation = async () => {
    try {
      setSubmitting(true);
      const res = await refundAPI.createRefundRequest({
        bookingId,
        reason: "Hủy đặt phòng trong ngày (Không hoàn tiền)"
      });
      if (res.data?.success) {
        alert("Đã hủy đơn đặt phòng thành công (Không hoàn tiền).");
        // Reload details
        const updatedBooking = await bookingAPI.getBookingById(bookingId);
        if (updatedBooking.data?.success) {
          setBooking(updatedBooking.data.data);
          const rRes = await refundAPI.getRefundByBookingId(bookingId);
          if (rRes.data?.success) setRefund(rRes.data.data);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Hủy thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerRefundSubmit = async (e) => {
    e.preventDefault();
    if (!refundReason.trim()) {
      alert("Vui lòng nhập lý do hủy và thông tin nhận hoàn tiền.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await refundAPI.createRefundRequest({
        bookingId,
        reason: refundReason
      });
      if (res.data?.success) {
        alert("Gửi yêu cầu hoàn tiền thành công!");
        setShowRefundModal(false);
        // Reload details
        const updatedBooking = await bookingAPI.getBookingById(bookingId);
        if (updatedBooking.data?.success) {
          setBooking(updatedBooking.data.data);
          const rRes = await refundAPI.getRefundByBookingId(bookingId);
          if (rRes.data?.success) setRefund(rRes.data.data);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Gửi yêu cầu thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRefundRequest = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn rút lại yêu cầu hoàn tiền không?\nĐơn đặt phòng của bạn sẽ được khôi phục về trạng thái 'Đã xác nhận'.")) {
      return;
    }

    try {
      setSubmitting(true);
      const res = await refundAPI.cancelRefundRequest(bookingId);
      if (res.data?.success) {
        alert(res.data.message || "Rút lại yêu cầu hoàn tiền thành công!");
        // Reload details
        const updatedBooking = await bookingAPI.getBookingById(bookingId);
        if (updatedBooking.data?.success) {
          setBooking(updatedBooking.data.data);
        }
        setRefund(null);
      }
    } catch (err) {
      console.error("Cancel refund error:", err);
      alert("Rút lại yêu cầu thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackRating) {
      alert("Vui lòng chọn số sao đánh giá.");
      return;
    }

    try {
      setSubmitting(true);
      if (isEditingFeedback && feedback?._id) {
        const res = await feedbackService.updateFeedback(feedback._id, {
          rating: feedbackRating,
          comment: feedbackComment
        });
        if (res.data?.success) {
          alert("Cập nhật đánh giá thành công! Cảm ơn bạn.");
          setFeedback(res.data.data);
          setShowFeedbackModal(false);
          setIsEditingFeedback(false);
        } else {
          alert(res.data?.message || "Lỗi khi cập nhật đánh giá.");
        }
      } else {
        const res = await feedbackService.createFeedback({
          bookingId,
          rating: feedbackRating,
          comment: feedbackComment
        });
        if (res.data?.success) {
          alert("Gửi đánh giá thành công! Cảm ơn bạn.");
          setFeedback(res.data.data);
          setShowFeedbackModal(false);
          setFeedbackComment("");
        } else {
          alert(res.data?.message || "Lỗi khi gửi đánh giá.");
        }
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Không thể xử lý đánh giá.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOwnerApproveSubmit = async (e) => {
    e.preventDefault();
    if (!proofImageBase64) {
      alert("Vui lòng tải lên ảnh minh chứng đã chuyển khoản hoàn tiền.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await refundAPI.approveRefund(refund._id, {
        proofImage: proofImageBase64,
        adminNotes: ownerNotes
      });
      if (res.data?.success) {
        alert("Xác nhận đã hoàn tiền thành công!");
        setShowApproveModal(false);
        // Reload details
        const updatedBooking = await bookingAPI.getBookingById(bookingId);
        if (updatedBooking.data?.success) {
          setBooking(updatedBooking.data.data);
          const rRes = await refundAPI.getRefundByBookingId(bookingId);
          if (rRes.data?.success) setRefund(rRes.data.data);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Phê duyệt thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File ảnh quá lớn (chỉ cho phép tối đa 5MB).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCompleteBooking = () => {
    handleUpdateStatus(
      "completed", 
      "Xác nhận hoàn thành đơn đặt phòng này cho khách hàng?", 
      "Đã xác nhận hoàn thành đơn đặt phòng thành công!"
    );
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return { text: "CHỜ XÁC NHẬN", className: "status-tag--pending" };
      case "confirmed":
        return { text: "ĐÃ XÁC NHẬN", className: "status-tag--confirmed" };
      case "completed":
        return { text: "HOÀN THÀNH", className: "status-tag--completed" };
      case "cancelled":
        return { text: "ĐÃ HỦY", className: "status-tag--cancelled" };
      case "request_refund":
        return { text: "YÊU CẦU HOÀN TIỀN", className: "status-tag--pending" };
      case "refunded":
        return { text: "ĐÃ HOÀN TIỀN", className: "status-tag--refunded" };
      default:
        return { text: status.toUpperCase(), className: "" };
    }
  };

  const getPaymentStatusLabel = (payStatus) => {
    switch (payStatus) {
      case "unpaid":
        return { text: "CHƯA THANH TOÁN", className: "status-tag--unpaid" };
      case "paid":
        return { text: "ĐÃ THANH TOÁN", className: "status-tag--paid" };
      case "refunded":
        return { text: "ĐÃ HOÀN TIỀN", className: "status-tag--refunded" };
      default:
        return { text: payStatus.toUpperCase(), className: "" };
    }
  };

  const getRoleFromToken = () => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      return (decoded?.role || "").toLowerCase();
    }
    return "";
  };

  const roleName = (currentUser?.role?.name || currentUser?.role || getRoleFromToken() || "").toLowerCase();
  const isDashboardRole = roleName === "owner" || roleName === "staff";
  const menuItems = roleName === "staff" ? staffMenuItems : ownerMenuItems;

  const renderDashboardWrapper = (child) => {
    return (
      <div className={`dash ${roleName === "staff" ? "dash--staff" : ""}`}>
        <Sidebar
          menuItems={menuItems}
          active="bookinghistory"
          setActive={(key) => {
            if (roleName === "staff") {
              if (key === "category") navigate("/categories");
              else if (key === "product") navigate("/products");
              else if (key === "review") navigate("/feedbacks");
              else if (key === "bookinghistory") navigate("/bookinghistory");
              else if (key === "walkin") navigate("/walkin");
              else navigate("/staff-dashboard");
            } else {
              if (key === "room") navigate("/room");
              else if (key === "roomtype") navigate("/roomtype");
              else if (key === "news") navigate("/news");
              else if (key === "category") navigate("/categories");
              else if (key === "product") navigate("/products");
              else if (key === "review") navigate("/feedbacks");
              else if (key === "bookinghistory") navigate("/bookinghistory");
              else if (key === "facility") navigate("/branches");
              else if (key === "slot") navigate("/slots");
              else if (key === "promotion" || key === "revenue" || key === "service" || key === "adduser") {
                navigate("/owner-dashboard", { state: { activeTab: key } });
              } else {
                navigate("/owner-dashboard");
              }
            }
          }}
          handleLogout={handleLogout}
          onLogoClick={() => navigate(roleName === "staff" ? "/staff-dashboard" : "/owner-dashboard")}
        />

        <div className="main">
          <Topbar breadcrumbs={[{ label: "Trang chủ", link: roleName === "staff" ? "/staff-dashboard" : "/owner-dashboard" }, { label: "Lịch sử đặt phòng", link: "/bookinghistory" }, { label: "Chi tiết đơn đặt" }]} />

          {/* Content */}
          <div className="content" style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
            {child}
          </div>
        </div>

      </div>
    );
  };

  if (loading) {
    const loadingView = (
      <main className="booking-page detail-page" style={isDashboardRole ? { padding: 0, minHeight: "auto", background: "none" } : {}}>
        <section className="booking-content detail-content" style={isDashboardRole ? { maxWidth: "100%", padding: 0, boxShadow: "none", background: "none" } : {}}>
          <div className="booking-state booking-state--loading">
            <div className="spinner"></div>
            <p>Đang tải chi tiết đặt phòng...</p>
          </div>
        </section>
      </main>
    );
    return isDashboardRole ? renderDashboardWrapper(loadingView) : (
      <>
        <Header />
        {loadingView}
      </>
    );
  }

  if (error || !booking) {
    const errorView = (
      <main className="booking-page detail-page" style={isDashboardRole ? { padding: 0, minHeight: "auto", background: "none" } : {}}>
        <section className="booking-content detail-content" style={isDashboardRole ? { maxWidth: "100%", padding: 0, boxShadow: "none", background: "none" } : {}}>
          <div className="booking-state booking-state--error">
            <p>{error || "Đơn hàng không tồn tại."}</p>
            <button className="back-btn" onClick={() => navigate("/bookinghistory")}>
              ← Quay lại lịch sử đặt phòng
            </button>
          </div>
        </section>
      </main>
    );
    return isDashboardRole ? renderDashboardWrapper(errorView) : (
      <>
        <Header />
        {errorView}
      </>
    );
  }

  const statusObj = getStatusLabel(booking.status);
  const payStatusObj = getPaymentStatusLabel(booking.paymentStatus);
  const roomCost = booking.roomTotal || 0;
  const productCost = booking.productTotal || 0;
  const finalCost = booking.finalTotal || (roomCost + productCost - (booking.discountAmount || 0));

  const pageBody = (
    <main className="booking-page detail-page" style={isDashboardRole ? { padding: 0, minHeight: "auto", background: "none", height: "100%", width: "100%" } : {}}>
      {/* 2. Detail Container */}
      <section className="booking-content detail-content" style={isDashboardRole ? { maxWidth: "100%", padding: 0, boxShadow: "none", background: "none", height: "auto", overflow: "visible" } : {}}>
        <header className="detail-header">
          <button className="back-link-btn" onClick={() => navigate("/bookinghistory")}>
            ← Quay lại Lịch sử đặt phòng
          </button>
          <div className="detail-header-main">
            <h1>Chi tiết đơn hàng #{booking._id.substring(booking._id.length - 8).toUpperCase()}</h1>
            <div className="detail-header-status-tags">
              <span className={`status-tag ${statusObj.className}`}>{statusObj.text}</span>
              <span className={`status-tag ${payStatusObj.className}`}>{payStatusObj.text}</span>
            </div>
          </div>
        </header>

        <div className="detail-body-grid">
          {/* Main Info Section */}
          <div className="detail-main-info-card">
            {/* Customer Details */}
            <div className="info-block">
              <h3>👤 Thông tin khách hàng</h3>
              <div className="info-box-rows">
                <div className="info-box-row">
                  <span>Họ tên:</span>
                  <strong>{booking.customerId?.fullName || "Khách vãng lai"}</strong>
                </div>
                <div className="info-box-row">
                  <span>Điện thoại:</span>
                  <strong>{booking.customerId?.phone || "Chưa cập nhật"}</strong>
                </div>
                <div className="info-box-row">
                  <span>Email:</span>
                  <strong>{booking.customerId?.email || "Chưa cập nhật"}</strong>
                </div>
              </div>
            </div>

            {/* Room & Service Details */}
            <div className="info-block">
              <h3>🎬 Thông tin phòng chiếu</h3>
              <div className="info-box-rows">
                <div className="info-box-row">
                  <span>Phòng:</span>
                  <strong>{booking.roomId?.roomName || "Không rõ"}</strong>
                </div>
                <div className="info-box-row">
                  <span>Chi nhánh:</span>
                  <strong>{booking.branchId?.name || "Không rõ"}</strong>
                </div>
                <div className="info-box-row">
                  <span>Địa chỉ:</span>
                  <span>{booking.branchId?.address || "Không rõ"}</span>
                </div>
                <div className="info-box-row">
                  <span>Ngày sử dụng:</span>
                  <strong>{formatDate(booking.bookingDate)}</strong>
                </div>
                <div className="info-box-row">
                  <span>Thời gian chơi:</span>
                  <strong>{booking.startTime} - {booking.endTime} ({booking.totalHours} giờ)</strong>
                </div>
                <div className="info-box-row flex-col">
                  <span>Danh sách slot đặt:</span>
                  <div className="slot-badges-list">
                    {(booking.slotIds || []).map((slotObj) => (
                      <span key={slotObj._id || slotObj} className="detail-slot-badge">
                        {slotObj.name || slotObj} 
                        {slotObj.timeType === "golden" && " 🔥 Giờ vàng"}
                      </span>
                    ))}
                    {(!booking.slotIds || booking.slotIds.length === 0) && booking.slotId && (
                      <span className="detail-slot-badge">
                        {booking.slotId.name || booking.slotId}
                      </span>
                    )}
                  </div>
                </div>
                {booking.note && (
                  <div className="info-box-row flex-col">
                    <span>Ghi chú đặt phòng:</span>
                    <p className="detail-notes-text">"{booking.note}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* F&B and Checkout Calculations */}
          <div className="detail-invoice-summary-card">
            <div className="info-block">
              <h3>🍿 Dịch vụ đặt kèm (F&B)</h3>
              <div className="fb-items-container">
                {booking.products && booking.products.length > 0 ? (
                  <table className="detail-products-table">
                    <thead>
                      <tr>
                        <th>Tên sản phẩm</th>
                        <th className="text-right">Đơn giá</th>
                        <th className="text-center">SL</th>
                        <th className="text-right">Tổng cộng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {booking.products.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.name || "Sản phẩm"}</td>
                          <td className="text-right">{formatCurrency(item.price)}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-right">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-fb-text">Đơn đặt phòng này không đi kèm dịch vụ ăn uống.</div>
                )}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="info-block calculation-invoice-block">
              <h3>🧾 Tổng kết hóa đơn</h3>
              <div className="invoice-rows">
                <div className="invoice-row">
                  <span>Tiền thuê phòng:</span>
                  <span>{formatCurrency(roomCost)}</span>
                </div>
                {productCost > 0 && (
                  <div className="invoice-row">
                    <span>Tiền dịch vụ F&B:</span>
                    <span>{formatCurrency(productCost)}</span>
                  </div>
                )}
                {booking.discountAmount > 0 && (
                  <div className="invoice-row invoice-row--discount">
                    <span>Giảm giá:</span>
                    <span>-{formatCurrency(booking.discountAmount)}</span>
                  </div>
                )}
                <hr className="invoice-hr" />
                <div className="invoice-row invoice-row--grand">
                  <span>Tổng tiền thanh toán:</span>
                  <strong>{formatCurrency(finalCost)}</strong>
                </div>
              </div>
            </div>

            {/* Interactive Actions Panel based on user Role and Status */}
            {(() => {
              const roleName = (currentUser?.role?.name || currentUser?.role || "").toLowerCase();
              const isCustomer = roleName === "customer";
              const isStaffOrOwner = roleName === "staff" || roleName === "owner";

              return (
                <div className="detail-actions-panel">
                  {/* Customer specific flow */}
                  {isCustomer && (
                    <>
                      {booking.status === "pending" && (
                        <>
                          {booking.paymentStatus === "unpaid" && (
                            <button
                              type="button"
                              className="detail-action-btn detail-action-btn--pay"
                              onClick={handlePayNow}
                              disabled={submitting}
                            >
                              {submitting ? "Đang xử lý..." : "💳 Thanh toán ngay (VietQR)"}
                            </button>
                          )}
                          <button
                            type="button"
                            className="detail-action-btn detail-action-btn--cancel"
                            onClick={handleCancelBooking}
                            disabled={submitting}
                          >
                            {submitting ? "Đang xử lý..." : "🚫 Hủy đặt phòng"}
                          </button>
                        </>
                      )}
                      {booking.status === "confirmed" && (
                        <button
                          type="button"
                          className="detail-action-btn"
                          style={{
                            backgroundColor: "#f59e0b",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "12px",
                            padding: "14px",
                            fontSize: "0.95rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "background-color 0.2s"
                          }}
                          onClick={handleRequestRefund}
                          disabled={submitting}
                        >
                          {submitting ? "Đang xử lý..." : "✉️ Gửi yêu cầu hủy & hoàn tiền"}
                        </button>
                      )}
                      {booking.status === "completed" && !feedback && (
                        <button
                          type="button"
                          className="detail-action-btn detail-action-btn--pay"
                          style={{ backgroundColor: "#0f766e" }}
                          onClick={() => {
                            setFeedbackRating(5);
                            setFeedbackComment("");
                            setShowFeedbackModal(true);
                          }}
                          disabled={submitting}
                        >
                          ⭐ Viết đánh giá phản hồi
                        </button>
                      )}
                    </>
                  )}

                  {/* Staff / Owner specific flow */}
                  {isStaffOrOwner && (
                    <>
                      {booking.status === "pending" && (
                        <button
                          type="button"
                          className="detail-action-btn detail-action-btn--cancel"
                          onClick={handleCancelBooking}
                          disabled={submitting}
                        >
                          {submitting ? "Đang xử lý..." : "🚫 Hủy đơn đặt phòng"}
                        </button>
                      )}
                      {booking.status === "confirmed" && (
                        <>
                          <button
                            type="button"
                            className="detail-action-btn detail-action-btn--pay"
                            style={{ backgroundColor: "#10b981" }}
                            onClick={handleCompleteBooking}
                            disabled={submitting}
                          >
                            {submitting ? "Đang xử lý..." : "✅ Xác nhận hoàn thành"}
                          </button>
                          <button
                            type="button"
                            className="detail-action-btn detail-action-btn--cancel"
                            onClick={handleCancelBooking}
                            disabled={submitting}
                          >
                            {submitting ? "Đang xử lý..." : "🚫 Hủy đơn đặt phòng"}
                          </button>
                        </>
                      )}
                      {booking.status === "request_refund" && roleName === "owner" && (
                        <button
                          type="button"
                          className="detail-action-btn detail-action-btn--pay"
                          style={{ backgroundColor: "#3b82f6" }}
                          onClick={() => setShowApproveModal(true)}
                          disabled={submitting}
                        >
                          {submitting ? "Đang xử lý..." : "💳 Xác nhận hoàn tiền"}
                        </button>
                      )}
                      {booking.status === "request_refund" && refund?.status === "pending" && roleName !== "owner" && roleName !== "staff" && (
                        <button
                          type="button"
                          className="detail-action-btn detail-action-btn--cancel"
                          style={{ backgroundColor: "#ea580c", borderColor: "#ea580c" }}
                          onClick={handleCancelRefundRequest}
                          disabled={submitting}
                        >
                          {submitting ? "Đang xử lý..." : "🔄 Rút lại yêu cầu hoàn tiền"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {refund && (
          <div className="refund-info-card">
            <div className="info-block">
              <h3>💸 Thông tin yêu cầu hoàn tiền</h3>
              <div className="info-box-rows">
                <div className="info-box-row">
                  <span>Trạng thái yêu cầu:</span>
                  <strong>{refund.status === "pending" ? "ĐANG CHỜ DUYỆT" : refund.status === "refunded" ? "ĐÃ HOÀN TIỀN" : refund.status === "cancelled" ? "ĐÃ HỦY YÊU CẦU" : refund.status.toUpperCase()}</strong>
                </div>
                <div className="info-box-row">
                  <span>Số tiền hoàn trả:</span>
                  <strong style={{ color: "var(--primary)" }}>{formatCurrency(refund.amount)}</strong>
                </div>
                <div className="info-box-row flex-col">
                  <span>Lý do & Thông tin nhận tiền:</span>
                  <p className="detail-notes-text">"{refund.reason}"</p>
                </div>
                {refund.adminNotes && (
                  <div className="info-box-row flex-col">
                    <span>Ghi chú từ Owner:</span>
                    <p className="detail-notes-text" style={{ backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }}>"{refund.adminNotes}"</p>
                  </div>
                )}
                {refund.proofImage && (
                  <div className="info-box-row flex-col">
                    <span>Ảnh minh chứng chuyển khoản:</span>
                    <img src={refund.proofImage} alt="Chứng từ hoàn tiền" className="refund-proof-img" />
                  </div>
                )}
                {refund.status === "pending" && roleName !== "owner" && roleName !== "staff" && (
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #e5e7eb" }}>
                    <button
                      type="button"
                      onClick={handleCancelRefundRequest}
                      disabled={submitting}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#ea580c",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "600",
                        fontSize: "0.88rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      🔄 Rút lại yêu cầu hoàn tiền này
                    </button>
                    <p style={{ margin: "6px 0 0 0", fontSize: "0.8rem", color: "#6b7280" }}>
                      * Bấm vào đây nếu bạn bấm nhầm hoặc thay đổi ý định. Đơn phòng sẽ được khôi phục về trạng thái "Đã xác nhận".
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {feedback && (
          <div className="refund-info-card" style={{ marginTop: "20px" }}>
            <div className="info-block">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>⭐ Đánh giá phản hồi của bạn</h3>
                {roleName === 'customer' && (
                  <button
                    type="button"
                    onClick={() => {
                      setFeedbackRating(feedback.rating);
                      setFeedbackComment(feedback.comment || "");
                      setIsEditingFeedback(true);
                      setShowFeedbackModal(true);
                    }}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#f8fafc",
                      color: "#0f766e",
                      border: "1px solid #0d9488",
                      borderRadius: "6px",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    ✏️ Chỉnh sửa đánh giá
                  </button>
                )}
              </div>
              <div className="info-box-rows" style={{ marginTop: 0 }}>
                <div className="info-box-row">
                  <span>Đánh giá:</span>
                  <strong style={{ color: "#f59e0b", fontSize: "1.1rem" }}>
                    {"★".repeat(feedback.rating)}
                    {"☆".repeat(5 - feedback.rating)}
                    <span style={{ marginLeft: "6px", color: "#6b7280", fontSize: "0.9rem" }}>({feedback.rating}/5)</span>
                  </strong>
                </div>
                {feedback.comment && (
                  <div className="info-box-row flex-col">
                    <span>Nội dung phản hồi:</span>
                    <p className="detail-notes-text">"{feedback.comment}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Payment QR Modal */}
      <PaymentQRModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        qrCode={qrData.qrCode}
        checkoutUrl={qrData.checkoutUrl}
        amount={qrData.amount}
        bookingId={bookingId}
        onPaymentSuccess={(updatedBooking) => {
          setBooking(updatedBooking);
          setIsQrOpen(false);
        }}
      />

      {/* Customer Refund Modal */}
      {showRefundModal && (
        <div className="refund-modal-backdrop">
          <div className="refund-modal-content">
            <div className="refund-modal-header">
              <h2>Yêu cầu hủy & hoàn tiền</h2>
            </div>
            <form onSubmit={handleCustomerRefundSubmit}>
              <div className="refund-modal-body">
                <div className="refund-modal-field">
                  <label>Số tiền được hoàn trả</label>
                  <input
                    type="text"
                    value={formatCurrency(finalCost)}
                    readOnly
                  />
                </div>
                <div className="refund-modal-field">
                  <label>Nhập lý do hủy & Thông tin tài khoản nhận hoàn tiền *</label>
                  <textarea
                    placeholder="Ví dụ: Bận việc đột xuất. Xin hoàn tiền về số TK: 123456789 - Ngân hàng Vietcombank - Chủ TK: Nguyễn Văn A"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="refund-modal-footer">
                <button
                  type="button"
                  className="refund-modal-btn refund-modal-btn--cancel"
                  onClick={() => setShowRefundModal(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="refund-modal-btn refund-modal-btn--submit"
                  disabled={submitting}
                >
                  {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Owner Approve Refund Modal */}
      {showApproveModal && (
        <div className="refund-modal-backdrop">
          <div className="refund-modal-content">
            <div className="refund-modal-header">
              <h2>Xác nhận hoàn tiền</h2>
            </div>
            <form onSubmit={handleOwnerApproveSubmit}>
              <div className="refund-modal-body">
                <div className="refund-modal-field">
                  <label>Thông tin nhận tiền của khách hàng</label>
                  <textarea
                    value={refund?.reason}
                    readOnly
                    style={{ minHeight: "80px" }}
                  />
                </div>
                <div className="refund-modal-field">
                  <label>Số tiền cần chuyển khoản hoàn trả</label>
                  <input
                    type="text"
                    value={formatCurrency(refund?.amount)}
                    readOnly
                  />
                </div>
                <div className="refund-modal-field">
                  <label>Tải lên ảnh minh chứng giao dịch chuyển khoản *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                  {proofImageBase64 && (
                    <div className="img-preview-container">
                      <img src={proofImageBase64} alt="Preview" />
                    </div>
                  )}
                </div>
                <div className="refund-modal-field">
                  <label>Ghi chú hoàn tiền (nếu có)</label>
                  <textarea
                    placeholder="Nhập ghi chú hoặc thông báo cho khách hàng..."
                    value={ownerNotes}
                    onChange={(e) => setOwnerNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="refund-modal-footer">
                <button
                  type="button"
                  className="refund-modal-btn refund-modal-btn--cancel"
                  onClick={() => {
                    setShowApproveModal(false);
                    setProofImageBase64("");
                  }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="refund-modal-btn refund-modal-btn--submit"
                  disabled={submitting}
                >
                  {submitting ? "Đang xử lý..." : "Xác nhận hoàn thành"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Feedback Modal */}
      {showFeedbackModal && (
        <div className="refund-modal-backdrop">
          <div className="refund-modal-content">
            <div className="refund-modal-header">
              <h2>{isEditingFeedback ? "Chỉnh sửa Đánh giá" : "Đánh giá & Phản hồi dịch vụ"}</h2>
            </div>
            <form onSubmit={handleFeedbackSubmit}>
              <div className="refund-modal-body">
                <div className="refund-modal-field">
                  <label style={{ marginBottom: "12px", display: "block" }}>Chọn số sao đánh giá *</label>
                  <div style={{ display: "flex", gap: "10px", fontSize: "2rem", cursor: "pointer" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        style={{ color: star <= feedbackRating ? "#f59e0b" : "#d1d5db" }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <div className="refund-modal-field">
                  <label>Ý kiến đóng góp phản hồi (nếu có)</label>
                  <textarea
                    placeholder="Hãy chia sẻ trải nghiệm của bạn về dịch vụ phòng và F&B..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <div className="refund-modal-footer">
                <button
                  type="button"
                  className="refund-modal-btn refund-modal-btn--cancel"
                  onClick={() => setShowFeedbackModal(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="refund-modal-btn refund-modal-btn--submit"
                  style={{ backgroundColor: "#0f766e" }}
                  disabled={submitting}
                >
                  {submitting ? "Đang gửi..." : isEditingFeedback ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );

  if (isDashboardRole) {
    return renderDashboardWrapper(pageBody);
  }

  return (
    <>
      <Header />
      {pageBody}
    </>
  );
}

export default BookingDetailPage;
