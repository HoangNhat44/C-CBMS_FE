import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import "./Dashboard.css";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import PromotionList from "../promotion/PromotionList";
import userAPI from "../../services/user.service";
import bookingAPI from "../../services/booking.service";
import feedbackAPI from "../../services/feedback.service";
import promotionAPI from "../../services/promotion.service";
import branchAPI from "../../services/branch.service";
import { useAuth } from "../../context/AuthContext";
import AddUserModal from "../account/AddUserModal";

export const ownerMenuItems = [
  {
    section: "Tổng quan",
    items: [{ icon: "ti-chart-bar", label: "Doanh thu", badge: "Mới", key: "revenue", requiredPermission: "VIEW_REVENUE" }],
  },
  {
    section: "Đặt phòng",
    items: [
      { icon: "ti-calendar-plus", label: "Đặt phòng tại quầy", key: "walkin", badge: "Nhanh" },
      { icon: "ti-calendar-event", label: "Lịch sử đặt phòng", key: "bookinghistory", requiredPermission: "VIEW_BOOKING_HISTORY" }
    ],
  },
  {
    section: "Cơ sở vật chất",
    items: [
      { icon: "ti-building", label: "Quản lý cơ sở", key: "facility" },
      { icon: "ti-layout-grid", label: "Quản lý loại phòng", key: "roomtype", child: true },
      { icon: "ti-door", label: "Quản lý phòng", key: "room", child: true },
      { icon: "ti-clock", label: "Quản lý slot", key: "slot" },
      { icon: "ti-coin", label: "Quản lý giá phòng", key: "roomprice" },
    ],
  },
  {
    section: "Khách hàng",
    items: [{ icon: "ti-star", label: "Đánh giá khách hàng", key: "review" }],
  },
  {
    section: "Marketing",
    items: [
      { icon: "ti-ticket", label: "Quản lý khuyến mãi", key: "promotion", requiredPermission: "VIEW_PROMOTION" },
      { icon: "ti-news", label: "Quản lý tin tức", key: "news" },
    ],
  },
  {
    section: "Danh mục & sản phẩm",
    items: [
      { icon: "ti-category", label: "Quản lý danh mục", key: "category" },
      { icon: "ti-package", label: "Quản lý sản phẩm", key: "product" },
    ],
  },
  {
    section: "Hệ thống",
    items: [{ icon: "ti-user-plus", label: "Thêm người dùng", key: "adduser" }],
  },
];

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

const formatVND = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);

