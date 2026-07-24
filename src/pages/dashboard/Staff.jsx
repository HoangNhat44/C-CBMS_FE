import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Dashboard.css"; // đường dẫn tuỳ cấu trúc project
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import userAPI from "../../services/user.service";
import roomAPI from "../../services/room.service";
import bookingAPI from "../../services/booking.service";
import AddUserModal from "../account/AddUserModal";
import { useAuth } from "../../context/AuthContext";

export const staffMenuItems = [
  {
    section: "Tổng quan",
    items: [
      { icon: "ti-chart-bar", label: "Dashboard", key: "dashboard" },
    ],
  },
  {
    section: "Quản lý",
    items: [
      { icon: "ti-category", label: "Danh mục", key: "category" },
      { icon: "ti-package", label: "Sản phẩm", key: "product" },
    ],
  },
  {
    section: "Khách hàng",
    items: [
      { icon: "ti-star", label: "Đánh giá khách hàng", key: "review" },
    ],
  },
  {
    section: "Khách hàng & Phòng",
    items: [
      { icon: "ti-users", label: "Danh sách khách hàng", key: "customers" },
      { icon: "ti-building-estate", label: "Sơ đồ & Danh sách phòng", key: "rooms" },
    ],
  },
  {
    section: "Đặt chỗ",
    items: [
      { icon: "ti-calendar-plus", label: "Đặt phòng tại quầy", key: "walkin", badge: "Nhanh" },
      { icon: "ti-calendar-event", label: "Lịch sử đặt phòng", key: "bookinghistory" },
    ],
  },
  {
    section: "Hệ thống",
    items: [
      { icon: "ti-user-plus", label: "Thêm người dùng", key: "adduser" }
    ],
  },
];

