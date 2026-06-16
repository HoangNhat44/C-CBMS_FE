import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import branchAPI from "../../services/branch.service";
import bookingAPI from "../../services/booking.service";
import productAPI from "../../services/product.service";
import userAPI from "../../services/user.service";
import "./BookingPage.css";

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

function BookingPage() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [dates] = useState(generateDates());
  const [selectedDate, setSelectedDate] = useState(formatDateValue(generateDates()[0]));
  
  const [layoutData, setLayoutData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Checkout flow states
  const [selectedSlot, setSelectedSlot] = useState(null); // { roomId, roomName, slot }
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // Products/F&B selection
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({}); // { [productId]: quantity }
  
  // Guest/Customer Selection
  const [users, setUsers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [guestForm, setGuestForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    note: "",
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");

  // Load initial branches and users
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const branchRes = await branchAPI.getAllBranches();
        const branchList = branchRes.data?.data || [];
        setBranches(branchList);
        if (branchList.length > 0) {
          setSelectedBranchId(branchList[0]._id);
        }

        const userRes = await userAPI.getAllUsers();
        setUsers(userRes.data?.data || []);
      } catch (err) {
        setError("Không thể tải thông tin chi nhánh hoặc khách hàng.");
      }
    };
    loadInitialData();
  }, []);

  // Fetch products and layout data on branch/date change
  useEffect(() => {
    if (!selectedBranchId) return;

    const fetchLayoutAndProducts = async () => {
      try {
        setLoading(true);
        setError("");
        setSelectedSlot(null); // Clear selection

        // 1. Fetch layout
        const layoutRes = await bookingAPI.getBookingLayout(selectedBranchId, selectedDate);
        setLayoutData(layoutRes.data?.data?.layout || []);

        // 2. Fetch products
        const productsRes = await productAPI.getAllProducts(selectedBranchId);
        setProducts(productsRes.data?.data || []);
        setSelectedProducts({}); // Reset selected products
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

    if (
      selectedSlot &&
      selectedSlot.roomId === room.roomId &&
      selectedSlot.slot.slotId === slot.slotId
    ) {
      setSelectedSlot(null); // Deselect
    } else {
      setSelectedSlot({
        roomId: room.roomId,
        roomName: room.roomName,
        slot: slot,
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

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    try {
      setSubmitting(true);
      setBookingError("");
      setBookingMessage("");

      // Prepare request payload
      let customerId = selectedCustomerId;
      
      // If customer is not selected from DB list (guest checkout),
      // we can use a fallback default customer or create/register guest user first.
      // For this prototype, we'll require choosing or registering a user,
      // or if guest details are filled, we'll try to find or use the customer account.
      if (!customerId) {
        // Find existing customer by email, or create a guest user
        // For simplicity, let's use the first registered user or show error
        if (users.length > 0) {
          // Default to the first user if none is selected
          customerId = users[0]._id;
        } else {
          setBookingError("Vui lòng đăng ký tài khoản khách hàng trước.");
          setSubmitting(false);
          return;
        }
      }

      const productsPayload = Object.keys(selectedProducts).map((pId) => ({
        productId: pId,
        quantity: selectedProducts[pId],
      }));

      const payload = {
        customerId,
        branchId: selectedBranchId,
        roomId: selectedSlot.roomId,
        slotId: selectedSlot.slot.slotId,
        bookingDate: selectedDate,
        note: guestForm.note || `Đặt phòng cho ${guestForm.fullName || "Khách"}`,
        products: productsPayload,
        discountAmount: 0,
      };

      const res = await bookingAPI.createBooking(payload);

      if (res.data?.success) {
        setBookingMessage("Đặt phòng thành công! Hóa đơn đã được lưu.");
        setSelectedSlot(null);
        setSelectedProducts({});
        setGuestForm({ fullName: "", email: "", phone: "", note: "" });
        
        // Refresh layout
        const layoutRes = await bookingAPI.getBookingLayout(selectedBranchId, selectedDate);
        setLayoutData(layoutRes.data?.data?.layout || []);
        
        setTimeout(() => {
          setIsCheckoutOpen(false);
          setBookingMessage("");
        }, 2500);
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || "Đặt phòng thất bại. Vui lòng kiểm tra lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const roomTotal = selectedSlot ? selectedSlot.slot.price : 0;
  const productTotal = calculateProductTotal();
  const grandTotal = roomTotal + productTotal;

  return (
    <main className="booking-page">
      {/* 1. Sidebar - Branches */}
      <aside className="booking-sidebar">
        <div className="booking-sidebar__logo">
          <h2>Café & Cinema</h2>
          <p>Hệ thống đặt phòng phim tư nhân</p>
        </div>
        
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
                            src={
                              room.images?.[0] ||
                              "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=400"
                            }
                            alt={room.roomName}
                          />
                          <span className="room-visual__badge">
                            Max {room.capacity} người
                          </span>
                        </div>

                        <div className="room-card__details">
                          <h4 className="room-card__name">{room.roomName}</h4>
                          
                          <div className="slots-grid">
                            {room.slots.map((slot) => {
                              const isSlotSelected =
                                selectedSlot &&
                                selectedSlot.roomId === room.roomId &&
                                selectedSlot.slot.slotId === slot.slotId;
                              
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
        {selectedSlot && (
          <footer className="booking-footer-bar">
            <div className="booking-footer-bar__info">
              <span>Đang chọn:</span>
              <strong>
                {selectedSlot.roomName} ({selectedSlot.slot.startTime} - {selectedSlot.slot.endTime})
              </strong>
              <span className="booking-footer-bar__price-tag">
                {formatCurrency(selectedSlot.slot.price)}
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
      {isCheckoutOpen && selectedSlot && (
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
                  <strong>Phòng:</strong> {selectedSlot.roomName}
                </p>
                <p>
                  <strong>Khung giờ:</strong> {selectedSlot.slot.startTime} - {selectedSlot.slot.endTime}
                </p>
                <p>
                  <strong>Ngày đặt:</strong> {selectedDate}
                </p>
                <p className="summary-price">
                  <span>Tiền phòng:</span>
                  <strong>{formatCurrency(roomTotal)}</strong>
                </p>
              </div>

              {/* Guest Details */}
              <div className="checkout-form-section">
                <h4>Khách hàng thanh toán</h4>
                <div className="input-group">
                  <label>Chọn tài khoản thành viên (nếu có)</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                  >
                    <option value="">-- Khách vãng lai (Nhập thông tin bên dưới) --</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedCustomerId && (
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
    </main>
  );
}

export default BookingPage;
