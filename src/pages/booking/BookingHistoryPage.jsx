import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bookingAPI from "../../services/booking.service";
import authAPI from "../../services/auth.service";
import Header from "../../components/Header";
import "./BookingHistoryPage.css";

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function BookingHistoryPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all, pending, confirmed, refunded, completed, cancelled
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentUser, setCurrentUser] = useState(null);

  // Fetch bookings for the logged-in customer (or all if staff/admin/owner)
  useEffect(() => {
    const checkUserAndFetchBookings = async () => {
      try {
        setLoading(true);
        setError("");
        
        let userObj = null;
        const token = localStorage.getItem("token");
        if (token) {
          // Decode immediately
          const decoded = decodeToken(token);
          if (decoded && decoded.exp * 1000 > Date.now()) {
            userObj = {
              id: decoded.userId,
              email: decoded.email,
              role: decoded.role,
            };
            setCurrentUser(userObj);
          }

          // Verify with backend
          try {
            const verifyRes = await authAPI.verifyToken();
            if (verifyRes.data?.success) {
              userObj = verifyRes.data.data.user;
              setCurrentUser(userObj);
            } else {
              localStorage.removeItem("token");
              userObj = null;
              setCurrentUser(null);
            }
          } catch (verifyErr) {
            console.error("Token verification failed:", verifyErr);
            localStorage.removeItem("token");
            userObj = null;
            setCurrentUser(null);
          }
        }

        const params = {};
        if (userObj) {
          const roleName = (userObj.role?.name || userObj.role || "").toLowerCase();
          // If customer, only show their own bookings
          if (roleName === "customer") {
            params.customerId = userObj.id || userObj._id;
          }
        } else {
          // If not logged in, show no bookings
          setBookings([]);
          setLoading(false);
          return;
        }

        const res = await bookingAPI.getAllBookings(params);
        if (res.data?.success) {
          setBookings(res.data.data || []);
        } else {
          setBookings([]);
        }
      } catch (err) {
        console.error("Failed to load bookings", err);
        setError("Không thể tải danh sách lịch sử đặt phòng.");
      } finally {
        setLoading(false);
      }
    };

    checkUserAndFetchBookings();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "decimal", // Display clean numbers matching the reference image, or currency if preferred
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "PENDING";
      case "confirmed":
        return "CONFIRMED";
      case "completed":
        return "COMPLETED";
      case "cancelled":
        return "CANCELLED";
      case "refunded":
        return "REFUNDED";
      default:
        return status.toUpperCase();
    }
  };

  // Filter bookings based on search query and active tab
  const filteredBookings = bookings.filter((booking) => {
    // 1. Search filter: matches customer name, email, or phone
    const customer = booking.customerId || {};
    const fullName = customer.fullName || "";
    const email = customer.email || "";
    const phone = customer.phone || "";
    const matchesSearch =
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery);

    // 2. Tab filter
    let matchesTab = true;
    if (activeTab !== "all") {
      matchesTab = booking.status === activeTab;
    }

    return matchesSearch && matchesTab;
  });

  return (
    <>
      <Header />
      <main className="booking-page history-page">
        {/* 2. Main History Workspace */}
        <section className="booking-content history-content">
        <header className="history-header">
          <h1>Lịch sử đặt phòng{currentUser && ` - ${currentUser.fullName || currentUser.email}`}</h1>
        </header>

        <div className="history-table-container">
          {/* Top filter controls */}
          <div className="table-controls">
            {/* Search Input on the Left */}
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Tabs on the Right */}
            <div className="filter-tabs">
              <button
                className={`filter-tab-btn ${activeTab === "all" ? "filter-tab-btn--active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                Tất cả
              </button>
              <button
                className={`filter-tab-btn ${activeTab === "pending" ? "filter-tab-btn--active" : ""}`}
                onClick={() => setActiveTab("pending")}
              >
                Chờ xác nhận
              </button>
              <button
                className={`filter-tab-btn ${activeTab === "confirmed" ? "filter-tab-btn--active" : ""}`}
                onClick={() => setActiveTab("confirmed")}
              >
                Đã xác nhận
              </button>
              <button
                className={`filter-tab-btn ${activeTab === "refunded" ? "filter-tab-btn--active" : ""}`}
                onClick={() => setActiveTab("refunded")}
              >
                Đã hoàn tiền
              </button>
              <button
                className={`filter-tab-btn ${activeTab === "completed" ? "filter-tab-btn--active" : ""}`}
                onClick={() => setActiveTab("completed")}
              >
                Hoàn thành
              </button>
              <button
                className={`filter-tab-btn ${activeTab === "cancelled" ? "filter-tab-btn--active" : ""}`}
                onClick={() => setActiveTab("cancelled")}
              >
                Đã huỷ
              </button>
            </div>
          </div>

          {/* Bookings Table matching the image */}
          <div className="table-wrapper">
            {error && <div className="error-message-banner">{error}</div>}

            {loading ? (
              <div className="booking-state booking-state--loading">
                <div className="spinner"></div>
                <p>Đang tải danh sách đặt phòng...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="booking-state booking-state--empty">
                <div className="empty-box-icon">📜</div>
                <h3>Không tìm thấy đơn đặt nào</h3>
                <p>Không có dữ liệu phù hợp với điều kiện tìm kiếm hoặc bộ lọc của bạn.</p>
              </div>
            ) : (
              <table className="bookings-grid-table">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Ngày dịch vụ</th>
                    <th>Thời gian</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => {
                    const customerName = booking.customerId?.fullName || booking.customerId?.email || "Khách vãng lai";
                    const roomTotal = booking.roomTotal || 0;
                    const productTotal = booking.productTotal || 0;
                    const finalCost = booking.finalTotal || (roomTotal + productTotal - (booking.discountAmount || 0));

                    return (
                      <tr key={booking._id}>
                        <td>{customerName}</td>
                        <td>{formatDate(booking.bookingDate)}</td>
                        <td>{booking.startTime} - {booking.endTime}</td>
                        <td className="font-semibold">{formatCurrency(finalCost)}</td>
                        <td>
                          <span className={`status-badge-text status-badge-text--${booking.status}`}>
                            {getStatusText(booking.status)}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            className="detail-action-link-btn"
                            onClick={() => navigate(`/booking/${booking._id}`)}
                          >
                            Chi Tiết -{">"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </main>
    </>
  );
}

export default BookingHistoryPage;
