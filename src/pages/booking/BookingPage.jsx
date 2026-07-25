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
import Header from "../../components/Header";
import "./BookingPage.css";

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

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

// Simple price abbreviation (e.g., 100000 -> 100k)
const abbreviatePrice = (value) => {
  if (value >= 1000) {
    return `${value / 1000}k`;
  }
  return value;
};

// Helper to extract valid image URL from room (array or string) or fallback to roomType image
const getRoomImageUrl = (room, roomType) => {
  if (room && room.image) {
    if (Array.isArray(room.image) && room.image.length > 0 && room.image[0]) {
      return room.image[0];
    }
    if (typeof room.image === "string" && room.image.trim() !== "") {
      return room.image;
    }
  }
  if (roomType && roomType.image) {
    if (Array.isArray(roomType.image) && roomType.image.length > 0 && roomType.image[0]) {
      return roomType.image[0];
    }
    if (typeof roomType.image === "string" && roomType.image.trim() !== "") {
      return roomType.image;
    }
  }
  return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=400";
};

// Helper to extract all images from room for gallery view
const getRoomImageGallery = (room, roomType) => {
  const images = [];
  if (room && room.image) {
    if (Array.isArray(room.image)) {
      room.image.forEach((img) => {
        if (img && typeof img === "string" && img.trim() !== "") images.push(img);
      });
    } else if (typeof room.image === "string" && room.image.trim() !== "") {
      images.push(room.image);
    }
  }
  if (images.length === 0 && roomType && roomType.image) {
    if (Array.isArray(roomType.image)) {
      roomType.image.forEach((img) => {
        if (img && typeof img === "string" && img.trim() !== "") images.push(img);
      });
    } else if (typeof roomType.image === "string" && roomType.image.trim() !== "") {
      images.push(roomType.image);
    }
  }
  if (images.length === 0) {
    images.push("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=400");
  }
  return images;
};

