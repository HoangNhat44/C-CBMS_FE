import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css"; // đường dẫn tuỳ cấu trúc project
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

export const staffMenuItems = [
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

const metrics = [
  { icon: "ti-calendar-check", label: "Đặt phòng hôm nay", value: "24", trend: "+4", up: true, color: "#2563eb" },
  { icon: "ti-users", label: "Khách đang ở", value: "11", trend: "+2", up: true, color: "#0f766e" },
  { icon: "ti-package", label: "Sản phẩm tồn kho", value: "138", trend: "−12", up: false, color: "#f59e0b" },
  { icon: "ti-door", label: "Phòng trống", value: "6/14", trend: "ổn định", up: true, color: "#8b5cf6" },
];

const recentBookings = [
  { name: "Nguyễn Văn An", room: "Phòng A3", time: "09:00–11:00", status: "on", statusText: "Đang ở" },
  { name: "Trần Thị Bích", room: "Phòng B1", time: "10:00–12:00", status: "on", statusText: "Đang ở" },
  { name: "Lê Hoàng Nam", room: "Phòng C2", time: "13:00–15:00", status: "blue", statusText: "Sắp tới" },
  { name: "Phạm Ngọc Ánh", room: "Phòng A1", time: "14:00–16:00", status: "blue", statusText: "Sắp tới" },
  { name: "Vũ Đình Khải", room: "Phòng B3", time: "08:00–09:00", status: "off", statusText: "Đã xong" },
];

const customers = [
  { initials: "NA", name: "Nguyễn Văn An", meta: "0912 345 678 · 8 lần đặt", bg: "#dbeafe", color: "#1d4ed8" },
  { initials: "TB", name: "Trần Thị Bích", meta: "0934 567 890 · 5 lần đặt", bg: "#dcfce7", color: "#15803d" },
  { initials: "LN", name: "Lê Hoàng Nam", meta: "0976 234 567 · 12 lần đặt", bg: "#ede9fe", color: "#5b21b6" },
  { initials: "PA", name: "Phạm Ngọc Ánh", meta: "0901 123 456 · 3 lần đặt", bg: "#fef3c7", color: "#92400e" },
];

const rooms = [
  { name: "Phòng A1", type: "VIP", capacity: 4, status: "on", statusText: "Trống" },
  { name: "Phòng A3", type: "VIP", capacity: 4, status: "hot", statusText: "Đang dùng" },
  { name: "Phòng B1", type: "Thường", capacity: 6, status: "hot", statusText: "Đang dùng" },
  { name: "Phòng B3", type: "Thường", capacity: 6, status: "on", statusText: "Trống" },
  { name: "Phòng C2", type: "Premium", capacity: 8, status: "blue", statusText: "Sắp tới" },
];

const products = [
  { name: "Cà phê sữa đá", category: "Đồ uống", stock: 48, status: "on" },
  { name: "Matcha Latte", category: "Đồ uống", stock: 22, status: "on" },
  { name: "Bánh tiramisu", category: "Bánh", stock: 6, status: "hot" },
  { name: "Nước cam ép", category: "Đồ uống", stock: 0, status: "off" },
  { name: "Combo cặp đôi", category: "Combo", stock: 14, status: "on" },
];

const pillMap = { on: "pill-on", hot: "pill-hot", off: "pill-off", blue: "pill-blue", warn: "pill-warn" };

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
  const [active, setActive] = useState("category");
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

          <div className="metrics">
            {metrics.map((m) => (
              <div className="metric" key={m.label}>
                <div className="metric-accent" style={{ background: m.color }} />
                <div className="metric-lbl">
                  <i className={`ti ${m.icon}`} aria-hidden="true" />
                  {m.label}
                </div>
                <div className="metric-val">{m.value}</div>
                <div className={`metric-trend ${m.up ? "trend-up" : "trend-dn"}`}>
                  <i className={`ti ${m.up ? "ti-trending-up" : "ti-trending-down"}`} />
                  {m.trend} so với hôm qua
                </div>
              </div>
            ))}
          </div>

          <div className="row2">
            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-calendar-check" aria-hidden="true" />
                  Đặt phòng hôm nay
                </div>
                <span className="card-more">Xem tất cả</span>
              </div>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Khách</th>
                    <th>Phòng</th>
                    <th>Giờ</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => (
                    <tr key={b.name + b.time}>
                      <td>{b.name}</td>
                      <td className="td-muted">{b.room}</td>
                      <td className="td-muted">{b.time}</td>
                      <td><span className={`pill ${pillMap[b.status]}`}>{b.statusText}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-users" aria-hidden="true" />
                  Khách hàng gần đây
                </div>
                <span className="card-more">Xem tất cả</span>
              </div>
              {customers.map((c) => (
                <div className="user-row" key={c.name}>
                  <div className="user-av" style={{ background: c.bg, color: c.color }}>
                    {c.initials}
                  </div>
                  <div>
                    <div className="user-name">{c.name}</div>
                    <div className="user-meta">{c.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="row2">
            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-building-estate" aria-hidden="true" />
                  Danh sách phòng
                </div>
                <span className="card-more">Quản lý</span>
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
                  {rooms.map((r) => (
                    <tr key={r.name}>
                      <td>{r.name}</td>
                      <td className="td-muted">{r.type}</td>
                      <td className="td-muted">{r.capacity} người</td>
                      <td><span className={`pill ${pillMap[r.status]}`}>{r.statusText}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-package" aria-hidden="true" />
                  Sản phẩm tồn kho
                </div>
                <span className="card-more">Quản lý</span>
              </div>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>Danh mục</th>
                    <th>Tồn</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.name}>
                      <td>{p.name}</td>
                      <td className="td-muted">{p.category}</td>
                      <td className="td-muted">{p.stock}</td>
                      <td>
                        <span className={`pill ${p.stock === 0 ? "pill-off"
                          : p.stock < 10 ? "pill-hot"
                            : "pill-on"
                          }`}>
                          {p.stock === 0 ? "Hết hàng" : p.stock < 10 ? "Sắp hết" : "Còn hàng"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}