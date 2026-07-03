import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css"; // đường dẫn tuỳ cấu trúc project
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import userAPI from "../../services/user.service";
import roomAPI from "../../services/room.service";
import bookingAPI from "../../services/booking.service";

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
      { icon: "ti-sparkles", label: "Dịch vụ đi kèm", key: "service" },
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
      { icon: "ti-building-estate", label: "Danh sách phòng", key: "rooms" },
    ],
  },
  {
    section: "Đặt chỗ",
    items: [
      { icon: "ti-calendar-plus", label: "Đặt phòng tại quầy", key: "walkin", badge: "Nhanh" },
      { icon: "ti-calendar-event", label: "Lịch sử đặt phòng", key: "bookinghistory" },
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
  const [active, setActive] = useState("dashboard");
  const [customersList, setCustomersList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [activeBookings, setActiveBookings] = useState(0);
  const navigate = useNavigate();




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
          setCustomersList(customers.slice(0, 5));
        }
      } catch (err) {
        console.error("Fetch customers failed", err);
      }
    };

    const fetchRooms = async () => {
      try {
        const rRes = await roomAPI.getAllRooms();
        if (rRes.success) {
          setRoomsList(rRes.data || []);
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
          const active = bookings.filter(b => {
            if (b.status !== "confirmed") return false;
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

              if (currentTime >= start && currentTime <= end) {
                return true;
              }
            }
            return false;
          }).length;
          setActiveBookings(active);
        }
      } catch (err) {
        console.error("Fetch bookings failed", err);
      }
    };

    fetchCustomers();
    fetchRooms();
    fetchBookings();
  }, []);



  const handleLogout = () => {
    localStorage.removeItem("token");

    navigate("/login", { replace: true });
  };
  return (
    <div className="dash dash--staff">

      {/* ── SIDEBAR ── */}
      <Sidebar
        menuItems={staffMenuItems}
        active={active}
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
            navigate("/walkin");
            return;
          }
          setActive(key);
        }}
        handleLogout={handleLogout}
        onLogoClick={() => navigate("/staff-dashboard")}
      />

      <div className="main">
        {/* Topbar */}
        <Topbar breadcrumbs={[{ label: "Trang chủ", link: "/staff-dashboard" }, { label: "Dashboard nhân viên" }]} />

        {/* Content */}
        <div className="content">
          <div>
            <div className="pg-title">Dashboard nhân viên</div>
            <div className="pg-sub">Tổng quan ca làm việc hôm nay · Thứ Hai, 16/06/2025</div>
          </div>

          <div className="metrics" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="metric">
              <div className="metric-accent" style={{ background: "#0f766e" }} />
              <div className="metric-lbl">
                <i className="ti ti-users" aria-hidden="true" />
                Khách đang ở
              </div>
              <div className="metric-val">{activeBookings}</div>
            </div>
            <div className="metric">
              <div className="metric-accent" style={{ background: "#8b5cf6" }} />
              <div className="metric-lbl">
                <i className="ti ti-door" aria-hidden="true" />
                Phòng trống
              </div>
              <div className="metric-val">
                {roomsList.filter(r => r.status === "available").length}/{roomsList.length}
              </div>
            </div>
          </div>



          <div className="row2">
            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-users" aria-hidden="true" />
                  Khách hàng gần đây
                </div>
              </div>
              {customersList.map((c) => {
                const initials = c.fullName ? c.fullName.substring(0, 2).toUpperCase() : "U";
                const bg = "#dbeafe";
                const color = "#1d4ed8";
                const meta = c.email || c.phone || "Khách hàng";
                return (
                  <div className="user-row" key={c._id}>
                    <div className="user-av" style={{ background: bg, color: color }}>
                      {initials}
                    </div>
                    <div>
                      <div className="user-name">{c.fullName}</div>
                      <div className="user-meta">{meta}</div>
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

            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-building-estate" aria-hidden="true" />
                  Danh sách phòng
                </div>
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
                    let statusText = "Trống";
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
                      <td>{r.roomName}</td>
                      <td className="td-muted">{r.roomTypeId?.typeName || r.roomTypeId?.name || "Loại phòng"}</td>
                      <td className="td-muted">{r.capacity} người</td>
                      <td><span className={`pill ${pillType}`}>{statusText}</span></td>
                    </tr>
                    );
                  })}
                  {roomsList.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)" }}>
                        Chưa có dữ liệu phòng
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>


          </div>
        </div>
      </div>

    </div>
  );
}