function BookingPage() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
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
  
  // Guest/Customer Selection & Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [guestForm, setGuestForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    note: "",
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");

  // QR Modal States
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrData, setQrData] = useState({ qrCode: "", checkoutUrl: "", amount: 0, bookingId: "" });

  // Room Detail Modal States
  const [isRoomDetailModalOpen, setIsRoomDetailModalOpen] = useState(false);
  const [selectedDetailRoom, setSelectedDetailRoom] = useState(null);

  const handleOpenRoomDetail = (roomType, room) => {
    const activeBranch = branches.find((b) => b._id === selectedBranchId);
    setSelectedDetailRoom({
      roomType,
      room,
      branchName: activeBranch ? activeBranch.name : "Cinema Cafe",
      branchAddress: activeBranch ? activeBranch.address : "",
    });
    setIsRoomDetailModalOpen(true);
  };

  // Promotion States
  const [promotions, setPromotions] = useState([]);
  const [selectedPromotions, setSelectedPromotions] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  // Load initial branch data and verify token
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const branchRes = await branchAPI.getAllBranches();
        const branchList = branchRes.data?.data || [];
        setBranches(branchList);
        if (branchList.length > 0) {
          setSelectedBranchId(branchList[0]._id);
        }

        const token = localStorage.getItem("token");
        if (token) {
          // Decode immediately for fast UI feedback
          const decoded = decodeToken(token);
          if (decoded && decoded.exp * 1000 > Date.now()) {
            setCurrentUser({
              id: decoded.userId,
              email: decoded.email,
              role: decoded.role,
            });
          }

          // Verify with backend
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
      } catch (err) {
        setError(err.response?.data?.message || "Không thể tải thông tin chi nhánh.");
      }
    };
    loadInitialData();
  }, []);

  // Handle PayOS return URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("paymentStatus");
    const message = params.get("message");
    
    if (paymentStatus) {
      if (paymentStatus === "success") {
        alert("Thanh toán thành công! Đơn đặt phòng của bạn đã được xác nhận.");
      } else {
        alert(`Thanh toán thất bại hoặc đã hủy: ${decodeURIComponent(message || "")}`);
      }
      // Clean up URL parameters to keep address bar clean
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
        setError(err.response?.data?.message || "Không thể tải dữ liệu sơ đồ phòng và bảng giá.");
      } finally {
        setLoading(false);
      }
    };

    fetchLayoutAndProducts();
  }, [selectedBranchId, selectedDate]);

  // Socket.io integration for real-time updates
  useEffect(() => {
    const socket = io("http://localhost:5000", {
      transports: ["websocket", "polling"]
    });

    socket.on("connect", () => {
      console.log("Connected to Socket.io server");
    });

    const refreshLayout = async () => {
      if (!selectedBranchId) return;
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
      // Clicked on a different room: reset and select new room/slot
      setSelectedRoom({ roomId: room.roomId, roomName: room.roomName });
      setSelectedSlots([slot]);
    } else {
      // Same room or first selection
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
        
        // Check if already selected
        if (selectedPromotions.includes(promo._id)) {
          setPromoSuccess("Mã giảm giá này đã được áp dụng rồi.");
          return;
        }

        // Add to promotions list if not already there, so it renders on screen
        setPromotions((prev) => {
          const exists = prev.some((p) => p._id === promo._id);
          if (!exists) {
            return [promo, ...prev];
          }
          return prev;
        });

        // Select ONLY this single promotion
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

      const payload = {
        branchId: selectedBranchId,
        roomId: selectedRoom.roomId,
        slotIds: selectedSlots.map((s) => s.slotId),
        bookingDate: selectedDate,
        note: guestForm.note || `Đặt phòng cho ${currentUser ? currentUser.fullName : (guestForm.fullName || "Khách")}`,
        products: productsPayload,
        appliedPromotions: selectedPromotions,
        source: "online",
      };

      if (currentUser) {
        payload.customerId = currentUser.id || currentUser._id;
      } else {
        if (!guestForm.fullName || !guestForm.email || !guestForm.phone) {
          setBookingError("Vui lòng nhập đầy đủ thông tin cá nhân để đặt phòng.");
          setSubmitting(false);
          return;
        }
        payload.guestInfo = {
          fullName: guestForm.fullName,
          email: guestForm.email,
          phone: guestForm.phone,
        };
      }

      const res = await bookingAPI.createBooking(payload);

      if (res.data?.success) {
        const booking = res.data.data;
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
            
            // Clear checkout choices and close drawer
            setSelectedSlots([]);
            setSelectedRoom(null);
            setSelectedProducts({});
            setGuestForm({ fullName: "", email: "", phone: "", note: "" });
            setSelectedPromotions([]);
            setPromoCodeInput("");
            setPromoError("");
            setPromoSuccess("");
            
            // Refresh layout in background
            const layoutRes = await bookingAPI.getBookingLayout(selectedBranchId, selectedDate);
            setLayoutData(layoutRes.data?.data?.layout || []);
            
            setBookingMessage("");
            setIsCheckoutOpen(false);
            
            // Open the QR payment modal
            setIsQrOpen(true);
            return;
          }
        } catch (paymentErr) {
          console.error("Payment URL creation failed:", paymentErr);
          setBookingError("Đặt phòng thành công nhưng không thể tạo liên kết thanh toán. Vui lòng thanh toán trực tiếp.");
        }

        setSelectedSlots([]);
        setSelectedRoom(null);
        setSelectedProducts({});
        setGuestForm({ fullName: "", email: "", phone: "", note: "" });
        setSelectedPromotions([]);
        setPromoCodeInput("");
        setPromoError("");
        setPromoSuccess("");
        
        // Refresh layout
        const layoutRes = await bookingAPI.getBookingLayout(selectedBranchId, selectedDate);
        setLayoutData(layoutRes.data?.data?.layout || []);
        
        setTimeout(() => {
          setIsCheckoutOpen(false);
          setBookingMessage("");
        }, 3000);
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || "Đặt phòng thất bại. Vui lòng kiểm tra lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="booking-page">
        {/* 1. Sidebar - Branches */}
        <aside className="booking-sidebar">
          <nav className="booking-sidebar__nav">
            <span className="booking-sidebar__section-title">Chi nhánh</span>
            {branches.map((b) => (
              <button
                key={b._id}
                className={`booking-sidebar__btn ${
                  selectedBranchId === b._id ? "booking-sidebar__btn--active" : ""
                }`}
                type="button"
                onClick={() => setSelectedBranchId(b._id)}
              >
                <div className="booking-sidebar__btn-content">
                  <strong>{b.name}</strong>
                  <span>{b.address}</span>
                </div>
              </button>
            ))}
          </nav>
        </aside>

      {/* 2. Main Work Area */}
      <section className="booking-content">
        {/* Date Tabs Header */}
        <header className="booking-header">
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
        <div className="booking-workspace">
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
                            src={getRoomImageUrl(room, categoryObj.roomType)}
                            alt={room.roomName || categoryObj.roomType.name}
                          />
                          <span className="room-visual__badge">
                            Max {room.capacity || categoryObj.roomType.capacity} người
                          </span>
                        </div>

                        <div className="room-card__details">
                          <div className="room-card__header">
                            <h4 className="room-card__name">{room.roomName || categoryObj.roomType.name}</h4>
                            <button
                              type="button"
                              className="btn-room-detail"
                              onClick={() => handleOpenRoomDetail(categoryObj.roomType, room)}
                            >
                              👁 Xem chi tiết
                            </button>
                          </div>
                          
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
          <footer className="booking-footer-bar">
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
              Tiếp tục thanh toán
            </button>
          </footer>
        )}
      </section>

      {/* 3. Checkout Sliding Modal/Drawer */}
      {isCheckoutOpen && selectedSlots.length > 0 && selectedRoom && (
        <div className="checkout-overlay" onClick={() => setIsCheckoutOpen(false)}>
          <div className="checkout-drawer" onClick={(e) => e.stopPropagation()}>
            <header className="checkout-drawer__header">
              <h3>Xác nhận thông tin đặt phòng</h3>
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
                  <strong>Chi nhánh:</strong>{" "}
                  {branches.find((b) => b._id === selectedBranchId)?.name}
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

              {/* Guest / Logged-in Customer Details */}
              <div className="checkout-form-section">
                <h4>Khách hàng thanh toán</h4>

                {currentUser ? (
                  <div className="logged-in-user-card" style={{
                    background: "var(--bg-hover, #f8f9fa)",
                    border: "1px solid var(--border, #e9ecef)",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    marginBottom: "16px"
                  }}>
                    <p style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#495057" }}>
                      Đặt phòng dưới tài khoản thành viên:
                    </p>
                    <div style={{ fontWeight: "700", color: "var(--text-dark, #212529)", fontSize: "16px" }}>
                      {currentUser.fullName || "Khách thành viên"}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted, #6c757d)", marginTop: "2px" }}>
                      Email: {currentUser.email} | SĐT: {currentUser.phone || "Chưa cập nhật"}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--primary, #007bff)", fontWeight: "600", textTransform: "uppercase", marginTop: "6px" }}>
                      Vai trò: {currentUser.role?.name || currentUser.role || "customer"}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="input-group">
                      <label>Họ và tên khách</label>
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
                      <label>Email liên hệ</label>
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
                      <label>Số điện thoại</label>
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
                  </>
                )}

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

      {/* Room Detail Modal */}
      {isRoomDetailModalOpen && selectedDetailRoom && (
        <div className="room-detail-modal-overlay" onClick={() => setIsRoomDetailModalOpen(false)}>
          <div className="room-detail-modal" onClick={(e) => e.stopPropagation()}>
            <header className="room-detail-modal__header">
              <div className="modal-header-title">
                <h3>Chi Tiết Phòng</h3>
                <span className="room-subtitle">{selectedDetailRoom.room.roomName || selectedDetailRoom.roomType.name}</span>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsRoomDetailModalOpen(false)}
              >
                &times;
              </button>
            </header>

            <div className="room-detail-modal__body">
              {(() => {
                const gallery = getRoomImageGallery(selectedDetailRoom.room, selectedDetailRoom.roomType);
                const mainImage = gallery[0];
                return (
                  <div className="room-detail-modal__gallery-wrap">
                    <div className="room-detail-modal__visual">
                      <img
                        src={mainImage}
                        alt={selectedDetailRoom.room.roomName || selectedDetailRoom.roomType.name}
                      />
                      <span className="room-detail-badge">
                        👥 Sức chứa: Max {selectedDetailRoom.room.capacity || selectedDetailRoom.roomType.capacity} người
                      </span>
                    </div>
                    {gallery.length > 1 && (
                      <div className="room-gallery-thumbnails">
                        {gallery.map((imgUrl, imgIdx) => (
                          <img
                            key={imgIdx}
                            src={imgUrl}
                            alt={`Hình ảnh phòng ${imgIdx + 1}`}
                            className="gallery-thumb"
                            onClick={(e) => {
                              const mainImg = e.currentTarget.closest('.room-detail-modal__gallery-wrap').querySelector('.room-detail-modal__visual img');
                              if (mainImg) mainImg.src = imgUrl;
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="room-detail-modal__info">
                <div className="detail-item-group">
                  <div className="detail-item">
                    <span className="detail-label">Tên phòng:</span>
                    <strong className="detail-value highlight-value">
                      {selectedDetailRoom.room.roomName || selectedDetailRoom.roomType.name}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Hạng phòng (Loại phòng):</span>
                    <strong className="detail-value">{selectedDetailRoom.roomType.name}</strong>
                  </div>
                </div>

                {selectedDetailRoom.roomType.description && (
                  <div className="detail-item">
                    <span className="detail-label">Mô tả hạng phòng:</span>
                    <p className="detail-desc">{selectedDetailRoom.roomType.description}</p>
                  </div>
                )}

                <div className="detail-item">
                  <span className="detail-label">Sức chứa tối đa:</span>
                  <span className="detail-tag capacity-tag">
                    Max {selectedDetailRoom.room.capacity || selectedDetailRoom.roomType.capacity} người
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Cơ sở / Chi nhánh:</span>
                  <div className="branch-detail-box">
                    <strong>📍 {selectedDetailRoom.branchName}</strong>
                    <small>{selectedDetailRoom.branchAddress}</small>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Tiện ích trang bị sẵn:</span>
                  <div className="facilities-grid">
                    {(
                      (Array.isArray(selectedDetailRoom.room.facilities) && selectedDetailRoom.room.facilities.length > 0)
                        ? selectedDetailRoom.room.facilities
                        : (typeof selectedDetailRoom.room.facilities === "string" && selectedDetailRoom.room.facilities.trim() !== "")
                        ? selectedDetailRoom.room.facilities.split(",").map((f) => f.trim())
                        : [
                            "Màn chiếu HD 4K",
                            "Ghế Sofa cao cấp",
                            "Hệ thống âm thanh vòm Surround",
                            "Điều hòa 2 chiều",
                            "Wifi tốc độ cao",
                            "Không gian cách âm riêng tư"
                          ]
                    ).map((fac, idx) => (
                      <span key={idx} className="facility-chip">
                        ✨ {fac}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <footer className="room-detail-modal__footer">
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setIsRoomDetailModalOpen(false)}
              >
                Đóng
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
    </>
  );
}

export default BookingPage;
