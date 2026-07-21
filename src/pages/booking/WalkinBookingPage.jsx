import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import branchAPI from "../../services/branch.service";
import bookingAPI from "../../services/booking.service";
import productAPI from "../../services/product.service";
import paymentAPI from "../../services/payment.service";
import authAPI from "../../services/auth.service";
import promotionAPI from "../../services/promotion.service";
import PaymentQRModal from "../../components/PaymentQRModal";
import Sidebar from "../../components/Sidebar";
import { staffMenuItems } from "../dashboard/Staff";
import Topbar from "../../components/Topbar";
import "./BookingPage.css";
import "../dashboard/Dashboard.css";

const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const formatDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const abbreviatePrice = (value) => {
  if (value >= 1000) {
    return `${value / 1000}k`;
  }
  return value;
};



export default function WalkinBookingPage() {
  const navigate = useNavigate();
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [branchName, setBranchName] = useState("Chi nhánh của bạn");
  const [dates] = useState(generateDates());
  const [selectedDate, setSelectedDate] = useState(formatDateValue(generateDates()[0]));
  
  const [layoutData, setLayoutData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Checkout flow states
  const [selectedSlots, setSelectedSlots] = useState([]); // Array of slot objects
  const [selectedRoom, setSelectedRoom] = useState(null); // { roomId, roomName }
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // Products/F&B selection
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({}); // { [productId]: quantity }
  
  // Staff & Guest Selection & Auth State


  const [guestForm, setGuestForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    note: "",
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState("cash"); // 'cash' or 'vietqr'
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrData, setQrData] = useState({ qrCode: "", checkoutUrl: "", amount: 0, bookingId: "" });

  // Promotion States
  const [promotions, setPromotions] = useState([]);
  const [selectedPromotions, setSelectedPromotions] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");

    navigate("/login", { replace: true });
  };

  // Load initial branch data and verify token
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        // Verify token with backend
        try {
          const verifyRes = await authAPI.verifyToken();
          if (verifyRes.data?.success) {
            const userObj = verifyRes.data.data.user;
            // Valid token, state set not needed

            const bId = userObj.branchId?._id || userObj.branchId;
            if (bId) {
              setSelectedBranchId(bId.toString());
              try {
                const bRes = await branchAPI.getBranchById(bId);
                if (bRes.data?.success) {
                  setBranchName(bRes.data.data?.name || "Chi nhánh");
                } else {
                  setBranchName(bRes.data?.name || "Chi nhánh");
                }
              } catch (branchErr) {
                console.error("Failed to load branch details:", branchErr);
              }
            } else {
              setError("Tài khoản chưa được gán vào chi nhánh nào. Vui lòng liên hệ quản trị viên.");
            }
          } else {
            localStorage.removeItem("token");
            navigate("/login");
          }
        } catch (verifyErr) {
          console.error("Token verification failed:", verifyErr);
          localStorage.removeItem("token");
          navigate("/login");
        }
      } catch (err) {
        setError("Không thể tải thông tin chi nhánh.");
      }
    };
    loadInitialData();
  }, [navigate]);



  // Fetch products and layout data on branch/date change
  useEffect(() => {
    if (!selectedBranchId) return;

    const fetchLayoutAndProducts = async () => {
      try {
        setLoading(true);
        setError("");
        setSelectedSlots([]);
        setSelectedRoom(null);

        // 1. Fetch layout
        const layoutRes = await bookingAPI.getBookingLayout(selectedBranchId, selectedDate);
        setLayoutData(layoutRes.data?.data?.layout || []);

        // 2. Fetch products
        const productsRes = await productAPI.getAllProducts({ branchId: selectedBranchId });
        setProducts(productsRes.data?.data || []);
        setSelectedProducts({}); // Reset selected products

        // 3. Fetch promotions
        const promosRes = await promotionAPI.getAllPromotions(selectedBranchId);
        setPromotions(promosRes.data || promosRes.data?.data || []);
        setSelectedPromotions([]); // Reset selected promotions
        setPromoCodeInput("");
        setPromoError("");
        setPromoSuccess("");
      } catch (err) {
        setError("Không thể tải dữ liệu sơ đồ phòng và bảng giá.");
      } finally {
        setLoading(false);
      }
    };

    fetchLayoutAndProducts();
  }, [selectedBranchId, selectedDate]);

  // Socket.io integration for real-time updates
  useEffect(() => {
    if (!selectedBranchId) return;

    const socket = io("http://localhost:5000", {
      transports: ["websocket", "polling"]
    });

    const refreshLayout = async () => {
      try {
        const layoutRes = await bookingAPI.getBookingLayout(selectedBranchId, selectedDate);
        setLayoutData(layoutRes.data?.data?.layout || []);
      } catch (err) {
        console.error("Failed to update layout via socket", err);
      }
    };

    socket.on("booking:created", (data) => {
      const eventDate = new Date(data.bookingDate);
      const activeDate = new Date(selectedDate);
      
      const formatDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      if (
        data.branchId.toString() === selectedBranchId.toString() &&
        formatDate(eventDate) === formatDate(activeDate)
      ) {
        refreshLayout();
      }
    });

    socket.on("booking:updated", (data) => {
      const eventDate = new Date(data.bookingDate);
      const activeDate = new Date(selectedDate);
      
      const formatDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      if (
        data.branchId.toString() === selectedBranchId.toString() &&
        formatDate(eventDate) === formatDate(activeDate)
      ) {
        refreshLayout();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedBranchId, selectedDate]);

  const handleSlotClick = (room, slot) => {
    if (slot.isBooked) return;

    if (selectedRoom && selectedRoom.roomId !== room.roomId) {
      setSelectedRoom({ roomId: room.roomId, roomName: room.roomName });
      setSelectedSlots([slot]);
    } else {
      if (!selectedRoom) {
        setSelectedRoom({ roomId: room.roomId, roomName: room.roomName });
      }
      setSelectedSlots((prev) => {
        const isSelected = prev.some((s) => s.slotId === slot.slotId);
        if (isSelected) {
          const filtered = prev.filter((s) => s.slotId !== slot.slotId);
          if (filtered.length === 0) {
            setSelectedRoom(null);
          }
          return filtered;
        } else {
          return [...prev, slot];
        }
      });
    }
  };

  const handleProductQuantityChange = (productId, change) => {
    setSelectedProducts((prev) => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, currentQty + change);
      
      const updated = { ...prev };
      if (newQty === 0) {
        delete updated[productId];
      } else {
        updated[productId] = newQty;
      }
      return updated;
    });
  };

  const calculateProductTotal = () => {
    let total = 0;
    Object.keys(selectedProducts).forEach((pId) => {
      const product = products.find((p) => p._id === pId);
      if (product) {
        total += product.price * selectedProducts[pId];
      }
    });
    return total;
  };

  const roomTotal = selectedSlots.reduce((sum, s) => sum + s.price, 0);
  const productTotal = calculateProductTotal();

  // Recalculate discount whenever roomTotal, productTotal, or selectedPromotions change
  useEffect(() => {
    const originalPrice = roomTotal + productTotal;
    if (selectedPromotions.length === 0) {
      setDiscountAmount(0);
      setGrandTotal(originalPrice);
      return;
    }

    const calculateDiscount = async () => {
      try {
        const res = await promotionAPI.calculateDiscount(originalPrice, selectedPromotions);
        if (res.success && res.data) {
          setDiscountAmount(res.data.discountAmount);
          setGrandTotal(res.data.finalTotal);
        } else {
          setDiscountAmount(0);
          setGrandTotal(originalPrice);
        }
      } catch (err) {
        console.error("Failed to calculate discount:", err);
        setDiscountAmount(0);
        setGrandTotal(originalPrice);
      }
    };

    calculateDiscount();
  }, [roomTotal, productTotal, selectedPromotions]);

  const handleTogglePromotion = (promoId) => {
    setSelectedPromotions((prev) => {
      if (prev.includes(promoId)) {
        return [];
      } else {
        return [promoId];
      }
    });
  };

  const handleApplyPromoCode = async () => {
    setPromoError("");
    setPromoSuccess("");
    if (!promoCodeInput.trim()) {
      setPromoError("Vui lòng nhập mã giảm giá.");
      return;
    }

    try {
      const res = await promotionAPI.applyPromotion(promoCodeInput.trim(), selectedBranchId);
      if (res.success && res.data) {
        const promo = res.data;
        
        if (selectedPromotions.includes(promo._id)) {
          setPromoSuccess("Mã giảm giá này đã được áp dụng rồi.");
          return;
        }

        setPromotions((prev) => {
          const exists = prev.some((p) => p._id === promo._id);
          if (!exists) {
            return [promo, ...prev];
          }
          return prev;
        });

        setSelectedPromotions([promo._id]);
        setPromoSuccess(`Áp dụng mã ${promo.code} thành công!`);
        setPromoCodeInput("");
      } else {
        setPromoError(res.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn.");
      }
    } catch (err) {
      setPromoError(err.response?.data?.message || "Không thể áp dụng mã giảm giá. Vui lòng kiểm tra lại.");
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (selectedSlots.length === 0 || !selectedRoom) return;

    try {
      setSubmitting(true);
      setBookingError("");
      setBookingMessage("");

      const productsPayload = Object.keys(selectedProducts).map((pId) => ({
        productId: pId,
        quantity: selectedProducts[pId],
      }));

      if (!guestForm.fullName || !guestForm.email || !guestForm.phone) {
        setBookingError("Vui lòng nhập đầy đủ thông tin cá nhân khách hàng để đặt phòng.");
        setSubmitting(false);
        return;
      }

      const payload = {
        branchId: selectedBranchId,
        roomId: selectedRoom.roomId,
        slotIds: selectedSlots.map((s) => s.slotId),
        bookingDate: selectedDate,
        note: guestForm.note || `Đặt phòng tại quầy cho ${guestForm.fullName}`,
        products: productsPayload,
        appliedPromotions: selectedPromotions,
        guestInfo: {
          fullName: guestForm.fullName,
          email: guestForm.email,
          phone: guestForm.phone,
        }
      };

      const res = await bookingAPI.createBooking(payload);

      if (res.data?.success) {
        const booking = res.data.data;

        // Reset inputs
        const resetSelections = () => {
          setSelectedSlots([]);
          setSelectedRoom(null);
          setSelectedProducts({});
          setGuestForm({ fullName: "", email: "", phone: "", note: "" });
          setSelectedPromotions([]);
          setPromoCodeInput("");
          setPromoError("");
          setPromoSuccess("");
        };

        if (paymentMethod === "cash") {
          setBookingMessage("Đặt phòng thành công! Đang xác nhận thanh toán tiền mặt...");
          try {
            const payRes = await paymentAPI.processPayment(booking._id, grandTotal);
            if (payRes.data?.success) {
              setBookingMessage("Thanh toán tiền mặt thành công! Đang chuyển hướng về lịch sử...");
              resetSelections();
              setTimeout(() => {
                setIsCheckoutOpen(false);
                setBookingMessage("");
                navigate("/bookinghistory");
              }, 1500);
            } else {
              setBookingError(payRes.data?.message || "Lỗi khi ghi nhận thanh toán tiền mặt.");
            }
          } catch (payErr) {
            console.error("Cash payment processing failed:", payErr);
            setBookingError("Đặt phòng thành công nhưng không thể ghi nhận thanh toán tiền mặt.");
          }
        } else {
          setBookingMessage("Đặt phòng thành công! Đang khởi tạo mã thanh toán VietQR...");
          try {
            const paymentRes = await paymentAPI.createPaymentUrl(booking._id, "full");
            if (paymentRes.data?.success) {
              setQrData({
                qrCode: paymentRes.data.qrCode,
                checkoutUrl: paymentRes.data.checkoutUrl,
                amount: paymentRes.data.amount || grandTotal,
                bookingId: booking._id
              });
              
              resetSelections();
              
              const layoutRes = await bookingAPI.getBookingLayout(selectedBranchId, selectedDate);
              setLayoutData(layoutRes.data?.data?.layout || []);
              
              setBookingMessage("");
              setIsCheckoutOpen(false);
              setIsQrOpen(true);
            }
          } catch (paymentErr) {
            console.error("Payment URL creation failed:", paymentErr);
            setBookingError("Đặt phòng thành công nhưng không thể tạo liên kết thanh toán. Vui lòng thanh toán trực tiếp.");
          }
        }
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || "Đặt phòng thất bại. Vui lòng kiểm tra lại.");
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="dash dash--staff">
      <Sidebar 
        menuItems={staffMenuItems} 
        active="walkin" 
        setActive={(key) => {
          if (key === "category") {
            navigate("/categories");
            return;
          }
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
            return;
          }
          navigate("/staff-dashboard");
        }} 
        handleLogout={handleLogout} 
        onLogoClick={() => navigate("/staff-dashboard")}
      />

      <div className="main">
        <Topbar breadcrumbs={[{ label: "Trang chủ", link: "/staff-dashboard" }, { label: "Đặt phòng tại quầy" }]} />

        {/* Content Area */}
        <div className="content" style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          <main className="booking-page" style={{ padding: 0, minHeight: "auto", background: "none", height: "100%", width: "100%" }}>
            <section className="booking-content" style={{ maxWidth: "100%", padding: 0, boxShadow: "none", background: "none", height: "auto", overflow: "visible" }}>
              
              {/* Branch locked notice */}
              <div style={{
                background: "var(--primary-light, #e0e7ff)",
                border: "1px solid var(--primary, #4f46e5)",
                borderRadius: "12px",
                padding: "16px 20px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <span style={{ fontSize: "24px" }}>🏢</span>
                <div>
                  <h4 style={{ margin: 0, color: "#1e1b4b", fontWeight: "700" }}>Chi nhánh trực thuộc</h4>
                  <p style={{ margin: "2px 0 0 0", color: "#312e81", fontSize: "14px" }}>
                    Bạn đang thực hiện đặt phòng tại quầy cho chi nhánh: <strong>{branchName}</strong>
                  </p>
                </div>
              </div>

              {/* Date Tabs Header */}
              <header className="booking-header" style={{ padding: "16px 0", borderBottom: "1px solid var(--neutral-200)", background: "none" }}>
                <div className="booking-dates">
                  {dates.map((dateObj, idx) => {
                    const dateVal = formatDateValue(dateObj);
                    const isSelected = selectedDate === dateVal;
                    return (
                      <button
                        key={idx}
                        className={`date-tab ${isSelected ? "date-tab--active" : ""}`}
                        type="button"
                        onClick={() => setSelectedDate(dateVal)}
                      >
                        <span className="date-tab__day">Thứ {dateObj.getDay() === 0 ? "CN" : dateObj.getDay() + 1}</span>
                        <strong className="date-tab__date">{formatDateLabel(dateObj)}</strong>
                      </button>
                    );
                  })}
                </div>
              </header>

              {/* Room / Slot Grid View */}
              <div className="booking-workspace" style={{ padding: "20px 0" }}>
                {loading ? (
                  <div className="booking-state booking-state--loading">
                    <div className="spinner"></div>
                    <p>Đang tải sơ đồ phòng...</p>
                  </div>
                ) : error ? (
                  <div className="booking-state booking-state--error">
                    <p>{error}</p>
                  </div>
                ) : layoutData.length === 0 ? (
                  <div className="booking-state booking-state--empty">
                    <p>Chi nhánh hiện chưa có phòng nào sẵn sàng phục vụ.</p>
                  </div>
                ) : (
                  <div className="layout-sections">
                    {layoutData.map((categoryObj) => (
                      <div key={categoryObj.roomType.id} className="category-section">
                        <h3 className="category-title">
                          Hạng phòng: {categoryObj.roomType.name}
                          <span>({categoryObj.roomType.description})</span>
                        </h3>

                        <div className="rooms-container">
                          {categoryObj.rooms.map((room) => (
                            <div key={room.roomId} className="room-card">
                              <div className="room-card__visual">
                                <img
                                  src={
                                    categoryObj.roomType.image ||
                                    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=400"
                                  }
                                  alt={categoryObj.roomType.name}
                                />
                                <span className="room-visual__badge">
                                  Max {categoryObj.roomType.capacity} người
                                </span>
                              </div>

                              <div className="room-card__details">
                                <h4 className="room-card__name">{categoryObj.roomType.name}</h4>
                                
                                <div className="slots-grid">
                                  {room.slots.map((slot) => {
                                    const isSlotSelected =
                                      selectedRoom &&
                                      selectedRoom.roomId === room.roomId &&
                                      selectedSlots.some((s) => s.slotId === slot.slotId);
                                    
                                    return (
                                      <button
                                        key={slot.slotId}
                                        className={`slot-box ${
                                          slot.isBooked
                                            ? "slot-box--booked"
                                            : isSlotSelected
                                            ? "slot-box--selected"
                                            : ""
                                        }`}
                                        type="button"
                                        onClick={() => handleSlotClick(room, slot)}
                                        disabled={slot.isBooked}
                                      >
                                        <span className="slot-box__time">
                                          {slot.startTime} - {slot.endTime}
                                          {slot.timeType === "golden" && (
                                            <span className="golden-badge" title="Giờ vàng (+50k Phụ thu)">🔥 Giờ vàng</span>
                                          )}
                                        </span>
                                        <strong className="slot-box__price">
                                          {slot.isBooked ? "Đã đặt" : abbreviatePrice(slot.price)}
                                        </strong>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Actions Bar */}
              {selectedSlots.length > 0 && selectedRoom && (
                <footer className="booking-footer-bar" style={{ position: "sticky", bottom: 0, left: 0, right: 0, margin: "0 -24px", padding: "16px 24px", zIndex: 100 }}>
                  <div className="booking-footer-bar__info">
                    <span>Đang chọn:</span>
                    <strong>
                      {selectedRoom.roomName} ({[...selectedSlots].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(s => s.name || `${s.startTime}-${s.endTime}`).join(", ")})
                    </strong>
                    <span className="booking-footer-bar__price-tag">
                      {formatCurrency(roomTotal)}
                    </span>
                  </div>
                  <button
                    className="booking-footer-bar__checkout-btn"
                    type="button"
                    onClick={() => setIsCheckoutOpen(true)}
                  >
                    Tiếp tục thanh toán tại quầy
                  </button>
                </footer>
              )}
            </section>

            {/* Checkout Sliding Modal/Drawer */}
            {isCheckoutOpen && selectedSlots.length > 0 && selectedRoom && (
              <div className="checkout-overlay" onClick={() => setIsCheckoutOpen(false)}>
                <div className="checkout-drawer" onClick={(e) => e.stopPropagation()}>
                  <header className="checkout-drawer__header">
                    <h3>Xác nhận thông tin đặt phòng tại quầy</h3>
                    <button
                      className="close-btn"
                      type="button"
                      onClick={() => setIsCheckoutOpen(false)}
                    >
                      &times;
                    </button>
                  </header>

                  <form className="checkout-drawer__body" onSubmit={handleCheckoutSubmit}>
                    {/* Selected Booking Info */}
                    <div className="checkout-summary-card">
                      <h4>Thông tin phòng chọn</h4>
                      <p>
                        <strong>Chi nhánh:</strong> {branchName}
                      </p>
                      <p>
                        <strong>Phòng:</strong> {selectedRoom.roomName}
                      </p>
                      <p>
                        <strong>Khung giờ:</strong> {[...selectedSlots].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(s => s.name || `${s.startTime}-${s.endTime}`).join("; ")}
                      </p>
                      <p>
                        <strong>Ngày đặt:</strong> {selectedDate}
                      </p>
                      <p className="summary-price">
                        <span>Tiền phòng:</span>
                        <strong>{formatCurrency(roomTotal)}</strong>
                      </p>
                    </div>

                    {/* Guest / Customer Details */}
                    <div className="checkout-form-section">
                      <h4>Thông tin khách hàng đặt chỗ</h4>

                      <div className="input-group">
                        <label>Họ và tên khách *</label>
                        <input
                          type="text"
                          value={guestForm.fullName}
                          onChange={(e) =>
                            setGuestForm((prev) => ({ ...prev, fullName: e.target.value }))
                          }
                          placeholder="Nguyen Van A"
                          required
                        />
                      </div>

                      <div className="input-group">
                        <label>Email liên hệ *</label>
                        <input
                          type="email"
                          value={guestForm.email}
                          onChange={(e) =>
                            setGuestForm((prev) => ({ ...prev, email: e.target.value }))
                          }
                          placeholder="guest@example.com"
                          required
                        />
                      </div>

                      <div className="input-group">
                        <label>Số điện thoại *</label>
                        <input
                          type="tel"
                          value={guestForm.phone}
                          onChange={(e) =>
                            setGuestForm((prev) => ({ ...prev, phone: e.target.value }))
                          }
                          placeholder="0901234567"
                          required
                        />
                      </div>

                      <div className="input-group">
                        <label>Ghi chú</label>
                        <textarea
                          value={guestForm.note}
                          onChange={(e) =>
                            setGuestForm((prev) => ({ ...prev, note: e.target.value }))
                          }
                          placeholder="Yêu cầu thêm (nếu có)..."
                        />
                      </div>
                    </div>

                    {/* F&B Products Selection */}
                    <div className="checkout-form-section">
                      <h4>Đồ ăn & Nước uống đi kèm</h4>
                      {products.length === 0 ? (
                        <p className="no-products">Không có dịch vụ F&B tại chi nhánh này.</p>
                      ) : (
                        <div className="product-selection-list">
                          {products.map((prod) => {
                            const qty = selectedProducts[prod._id] || 0;
                            return (
                              <div key={prod._id} className="product-item-row">
                                <div className="product-item-row__info">
                                  <h5>{prod.name}</h5>
                                  <span>{formatCurrency(prod.price)}</span>
                                </div>
                                
                                <div className="product-item-row__actions">
                                  <button
                                    type="button"
                                    className="qty-btn"
                                    onClick={() => handleProductQuantityChange(prod._id, -1)}
                                  >
                                    -
                                  </button>
                                  <span className="qty-val">{qty}</span>
                                  <button
                                    type="button"
                                    className="qty-btn"
                                    onClick={() => handleProductQuantityChange(prod._id, 1)}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Promotion / Voucher Section */}
                    <div className="checkout-form-section promo-form-section">
                      <h4>Khuyến mãi & Mã giảm giá</h4>
                      
                      {/* Manual input */}
                      <div className="input-group promo-input-group">
                        <label>Nhập mã giảm giá</label>
                        <div className="promo-input-row">
                          <input
                            type="text"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value)}
                            placeholder="Ví dụ: CBMS20"
                          />
                          <button
                            type="button"
                            onClick={handleApplyPromoCode}
                            className="promo-apply-btn"
                          >
                            Áp dụng
                          </button>
                        </div>
                        {promoError && <p className="promo-error">{promoError}</p>}
                        {promoSuccess && <p className="promo-success">{promoSuccess}</p>}
                      </div>

                      {/* Available promotions list */}
                      <div className="promo-list-section">
                        <h5>Ưu đãi đang có:</h5>
                        {(() => {
                          const visiblePromos = promotions.filter((promo) => {
                            const isSelected = selectedPromotions.includes(promo._id);
                            
                            const now = new Date();
                            const hasStarted = !promo.startDate || now >= new Date(promo.startDate);
                            const hasNotExpired = !promo.endDate || now <= new Date(promo.endDate);
                            const hasUsageLeft = promo.maxUsage === null || promo.maxUsage === undefined || promo.usedCount < promo.maxUsage;
                            const isPromoValid = promo.isActive && hasStarted && hasNotExpired && hasUsageLeft;

                            const isVisibleVoucher = !promo.code && isPromoValid;
                            return isSelected || isVisibleVoucher;
                          });

                          if (visiblePromos.length === 0) {
                            return <p style={{ fontSize: '12px', color: '#6c757d', margin: 0, textAlign: 'left' }}>Không có chương trình ưu đãi nào tại chi nhánh này.</p>;
                          }

                          return (
                            <div className="promo-grid">
                              {visiblePromos.map((promo) => {
                                const isSelected = selectedPromotions.includes(promo._id);
                                return (
                                  <div
                                    key={promo._id}
                                    className={`promo-card-item ${isSelected ? 'promo-card-item--selected' : ''}`}
                                    onClick={() => handleTogglePromotion(promo._id)}
                                  >
                                    <div className="promo-card-item__info">
                                      <span className="promo-code">
                                        🏷️ {promo.title || "Ưu đãi tự động"} {promo.code ? `(${promo.code})` : ""}
                                      </span>
                                      <span className="promo-desc">
                                        {promo.description || `Giảm ${promo.discountType === 'percent' ? `${promo.discountValue}%` : formatCurrency(promo.discountValue)}`}
                                      </span>
                                      {promo.maxUsage !== null && (
                                        <span className="promo-usage" style={{ color: '#9ca3af', fontSize: '11px' }}>
                                          Đã dùng: {promo.usedCount}/{promo.maxUsage}
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      className={`promo-select-btn ${isSelected ? 'promo-select-btn--remove' : ''}`}
                                    >
                                      {isSelected ? 'Bỏ chọn' : 'Chọn dùng'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="checkout-form-section">
                      <h4>Phương thức thanh toán</h4>
                      <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                        <label style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "12px",
                          border: `1px solid ${paymentMethod === "cash" ? "var(--primary)" : "var(--neutral-200)"}`,
                          background: paymentMethod === "cash" ? "var(--primary-light)" : "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "700",
                          fontSize: "14px",
                          color: "var(--neutral-900)"
                        }}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash"
                            checked={paymentMethod === "cash"}
                            onChange={() => setPaymentMethod("cash")}
                            style={{ accentColor: "var(--primary)" }}
                          />
                          💵 Tiền mặt
                        </label>
                        <label style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "12px",
                          border: `1px solid ${paymentMethod === "vietqr" ? "var(--primary)" : "var(--neutral-200)"}`,
                          background: paymentMethod === "vietqr" ? "var(--primary-light)" : "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "700",
                          fontSize: "14px",
                          color: "var(--neutral-900)"
                        }}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="vietqr"
                            checked={paymentMethod === "vietqr"}
                            onChange={() => setPaymentMethod("vietqr")}
                            style={{ accentColor: "var(--primary)" }}
                          />
                          📳 Chuyển khoản VietQR
                        </label>
                      </div>
                    </div>

                    {/* Booking Invoice Breakdowns */}
                    <div className="checkout-invoice-card">
                      <div className="invoice-row">
                        <span>Tiền phòng:</span>
                        <span>{formatCurrency(roomTotal)}</span>
                      </div>
                      <div className="invoice-row">
                        <span>Tiền đồ ăn & uống:</span>
                        <span>{formatCurrency(productTotal)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="invoice-row" style={{ color: '#ef4444' }}>
                          <span>Giảm giá (Khuyến mãi):</span>
                          <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      <div className="invoice-row invoice-row--total">
                        <span>Tổng tiền thanh toán:</span>
                        <strong>{formatCurrency(grandTotal)}</strong>
                      </div>
                    </div>

                    {bookingError && <p className="error-message">{bookingError}</p>}
                    {bookingMessage && <p className="success-message">{bookingMessage}</p>}

                    <button
                      className="checkout-submit-btn"
                      type="submit"
                      disabled={submitting}
                    >
                      {submitting ? "Đang xử lý..." : "Xác nhận đặt & Thanh toán"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Payment QR Modal */}
            <PaymentQRModal
              isOpen={isQrOpen}
              onClose={() => setIsQrOpen(false)}
              qrCode={qrData.qrCode}
              checkoutUrl={qrData.checkoutUrl}
              amount={qrData.amount}
              bookingId={qrData.bookingId}
              onPaymentSuccess={() => {
                setIsQrOpen(false);
                navigate("/bookinghistory");
              }}
            />
          </main>
        </div>
      </div>

    </div>
  );
}