export default function OwnerDashboard() {
  const { hasPermission } = useAuth();
  const [active, setActive] = useState("revenue");
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [allBookings, setAllBookings] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [feedbacksList, setFeedbacksList] = useState([]);
  const [promotionsList, setPromotionsList] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);

  // Time Range Filter for Revenue ("month" | "today" | "all")
  const [timeFilter, setTimeFilter] = useState("month");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.activeTab) {
      if (location.state.activeTab === "adduser") {
        setShowAddUser(true);
      } else {
        setActive(location.state.activeTab);
      }
    }
  }, [location.state]);

  useEffect(() => {
    localStorage.setItem("current_dashboard", "owner");
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        // Valid token logic
      } else {
        localStorage.removeItem("token");
      }
    }

    const fetchCustomers = async () => {
      try {
        const uRes = await userAPI.getAllUsers();
        if (uRes.data?.success) {
          const list = uRes.data.data;
          const customers = list.filter(u => !u.roleId || (u.roleId.name !== "Admin" && u.roleId.name !== "Staff" && u.roleId.name !== "Owner"));
          setTotalCustomers(customers.length);
        }
      } catch (err) {
        console.error("Fetch customers failed", err);
      }
    };

    const fetchRevenueAndBranches = async () => {
      try {
        const [bRes, brRes] = await Promise.all([
          bookingAPI.getAllBookings(),
          branchAPI.getAllBranches()
        ]);

        if (brRes.data?.success) {
          setBranchesList(brRes.data.data || []);
        }

        if (bRes.data?.success) {
          setAllBookings(bRes.data.data || []);
        }
      } catch (err) {
        console.error("Fetch revenue failed", err);
      }
    };

    const fetchFeedbacks = async () => {
      try {
        const fRes = await feedbackAPI.getAllFeedbacks();
        if (fRes.data?.success) {
          const feedbacks = fRes.data.data || [];
          setFeedbacksList(feedbacks);
          if (feedbacks.length > 0) {
            const sum = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
            setAverageRating((sum / feedbacks.length).toFixed(1));
          } else {
            setAverageRating(0);
          }
        }
      } catch (err) {
        console.error("Fetch feedbacks failed", err);
      }
    };

    const fetchPromotions = async () => {
      try {
        const pRes = await promotionAPI.getAllPromotions();
        if (pRes.success) {
          setPromotionsList(pRes.data || []);
        }
      } catch (err) {
        console.error("Fetch promotions failed", err);
      }
    };

    fetchCustomers();
    fetchRevenueAndBranches();
    fetchFeedbacks();
    fetchPromotions();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  // Filter Bookings by Selected Time Filter
  const filteredBookings = useMemo(() => {
    const today = new Date();
    return allBookings.filter((b) => {
      if (b.status !== "completed" && b.status !== "confirmed") return false;
      const bDate = new Date(b.bookingDate || b.createdAt);

      if (timeFilter === "today") {
        return (
          today.getFullYear() === bDate.getFullYear() &&
          today.getMonth() === bDate.getMonth() &&
          today.getDate() === bDate.getDate()
        );
      }
      if (timeFilter === "month") {
        return (
          today.getFullYear() === bDate.getFullYear() &&
          today.getMonth() === bDate.getMonth()
        );
      }
      return true; // "all"
    });
  }, [allBookings, timeFilter]);

  // Aggregate Stats
  const { grandTotal, roomTotalSum, productTotalSum, branchRevenueMap, topBookings } = useMemo(() => {
    let grandTotal = 0;
    let roomTotalSum = 0;
    let productTotalSum = 0;
    const branchRevenueMap = {};

    filteredBookings.forEach((b) => {
      const amount = b.finalTotal || b.totalAmount || 0;
      grandTotal += amount;

      const roomPart = b.roomTotal || b.roomPriceSnapshots?.reduce((acc, p) => acc + (p.price || 0), 0) || amount;
      const prodPart = b.productTotal || (amount - roomPart > 0 ? amount - roomPart : 0);

      roomTotalSum += roomPart;
      productTotalSum += prodPart;

      const bId = typeof b.branchId === "object" ? b.branchId?._id : b.branchId;
      if (bId) {
        if (!branchRevenueMap[bId]) {
          branchRevenueMap[bId] = { amount: 0, count: 0, name: b.branchId?.name || "Chi nhánh" };
        }
        branchRevenueMap[bId].amount += amount;
        branchRevenueMap[bId].count += 1;
      }
    });

    const topBookings = [...filteredBookings]
      .sort((a, b) => (b.finalTotal || b.totalAmount || 0) - (a.finalTotal || a.totalAmount || 0))
      .slice(0, 5);

    return { grandTotal, roomTotalSum, productTotalSum, branchRevenueMap, topBookings };
  }, [filteredBookings]);

  // Format Branch List with Percentage Share
  const branchRevenueList = useMemo(() => {
    return branchesList.map((br) => {
      const data = branchRevenueMap[br._id] || { amount: 0, count: 0, name: br.name };
      const percentage = grandTotal > 0 ? ((data.amount / grandTotal) * 100).toFixed(1) : 0;
      return {
        id: br._id,
        name: br.name,
        address: br.address,
        amount: data.amount,
        count: data.count,
        percentage: parseFloat(percentage),
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [branchesList, branchRevenueMap, grandTotal]);

  return (
    <div className="dash">
      {/* ── SIDEBAR ── */}
      <Sidebar
        menuItems={ownerMenuItems}
        active={active}
        setActive={(key) => {
          if (key === "adduser") {
            setShowAddUser(true);
            return;
          }
          setActive(key);
        }}
        handleLogout={handleLogout}
        onLogoClick={() => navigate("/owner-dashboard")}
      />

      {/* ── MAIN ── */}
      <div className="main">
        <Topbar breadcrumbs={[{ label: "Trang chủ", link: "/owner-dashboard" }, { label: "Doanh thu trực quan" }]} />

        {/* Content */}
        <div className="content">
          {active === "promotion" ? (
            hasPermission("VIEW_PROMOTION") ? (
              <PromotionList />
            ) : (
              <Navigate to="/access-denied" replace />
            )
          ) : active === "revenue" ? (
            hasPermission("VIEW_REVENUE") ? (
              <>
                {/* ── HEADER & TIME FILTER BAR ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h1 className="pg-title" style={{ margin: 0 }}>Báo cáo Doanh thu Trực quan</h1>
                    <p className="pg-sub" style={{ margin: "4px 0 0 0" }}>Phân tích kết quả kinh doanh toàn bộ chuỗi cơ sở Cinema Cafe</p>
                  </div>

                  {/* Time Range Filter Buttons */}
                  <div style={{ display: "flex", gap: "8px", background: "#ffffff", padding: "6px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <button
                      style={{
                        padding: "6px 16px",
                        borderRadius: "8px",
                        border: "none",
                        fontWeight: 700,
                        cursor: "pointer",
                        background: timeFilter === "today" ? "#0f766e" : "transparent",
                        color: timeFilter === "today" ? "#ffffff" : "#64748b",
                        transition: "all 0.2s"
                      }}
                      onClick={() => setTimeFilter("today")}
                    >
                      Hôm nay
                    </button>
                    <button
                      style={{
                        padding: "6px 16px",
                        borderRadius: "8px",
                        border: "none",
                        fontWeight: 700,
                        cursor: "pointer",
                        background: timeFilter === "month" ? "#0f766e" : "transparent",
                        color: timeFilter === "month" ? "#ffffff" : "#64748b",
                        transition: "all 0.2s"
                      }}
                      onClick={() => setTimeFilter("month")}
                    >
                      Tháng này
                    </button>
                    <button
                      style={{
                        padding: "6px 16px",
                        borderRadius: "8px",
                        border: "none",
                        fontWeight: 700,
                        cursor: "pointer",
                        background: timeFilter === "all" ? "#0f766e" : "transparent",
                        color: timeFilter === "all" ? "#ffffff" : "#64748b",
                        transition: "all 0.2s"
                      }}
                      onClick={() => setTimeFilter("all")}
                    >
                      Tất cả thời gian
                    </button>
                  </div>
                </div>

                {/* ── METRICS OVERVIEW (4 KEY CARDS) ── */}
                <div className="metrics" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: "24px" }}>
                  <div className="metric">
                    <div className="metric-accent" style={{ background: "#0f766e" }} />
                    <div className="metric-lbl"><i className="ti ti-coin" /> Tổng Doanh thu</div>
                    <div className="metric-val" style={{ color: "#0f766e" }}>{formatVND(grandTotal)}</div>
                  </div>

                  <div className="metric">
                    <div className="metric-accent" style={{ background: "#2563eb" }} />
                    <div className="metric-lbl"><i className="ti ti-door" /> Tiền thuê phòng</div>
                    <div className="metric-val" style={{ color: "#2563eb" }}>{formatVND(roomTotalSum)}</div>
                  </div>

                  <div className="metric">
                    <div className="metric-accent" style={{ background: "#ec4899" }} />
                    <div className="metric-lbl"><i className="ti ti-package" /> Đồ ăn & Dịch vụ</div>
                    <div className="metric-val" style={{ color: "#be185d" }}>{formatVND(productTotalSum)}</div>
                  </div>

                  <div className="metric">
                    <div className="metric-accent" style={{ background: "#8b5cf6" }} />
                    <div className="metric-lbl"><i className="ti ti-users" /> Tổng số khách hàng</div>
                    <div className="metric-val" style={{ color: "#6d28d9" }}>{totalCustomers} người</div>
                  </div>
                </div>

                {/* ── VISUAL BRANCH REVENUE BREAKDOWN & PROGRESS BARS ── */}
                <div className="row2" style={{ marginBottom: "24px" }}>
                  {/* Left: Branch Revenue Visual Progress Bars */}
                  <div className="card" style={{ flex: 1.3 }}>
                    <div className="card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="card-title">
                        <i className="ti ti-building" style={{ color: "#0f766e" }} />
                        Tỷ trọng Doanh thu theo Cơ sở
                      </div>
                      <span style={{ fontSize: "0.83rem", color: "#64748b", fontWeight: 600 }}>
                        {filteredBookings.length} đơn hoàn thành
                      </span>
                    </div>

                    <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "18px" }}>
                      {branchRevenueList.map((b) => (
                        <div key={b.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <strong style={{ fontSize: "0.98rem", color: "#0f172a" }}>{b.name}</strong>
                              <span style={{ fontSize: "0.8rem", color: "#64748b", marginLeft: "8px" }}>({b.count} đơn)</span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <strong style={{ fontSize: "1rem", color: "#0f766e" }}>{formatVND(b.amount)}</strong>
                              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#64748b", marginLeft: "8px" }}>
                                {b.percentage}%
                              </span>
                            </div>
                          </div>

                          {/* Visual Progress Bar */}
                          <div style={{ width: "100%", height: "10px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${b.percentage}%`,
                                height: "100%",
                                background: "linear-gradient(90deg, #0f766e 0%, #14b8a6 100%)",
                                borderRadius: "10px",
                                transition: "width 0.5s ease"
                              }}
                            />
                          </div>
                        </div>
                      ))}

                      {branchRevenueList.length === 0 && (
                        <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b" }}>
                          Chưa có dữ liệu doanh thu trong khoảng thời gian này.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Revenue Share Donut / Split Card */}
                  <div className="card" style={{ flex: 0.7 }}>
                    <div className="card-head">
                      <div className="card-title">
                        <i className="ti ti-chart-pie" style={{ color: "#ec4899" }} />
                        Tỷ trọng Nguồn Doanh thu
                      </div>
                    </div>

                    <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: "20px" }}>
                      {/* Room Revenue Bar */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#334155" }}>🚪 Tiền thuê phòng</span>
                          <strong style={{ color: "#2563eb" }}>
                            {grandTotal > 0 ? ((roomTotalSum / grandTotal) * 100).toFixed(1) : 0}%
                          </strong>
                        </div>
                        <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${grandTotal > 0 ? (roomTotalSum / grandTotal) * 100 : 0}%`,
                              height: "100%",
                              background: "#2563eb",
                              borderRadius: "10px"
                            }}
                          />
                        </div>
                        <div style={{ fontSize: "0.83rem", color: "#64748b", marginTop: "4px" }}>
                          Giá trị: {formatVND(roomTotalSum)}
                        </div>
                      </div>

                      {/* Product Revenue Bar */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#334155" }}>🍿 Thực đơn & Dịch vụ</span>
                          <strong style={{ color: "#be185d" }}>
                            {grandTotal > 0 ? ((productTotalSum / grandTotal) * 100).toFixed(1) : 0}%
                          </strong>
                        </div>
                        <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${grandTotal > 0 ? (productTotalSum / grandTotal) * 100 : 0}%`,
                              height: "100%",
                              background: "#be185d",
                              borderRadius: "10px"
                            }}
                          />
                        </div>
                        <div style={{ fontSize: "0.83rem", color: "#64748b", marginTop: "4px" }}>
                          Giá trị: {formatVND(productTotalSum)}
                        </div>
                      </div>

                      <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                        <div style={{ fontSize: "0.83rem", color: "#475569", fontWeight: 600 }}>⭐ Trung bình mỗi đơn (AOV):</div>
                        <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f766e", marginTop: "2px" }}>
                          {formatVND(filteredBookings.length > 0 ? grandTotal / filteredBookings.length : 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── ROW 3: TOP BOOKINGS & RECENT REVIEWS ── */}
                <div className="row2">
                  {/* Top Revenue Bookings */}
                  <div className="card">
                    <div className="card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="card-title">
                        <i className="ti ti-trophy" style={{ color: "#f59e0b" }} />
                        Đơn hàng doanh thu cao nhất
                      </div>
                      <button
                        onClick={() => navigate("/bookinghistory")}
                        style={{ background: "none", border: "none", color: "#0f766e", fontWeight: 700, cursor: "pointer" }}
                      >
                        Xem tất cả →
                      </button>
                    </div>
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>Khách hàng</th>
                          <th>Phòng</th>
                          <th>Khung giờ</th>
                          <th>Tổng tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topBookings.map((b) => (
                          <tr key={b._id}>
                            <td style={{ fontWeight: 700, color: "#0f172a" }}>
                              {b.customerId?.fullName || b.customerName || "Khách tại quầy"}
                            </td>
                            <td className="td-muted">{b.roomId?.roomName || "Phòng VIP"}</td>
                            <td className="td-muted">{b.startTime || "—"} - {b.endTime || "—"}</td>
                            <td style={{ fontWeight: 800, color: "#0f766e" }}>{formatVND(b.finalTotal || b.totalAmount)}</td>
                          </tr>
                        ))}
                        {topBookings.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ textAlign: "center", padding: "20px 0", color: "#64748b" }}>
                              Chưa có đơn hàng nào
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Recent Reviews */}
                  <div className="card">
                    <div className="card-head">
                      <div className="card-title">
                        <i className="ti ti-star" style={{ color: "#8b5cf6" }} />
                        Đánh giá gần đây từ khách hàng ({averageRating}★)
                      </div>
                    </div>
                    {feedbacksList.slice(0, 5).map((r) => {
                      const name = r.customerId?.fullName || "Khách hàng";
                      const initials = name.substring(0, 2).toUpperCase();
                      return (
                        <div className="rv-item" key={r._id}>
                          <div className="rv-av" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                            {initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="rv-name">
                              {name}{" "}
                              <span className="rv-stars" style={{ color: r.rating < 4 ? "#94a3b8" : "#f59e0b" }}>
                                {"★".repeat(r.rating || 5)}{"☆".repeat(5 - (r.rating || 5))}
                              </span>
                            </div>
                            <div className="rv-text">{r.comment || "Không có nội dung"}</div>
                          </div>
                        </div>
                      );
                    })}
                    {feedbacksList.length === 0 && (
                      <div style={{ textAlign: "center", padding: "20px 0", color: "#64748b" }}>
                        Chưa có đánh giá nào
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b", background: "#ffffff", borderRadius: "12px", border: "1px dashed #cbd5e1", marginTop: "20px" }}>
                <i className="ti ti-lock" style={{ fontSize: "48px", color: "#cbd5e1" }}></i>
                <h2 style={{ marginTop: "16px", color: "#334155", fontSize: "1.2rem" }}>Không có quyền truy cập</h2>
                <p style={{ marginTop: "8px", fontSize: "0.95rem" }}>Bạn không có quyền để thực hiện hành động này</p>
              </div>
            )
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              Tính năng đang được phát triển
            </div>
          )}
        </div>
      </div>

      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onSuccess={() => alert("Thêm người dùng thành công!")}
        />
      )}
    </div>
  );
}
