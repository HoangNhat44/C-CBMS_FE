import { useState, useEffect, useRef } from "react";
import bookingAPI from "../services/booking.service";
import "./PaymentQRModal.css";

function PaymentQRModal({
  isOpen,
  onClose,
  qrCode,
  checkoutUrl,
  amount,
  bookingId,
  onPaymentSuccess,
}) {
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const [paymentStatus, setPaymentStatus] = useState("waiting"); // waiting, success, expired
  const pollingIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Start polling and countdown when modal is opened
  useEffect(() => {
    if (!isOpen || !bookingId) return;

    setPaymentStatus("waiting");
    setTimeLeft(900);

    // 1. Countdown timer
    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          clearInterval(pollingIntervalRef.current);
          setPaymentStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 2. Booking status polling (every 3 seconds)
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await bookingAPI.getBookingById(bookingId);
        if (res.data?.success) {
          const booking = res.data.data;
          // Check if payment is successful
          if (booking.paymentStatus === "paid" || booking.status === "confirmed") {
            setPaymentStatus("success");
            clearInterval(pollingIntervalRef.current);
            clearInterval(countdownIntervalRef.current);
            
            // Auto close after 3 seconds on success
            setTimeout(() => {
              if (onPaymentSuccess) {
                onPaymentSuccess(booking);
              }
              onClose();
            }, 3000);
          }
        }
      } catch (err) {
        console.error("Error polling payment status:", err);
      }
    }, 3000);

    return () => {
      clearInterval(pollingIntervalRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, [isOpen, bookingId]);

  if (!isOpen) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCode)}`;

  return (
    <div className="payment-qr-overlay">
      <div className="payment-qr-modal animate-qr-scale-up">
        {/* Close Button */}
        <button className="qr-modal-close-btn" onClick={onClose} disabled={paymentStatus === "success"}>
          &times;
        </button>

        {paymentStatus === "success" ? (
          <div className="payment-qr-success-view">
            <div className="success-icon-badge">✓</div>
            <h2>Thanh toán thành công!</h2>
            <p>Đơn hàng #{bookingId.substring(bookingId.length - 8).toUpperCase()} đã được xác nhận thành công.</p>
            <span className="success-subtext">Đang cập nhật lại hóa đơn của bạn...</span>
          </div>
        ) : paymentStatus === "expired" ? (
          <div className="payment-qr-expired-view">
            <div className="expired-icon-badge">!</div>
            <h2>Mã thanh toán hết hạn</h2>
            <p>Thời gian giao dịch đã vượt quá 15 phút. Vui lòng tạo lại yêu cầu thanh toán mới.</p>
            <button className="qr-modal-action-btn" onClick={onClose}>
              Đóng cửa sổ
            </button>
          </div>
        ) : (
          <div className="payment-qr-main-view">
            <div className="qr-modal-header">
              <h3>Thanh toán qua VietQR</h3>
              <p>Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử bất kỳ</p>
            </div>

            {/* QR Code Frame */}
            <div className="qr-code-frame">
              <img src={qrImageUrl} alt="VietQR Code" className="qr-code-image" />
              <div className="qr-brand-tag">VietQR</div>
            </div>

            {/* Invoice Amount */}
            <div className="qr-amount-box">
              <span className="amount-label">Số tiền cần thanh toán:</span>
              <strong className="amount-value">{formatCurrency(amount)}</strong>
            </div>

            {/* Countdown timer */}
            <div className="qr-timer-box">
              <span className="timer-text">Mã QR hết hạn sau:</span>
              <strong className="timer-value">{formatTime(timeLeft)}</strong>
            </div>

            {/* Payment Details */}
            <div className="qr-payment-details">
              <div className="qr-detail-row">
                <span>Nội dung chuyển khoản:</span>
                <strong className="detail-copy-text">CBMS booking {bookingId.slice(-6)}</strong>
              </div>
              <p className="qr-warning-note">
                ⚠️ <strong>Lưu ý:</strong> Vui lòng quét đúng mã QR này để hệ thống tự động xác nhận đơn hàng của bạn ngay lập tức.
              </p>
            </div>

            {/* Backup Link */}
            <div className="qr-backup-link">
              <span>Không quét được?</span>
              <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                Thanh toán qua cổng PayOS &rarr;
              </a>
            </div>

            <div className="qr-status-indicator">
              <div className="status-spinner"></div>
              <span>Hệ thống đang chờ bạn quét mã và chuyển tiền...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentQRModal;
