import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import bookingAPI from "../../services/booking.service";
import paymentAPI from "../../services/payment.service";
import PaymentQRModal from "../../components/PaymentQRModal";
import Header from "../../components/Header";
import "./BookingDetailPage.css";

function BookingDetailPage() {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // QR Modal States
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrData, setQrData] = useState({ qrCode: "", checkoutUrl: "", amount: 0 });

  useEffect(() => {
    if (!bookingId) return;

    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await bookingAPI.getBookingById(bookingId);
        if (res.data?.success) {
          setBooking(res.data.data);
        } else {
          setError("Không tìm thấy thông tin chi tiết đặt phòng.");
        }
      } catch (err) {
        console.error("Failed to load booking details", err);
        setError("Lỗi khi tải thông tin chi tiết đặt phòng.");
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

  const handleCancelBooking = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn đặt phòng này?")) return;

    try {
      setSubmitting(true);
      const res = await bookingAPI.updateBookingStatus(bookingId, { status: "cancelled" });
      if (res.data?.success) {
        alert("Đã hủy đặt phòng thành công!");
        setBooking(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert("Hủy đặt phòng thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return { text: "CHỜ XỬ LÝ", className: "status-tag--pending" };
      case "confirmed":
        return { text: "ĐÃ XÁC NHẬN", className: "status-tag--confirmed" };
      case "completed":
        return { text: "HOÀN THÀNH", className: "status-tag--completed" };
      case "cancelled":
        return { text: "ĐÃ HỦY", className: "status-tag--cancelled" };
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

  if (loading) {
    return (
      <>
        <Header />
        <main className="booking-page detail-page">
          <section className="booking-content detail-content">
            <div className="booking-state booking-state--loading">
              <div className="spinner"></div>
              <p>Đang tải chi tiết đặt phòng...</p>
            </div>
          </section>
        </main>
      </>
    );
  }

  if (error || !booking) {
    return (
      <>
        <Header />
        <main className="booking-page detail-page">
          <section className="booking-content detail-content">
            <div className="booking-state booking-state--error">
              <p>{error || "Đơn hàng không tồn tại."}</p>
              <button className="back-btn" onClick={() => navigate("/bookinghistory")}>
                ← Quay lại lịch sử đặt phòng
              </button>
            </div>
          </section>
        </main>
      </>
    );
  }

  const statusObj = getStatusLabel(booking.status);
  const payStatusObj = getPaymentStatusLabel(booking.paymentStatus);
  const roomCost = booking.roomTotal || 0;
  const productCost = booking.productTotal || 0;
  const finalCost = booking.finalTotal || (roomCost + productCost - (booking.discountAmount || 0));

  return (
    <>
      <Header />
      <main className="booking-page detail-page">
        {/* 2. Detail Container */}
        <section className="booking-content detail-content">
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

            {/* Interactive Actions for Unpaid / Pending */}
            {booking.status === "pending" && (
              <div className="detail-actions-panel">
                {booking.paymentStatus === "unpaid" && (
                  <button
                    className="detail-action-btn detail-action-btn--pay"
                    onClick={handlePayNow}
                    disabled={submitting}
                  >
                    {submitting ? "Đang xử lý..." : "💳 Thanh toán ngay (VietQR)"}
                  </button>
                )}
                <button
                  className="detail-action-btn detail-action-btn--cancel"
                  onClick={handleCancelBooking}
                  disabled={submitting}
                >
                  {submitting ? "Đang xử lý..." : "🚫 Hủy đơn đặt phòng"}
                </button>
              </div>
            )}
          </div>
        </div>
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
    </main>
    </>
  );
}

export default BookingDetailPage;