// Decode JWT payload (không cần verify, chỉ lấy thông tin hiển thị)
function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [active, setActive] = useState("dashboard");
  const [customersList, setCustomersList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [todayBookingsList, setTodayBookingsList] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);

  // Filters for rooms view
  const [roomSearch, setRoomSearch] = useState("");
  const [roomStatusFilter, setRoomStatusFilter] = useState("all"); // "all" | "available" | "occupied" | "maintenance"

  const navigate = useNavigate();
  const location = useLocation();

  const tokenBranchId = decodeToken(localStorage.getItem("token"))?.branchId;
  const staffBranchId = user?.branchId?._id || (typeof user?.branchId === "string" ? user?.branchId : null) || tokenBranchId;
  const staffBranchName = user?.branchId?.name || "Chi nhánh của bạn";

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
    localStorage.setItem("current_dashboard", "staff");
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
          setCustomersList(customers);
        }
      } catch (err) {
        console.error("Fetch customers failed", err);
      }
    };

    const fetchRooms = async () => {
      try {
        let rRes;
        if (staffBranchId) {
          rRes = await roomAPI.getAllRooms({ branchId: staffBranchId });
        } else {
          rRes = await roomAPI.getAllRooms();
        }
        if (rRes.success) {
          let list = rRes.data || [];
          if (staffBranchId) {
            list = list.filter(
              (r) =>
                (r.branchId?._id || r.branchId) === staffBranchId ||
                String(r.branchId?._id || r.branchId) === String(staffBranchId)
            );
          }
          setRoomsList(list);
        }
      } catch (err) {
        console.error("Fetch rooms failed", err);
      }
    };

    const fetchBookings = async () => {
      try {
        const bRes = await bookingAPI.getAllBookings();
        if (bRes.data?.success) {
          const bookings = bRes.data.data || [];
          setTodayBookingsList(bookings);
        }
      } catch (err) {
        console.error("Fetch bookings failed", err);
      }
    };

    fetchCustomers();
    fetchRooms();
    fetchBookings();
  }, [staffBranchId]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  // Map rooms with realtime status (available | occupied | maintenance | inactive)
  const roomsWithRealtimeStatus = useMemo(() => {
    return roomsList.map((r) => {
      if (r.status === "maintenance") return { ...r, realStatus: "maintenance" };
      if (r.status === "inactive") return { ...r, realStatus: "inactive" };

      const activeBooking = todayBookingsList.find((b) => {
        if (b.status !== "confirmed") return false;
        const bRoomId = b.roomId?._id || b.roomId;
        if (String(bRoomId) !== String(r._id)) return false;

        const today = new Date();
        const bDate = new Date(b.bookingDate);
        if (
          today.getFullYear() === bDate.getFullYear() &&
          today.getMonth() === bDate.getMonth() &&
          today.getDate() === bDate.getDate()
        ) {
          const currentHours = today.getHours();
          const currentMinutes = today.getMinutes();
          const currentTime = currentHours + currentMinutes / 60;

          const parseTime = (timeStr) => {
            if (!timeStr) return 0;
            const parts = timeStr.split(":");
            return parseInt(parts[0]) + (parseInt(parts[1] || 0) / 60);
          };

          const start = parseTime(b.startTime);
          const end = parseTime(b.endTime);

          return currentTime >= start && currentTime <= end;
        }
        return false;
      });

      if (activeBooking) {
        return { ...r, realStatus: "occupied", activeBooking };
      }
      return { ...r, realStatus: "available" };
    });
  }, [roomsList, todayBookingsList]);

  // Realtime Status Counters
  const countTotal = roomsWithRealtimeStatus.length;
  const countAvailable = roomsWithRealtimeStatus.filter((r) => r.realStatus === "available").length;
  const countOccupied = roomsWithRealtimeStatus.filter((r) => r.realStatus === "occupied").length;
  const countMaintenance = roomsWithRealtimeStatus.filter((r) => r.realStatus === "maintenance").length;

  // Filtered Rooms for Visual Grid
  const filteredRooms = roomsWithRealtimeStatus.filter((r) => {
    const matchSearch =
      r.roomName?.toLowerCase().includes(roomSearch.toLowerCase()) ||
      (r.roomTypeId?.typeName || r.roomTypeId?.name || "").toLowerCase().includes(roomSearch.toLowerCase());
    const matchStatus = roomStatusFilter === "all" ? true : r.realStatus === roomStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="dash dash--staff">
      {/* ── SIDEBAR ── */}
      <Sidebar
        menuItems={staffMenuItems}
        active={active}
        setActive={(key) => {
          if (key === "adduser") {
            setShowAddUser(true);
            return;
          }
          setActive(key);
        }}
        handleLogout={handleLogout}
        onLogoClick={() => navigate("/staff-dashboard")}
      />

      <div className="main">
        {/* Topbar */}
        <Topbar breadcrumbs={[{ label: "Trang chủ", link: "/staff-dashboard" }, { label: active === "rooms" ? "Sơ đồ phòng" : active === "customers" ? "Danh sách khách hàng" : "Dashboard nhân viên" }]} />

        {/* Content */}
        <div className="content">
          {active === "rooms" ? (
            /* ── VIEW: SƠ ĐỒ & DANH SÁCH PHÒNG ── */
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h1 className="pg-title" style={{ margin: 0 }}>Sơ đồ & Trạng thái Phòng trực quan</h1>
                  <p className="pg-sub" style={{ margin: "4px 0 0 0" }}>Bảng theo dõi thời gian thực tại <strong>{staffBranchName}</strong></p>
                </div>
                <span className="pill pill-on" style={{ fontSize: "0.88rem", padding: "6px 14px", fontWeight: 700 }}>
                  📍 {staffBranchName}
                </span>
              </div>

              {/* Stats Counters */}
              <div className="metrics" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: "20px" }}>
                <div className="metric">
                  <div className="metric-accent" style={{ background: "#2563eb" }} />
                  <div className="metric-lbl"><i className="ti ti-door" /> Tổng số phòng</div>
                  <div className="metric-val">{countTotal}</div>
                </div>
                <div className="metric">
                  <div className="metric-accent" style={{ background: "#10b981" }} />
                  <div className="metric-lbl"><i className="ti ti-check" /> Phòng trống (Sẵn sàng)</div>
                  <div className="metric-val" style={{ color: "#166534" }}>{countAvailable}</div>
                </div>
                <div className="metric">
                  <div className="metric-accent" style={{ background: "#ef4444" }} />
                  <div className="metric-lbl"><i className="ti ti-users" /> Đang có khách</div>
                  <div className="metric-val" style={{ color: "#991b1b" }}>{countOccupied}</div>
                </div>
                <div className="metric">
                  <div className="metric-accent" style={{ background: "#f59e0b" }} />
                  <div className="metric-lbl"><i className="ti ti-tool" /> Đang bảo trì</div>
                  <div className="metric-val" style={{ color: "#92400e" }}>{countMaintenance}</div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="card" style={{ marginBottom: "20px", padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      className={`btn-outline ${roomStatusFilter === "all" ? "active" : ""}`}
                      style={{ borderRadius: "20px", fontWeight: 700, padding: "6px 16px", background: roomStatusFilter === "all" ? "#2563eb" : "#f1f5f9", color: roomStatusFilter === "all" ? "#ffffff" : "#475569", border: "none" }}
                      onClick={() => setRoomStatusFilter("all")}
                    >
                      Tất cả phòng ({countTotal})
                    </button>
                    <button
                      style={{ borderRadius: "20px", fontWeight: 700, padding: "6px 16px", background: roomStatusFilter === "available" ? "#166534" : "#dcfce7", color: roomStatusFilter === "available" ? "#ffffff" : "#15803d", border: "none", cursor: "pointer" }}
                      onClick={() => setRoomStatusFilter("available")}
                    >
                      🟢 Trống / Sẵn sàng ({countAvailable})
                    </button>
                    <button
                      style={{ borderRadius: "20px", fontWeight: 700, padding: "6px 16px", background: roomStatusFilter === "occupied" ? "#991b1b" : "#fee2e2", color: roomStatusFilter === "occupied" ? "#ffffff" : "#b91c1c", border: "none", cursor: "pointer" }}
                      onClick={() => setRoomStatusFilter("occupied")}
                    >
                      🔴 Đang có khách ({countOccupied})
                    </button>
                    <button
                      style={{ borderRadius: "20px", fontWeight: 700, padding: "6px 16px", background: roomStatusFilter === "maintenance" ? "#854d0e" : "#fef9c3", color: roomStatusFilter === "maintenance" ? "#ffffff" : "#a16207", border: "none", cursor: "pointer" }}
                      onClick={() => setRoomStatusFilter("maintenance")}
                    >
                      🟡 Đang bảo trì ({countMaintenance})
                    </button>
                  </div>

                  <div style={{ position: "relative", minWidth: "260px" }}>
                    <i className="ti ti-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                    <input
                      type="text"
                      placeholder="Tìm nhanh tên phòng..."
                      value={roomSearch}
                      onChange={(e) => setRoomSearch(e.target.value)}
                      style={{ width: "100%", paddingLeft: "36px", paddingRight: "12px", height: "38px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>
              </div>

              {/* Room Grid */}
              {filteredRooms.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                  Không tìm thấy phòng nào phù hợp với bộ lọc tại <strong>{staffBranchName}</strong>.
                </div>
              ) : (
                <div className="staff-visual-grid">
                  {filteredRooms.map((r) => {
                    const isAvail = r.realStatus === "available";
                    const isOcc = r.realStatus === "occupied";
                    const isMaint = r.realStatus === "maintenance";

                    let badgeText = "Sẵn sàng";
                    if (isOcc) badgeText = "Có khách";
                    else if (isMaint) badgeText = "Bảo trì";
                    else if (r.realStatus === "inactive") badgeText = "Ngưng HĐ";

                    return (
                      <div key={r._id} className={`room-visual-card ${r.realStatus}`}>
                        <div>
                          <div className="room-visual-header">
                            <div className="room-visual-name">
                              <i className="ti ti-door" style={{ color: isAvail ? "#166534" : isOcc ? "#991b1b" : "#854d0e" }} />
                              {r.roomName}
                            </div>
                            <span className={`room-status-badge ${r.realStatus}`}>
                              {badgeText}
                            </span>
                          </div>

                          <div className="room-visual-body">
                            <div className="room-detail-row">
                              <span>Loại phòng:</span>
                              <strong>{r.roomTypeId?.typeName || r.roomTypeId?.name || "Tiêu chuẩn"}</strong>
                            </div>
                            <div className="room-detail-row">
                              <span>Sức chứa tối đa:</span>
                              <strong>👥 {r.capacity} người</strong>
                            </div>

                            {isOcc && r.activeBooking && (
                              <div className="room-active-banner occupied">
                                <div style={{ fontWeight: 800, fontSize: "0.85rem", marginBottom: "2px" }}>
                                  🔥 Đang đón khách
                                </div>
                                <div>⏰ Khung giờ: <strong>{r.activeBooking.startTime} - {r.activeBooking.endTime}</strong></div>
                                <div>👤 Khách đặt: <strong>{r.activeBooking.customerName || r.activeBooking.userId?.fullName || "Khách tại quầy"}</strong></div>
                              </div>
                            )}

                            {isAvail && (
                              <div className="room-active-banner available">
                                ✨ Phòng trống sạch sẽ, sẵn sàng đón khách ngay
                              </div>
                            )}

                            {isMaint && (
                              <div className="room-active-banner maintenance">
                                ⚠️ Phòng đang bảo trì trang thiết bị
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="room-visual-footer">
                          {isAvail ? (
                            <button
                              className="btn-room-action walkin"
                              onClick={() => navigate("/walkin", { state: { roomId: r._id } })}
                            >
                              <i className="ti ti-calendar-plus" /> Đặt phòng ngay
                            </button>
                          ) : isOcc ? (
                            <button
                              className="btn-room-action"
                              style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}
                              onClick={() => navigate("/bookinghistory")}
                            >
                              <i className="ti ti-eye" /> Xem đơn đặt phòng
                            </button>
                          ) : (
                            <button
                              className="btn-room-action"
                              style={{ background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", cursor: "default" }}
                              disabled
                            >
                              <i className="ti ti-lock" /> Tạm khóa
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : active === "customers" ? (
            /* ── VIEW: DANH SÁCH KHÁCH HÀNG ── */
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h1 className="pg-title" style={{ margin: 0 }}>Danh sách khách hàng</h1>
                  <p className="pg-sub" style={{ margin: "4px 0 0 0" }}>Tra cứu thông tin khách hàng đăng ký tài khoản</p>
                </div>
                <span className="pill pill-on" style={{ fontSize: "0.88rem", padding: "6px 14px", fontWeight: 700 }}>
                  📍 {staffBranchName}
                </span>
              </div>

              <div className="card" style={{ marginTop: "20px" }}>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Khách hàng</th>
                      <th>Email</th>
                      <th>Số điện thoại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customersList.map((c) => (
                      <tr key={c._id}>
                        <td style={{ fontWeight: 700, color: "#0f172a" }}>{c.fullName}</td>
                        <td className="td-muted">{c.email || "—"}</td>
                        <td className="td-muted">{c.phone || "—"}</td>
                      </tr>
                    ))}
                    {customersList.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)" }}>
                          Chưa có dữ liệu khách hàng.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ── VIEW: STAFF DASHBOARD OVERVIEW (DEFAULT) ── */
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h1 className="pg-title" style={{ margin: 0 }}>Dashboard nhân viên</h1>
                  <p className="pg-sub" style={{ margin: "4px 0 0 0" }}>Tổng quan ca làm việc tại <strong>{staffBranchName}</strong></p>
                </div>
                <span className="pill pill-on" style={{ fontSize: "0.88rem", padding: "6px 14px", fontWeight: 700 }}>
                  📍 {staffBranchName}
                </span>
              </div>

              <div className="metrics" style={{ gridTemplateColumns: "repeat(2, 1fr)", marginBottom: "24px" }}>
                <div className="metric">
                  <div className="metric-accent" style={{ background: "#0f766e" }} />
                  <div className="metric-lbl">
                    <i className="ti ti-users" aria-hidden="true" />
                    Khách đang ở (Hôm nay)
                  </div>
                  <div className="metric-val">{todayBookingsList.filter(b => {
                    if (b.status !== "confirmed") return false;
                    const today = new Date();
                    const bDate = new Date(b.bookingDate);
                    return today.getFullYear() === bDate.getFullYear() &&
                           today.getMonth() === bDate.getMonth() &&
                           today.getDate() === bDate.getDate();
                  }).length}</div>
                </div>
                <div className="metric">
                  <div className="metric-accent" style={{ background: "#8b5cf6" }} />
                  <div className="metric-lbl">
                    <i className="ti ti-door" aria-hidden="true" />
                    Phòng trống tại cơ sở
                  </div>
                  <div className="metric-val">
                    {roomsList.filter(r => r.status === "available" || !r.status).length}/{roomsList.length}
                  </div>
                </div>
              </div>

              <div className="row2">
                {/* Recent Customers Card */}
                <div className="card">
                  <div className="card-head">
                    <div className="card-title">
                      <i className="ti ti-users" aria-hidden="true" />
                      Khách hàng mới gần đây
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                    {customersList.slice(0, 5).map((c) => {
                      const initials = c.fullName ? c.fullName.substring(0, 2).toUpperCase() : "U";
                      const bg = "#dbeafe";
                      const color = "#1d4ed8";
                      const meta = c.email || c.phone || "Khách hàng";
                      return (
                        <div className="user-row" key={c._id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div className="user-av" style={{ background: bg, color: color, width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: 700 }}>
                            {initials}
                          </div>
                          <div>
                            <div className="user-name" style={{ fontWeight: 600 }}>{c.fullName}</div>
                            <div className="user-meta" style={{ fontSize: "0.8rem", color: "#64748b" }}>{meta}</div>
                          </div>
                        </div>
                      );
                    })}
                    {customersList.length === 0 && (
                      <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)" }}>
                        Chưa có khách hàng nào
                      </div>
                    )}
                  </div>
                </div>

                {/* Rooms Summary Table Card */}
                <div className="card">
                  <div className="card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="card-title">
                      <i className="ti ti-building-estate" aria-hidden="true" />
                      Danh sách phòng ({staffBranchName})
                    </div>
                    <button
                      onClick={() => setActive("rooms")}
                      style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer" }}
                    >
                      Xem sơ đồ →
                    </button>
                  </div>
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Phòng</th>
                        <th>Loại</th>
                        <th>Sức chứa</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomsList.slice(0, 5).map((r) => {
                        let statusText = "Sẵn sàng";
                        let pillType = "pill-on";
                        if (r.status === "maintenance") {
                          statusText = "Bảo trì";
                          pillType = "pill-warn";
                        } else if (r.status === "inactive") {
                          statusText = "Ngưng HĐ";
                          pillType = "pill-off";
                        }
                        return (
                          <tr key={r._id}>
                            <td style={{ fontWeight: 700 }}>{r.roomName}</td>
                            <td className="td-muted">{r.roomTypeId?.typeName || r.roomTypeId?.name || "Loại phòng"}</td>
                            <td className="td-muted">{r.capacity} người</td>
                            <td><span className={`pill ${pillType}`}>{statusText}</span></td>
                          </tr>
                        );
                      })}
                      {roomsList.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)" }}>
                            Chưa có dữ liệu phòng tại cơ sở {staffBranchName}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
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