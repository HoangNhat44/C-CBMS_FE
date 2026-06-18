import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/apiClient";
import "./Dashboard.css";
import Sidebar from "../../components/Sidebar";
import ChangePasswordModal from "../authentication/ChangePasswordModal";
import PromotionList from "../promotion/PromotionList";

const menuItems = [
  {
    section: "Tổng quan",
    items: [{ icon: "ti-chart-bar", label: "Doanh thu", badge: "Mới", key: "revenue" }],
  },
  {
    section: "Cơ sở vật chất",
    items: [
      { icon: "ti-building", label: "Quản lý cơ sở", key: "facility" },
      { icon: "ti-door", label: "Quản lý phòng", key: "room", child: true },
      { icon: "ti-clock", label: "Quản lý slot", key: "slot" },
    ],
  },
  {
    section: "Khách hàng",
    items: [{ icon: "ti-star", label: "Đánh giá khách hàng", key: "review" }],
  },
  {
    section: "Marketing",
    items: [
      { icon: "ti-ticket", label: "Quản lý khuyến mãi", key: "promotion" },
      { icon: "ti-news", label: "Quản lý tin tức", key: "news" },
    ],
  },
  {
    section: "Danh mục & sản phẩm",
    items: [
      { icon: "ti-category", label: "Quản lý danh mục", key: "category" },
      { icon: "ti-package", label: "Quản lý sản phẩm", key: "product" },
      { icon: "ti-sparkles", label: "Dịch vụ đi kèm", key: "service" },
    ],
  },
  {
    section: "Hệ thống",
    items: [{ icon: "ti-user-plus", label: "Thêm người dùng", key: "adduser" }],
  },
];

const metrics = [
  { icon: "ti-coin",           label: "Doanh thu",    value: "84.2M", trend: "+12%", up: true,  color: "#4f8ef7" },
  { icon: "ti-calendar-check", label: "Đặt chỗ",      value: "1,304", trend: "+8%",  up: true,  color: "#16a34a" },
  { icon: "ti-users",          label: "Khách hàng",   value: "528",   trend: "−3%",  up: false, color: "#f59e0b" },
  { icon: "ti-star",           label: "Đánh giá TB",  value: "4.6",   trend: "+0.2", up: true,  color: "#8b5cf6" },
];

const revenueByRoom = [
  { label: "Phòng A", pct: 85, val: "21.4M" },
  { label: "Phòng B", pct: 70, val: "17.6M" },
  { label: "Phòng C", pct: 55, val: "13.8M" },
  { label: "Phòng D", pct: 42, val: "10.5M" },
  { label: "Khác",    pct: 28, val: "7.2M"  },
];

const reviews = [
  { initials: "TL", name: "Trần Thị Lan",   stars: 5, text: "Không gian rất đẹp, nhân viên nhiệt tình!",        bg: "#dbeafe", color: "#1d4ed8" },
  { initials: "PH", name: "Phạm Văn Hùng",  stars: 4, text: "Đồ uống ngon, slot hợp lý, chỗ đậu hơi xa.",       bg: "#dcfce7", color: "#15803d" },
  { initials: "NM", name: "Nguyễn Minh",    stars: 3, text: "Dịch vụ ổn nhưng phải chờ xác nhận khá lâu.",      bg: "#fee2e2", color: "#b91c1c" },
];

const promos = [
  { name: "Khai trương giảm 20%", status: "on",  label: "Đang chạy" },
  { name: "Happy hour 17–19h",    status: "on",  label: "Đang chạy" },
  { name: "Flash sale cuối tuần", status: "hot", label: "Sắp hết"   },
  { name: "Combo cặp đôi",        status: "off", label: "Đã hết"    },
];

const slots = [
  { time: "08:00–10:00", pct: 100, count: "8/8", type: "full" },
  { time: "10:00–12:00", pct: 75,  count: "6/8", type: "full" },
  { time: "13:00–15:00", pct: 50,  count: "4/8", type: "mid"  },
  { time: "15:00–17:00", pct: 25,  count: "2/8", type: "low"  },
  { time: "19:00–21:00", pct: 88,  count: "7/8", type: "full" },
];

const slotColor = { full: "#16a34a", mid: "#f59e0b", low: "#ef4444" };
const pillClass = { on: "pill-on", hot: "pill-hot", off: "pill-off" };

// Decode JWT payload (không cần verify, chỉ lấy thông tin hiển thị)
function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

// Lấy chữ viết tắt từ tên đầy đủ (VD: "Minh Quân" → "MQ")
function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

export default function OwnerDashboard() {
  const [active, setActive] = useState("revenue");
  const [user, setUser] = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [cpModalOpen, setCpModalOpen] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(decoded);
      } else {
        localStorage.removeItem("token");
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setDropOpen(false);
    navigate("/login", { replace: true });
  };

  const initials = getInitials(user?.fullName || user?.email || "");

  return (
    <div className="dash">
      {/* ── SIDEBAR ── */}
      <Sidebar 
        menuItems={menuItems} 
        active={active} 
        setActive={setActive} 
        handleLogout={handleLogout} 
        onLogoClick={() => navigate("/owner-dashboard")}
      />

      {/* ── MAIN ── */}
      <div className="main">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <span className="breadcrumb">Trang chủ&nbsp;/&nbsp;</span>
            <span className="breadcrumb-active">Doanh thu</span>
          </div>
          <div className="topbar-right">
            {user ? (
              <div
                className="tb-user"
                ref={dropRef}
                style={{ position: "relative" }}
                onClick={() => setDropOpen((v) => !v)}
              >
                <div className="tb-avatar">{initials}</div>
                <div>
                  <div className="tb-uname">{user.fullName || user.email}</div>
                  <div className="tb-role" style={{ textTransform: "capitalize" }}>{user.role}</div>
                </div>
                <i
                  className="ti ti-chevron-down"
                  style={{ fontSize: 14, color: "var(--text-muted)", marginLeft: 4 }}
                />

                {dropOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 10px)", right: 0,
                    background: "#fff", border: "1px solid var(--border)",
                    borderRadius: 12, boxShadow: "0 8px 32px rgba(16,42,67,.12)",
                    minWidth: 180, zIndex: 200, overflow: "hidden",
                  }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-light)" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-dark)" }}>
                        {user.fullName || user.email}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, textTransform: "capitalize" }}>
                        {user.role}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDropOpen(false);
                        setCpModalOpen(true);
                      }}
                      style={{
                        width: "100%", padding: "11px 16px",
                        background: "none", border: "none",
                        display: "flex", alignItems: "center", gap: 8,
                        fontSize: 13, fontWeight: 700, color: "var(--text-dark)",
                        cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    >
                      <i className="ti ti-key" style={{ fontSize: 16 }} />
                      Đổi mật khẩu
                    </button>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: "100%", padding: "11px 16px",
                        background: "none", border: "none",
                        display: "flex", alignItems: "center", gap: 8,
                        fontSize: 13, fontWeight: 700, color: "#b42318",
                        cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#fff1f0"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    >
                      <i className="ti ti-logout" style={{ fontSize: 16 }} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button className="btn-outline" onClick={() => navigate("/login")}>
                  Đăng nhập
                </button>
                <button className="btn-primary" onClick={() => navigate("/register")}>
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="content">
          {active === "promotion" ? (
            <PromotionList />
          ) : (
            <>
              <div>
                <div className="pg-title">Doanh thu</div>
                <div className="pg-sub">Tổng quan hoạt động tháng 6 · 2025</div>
              </div>

          {/* Metrics */}
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
                  {m.trend} so với tháng trước
                </div>
              </div>
            ))}
          </div>

          {/* Row 2 */}
          <div className="row2">
            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-chart-bar" aria-hidden="true" />
                  Doanh thu theo phòng
                </div>
                <span className="card-more">Xem thêm</span>
              </div>
              {revenueByRoom.map((r) => (
                <div className="bar-row" key={r.label}>
                  <div className="bar-lbl">{r.label}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${r.pct}%` }} />
                  </div>
                  <div className="bar-val">{r.val}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-star" aria-hidden="true" />
                  Đánh giá gần đây
                </div>
                <span className="card-more">Xem tất cả</span>
              </div>
              {reviews.map((r) => (
                <div className="rv-item" key={r.name}>
                  <div className="rv-av" style={{ background: r.bg, color: r.color }}>
                    {r.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="rv-name">
                      {r.name}{" "}
                      <span className="rv-stars" style={{ color: r.stars < 4 ? "#94a3b8" : "#f59e0b" }}>
                        {"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}
                      </span>
                    </div>
                    <div className="rv-text">{r.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 3 */}
          <div className="row2">
            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-ticket" aria-hidden="true" />
                  Khuyến mãi đang chạy
                </div>
                <span className="card-more">Quản lý</span>
              </div>
              {promos.map((p) => (
                <div className="promo-row" key={p.name}>
                  <span className="promo-name">{p.name}</span>
                  <span className={`pill ${pillClass[p.status]}`}>{p.label}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-clock" aria-hidden="true" />
                  Slot hôm nay
                </div>
                <span className="card-more">Xem lịch</span>
              </div>
              {slots.map((s) => (
                <div className="slot-row" key={s.time}>
                  <div className="slot-time">{s.time}</div>
                  <div className="slot-bar-track">
                    <div
                      className="slot-fill"
                      style={{ width: `${s.pct}%`, background: slotColor[s.type] }}
                    />
                  </div>
                  <div className="slot-count">{s.count}</div>
                </div>
              ))}
            </div>
          </div>
            </>
          )}
        </div>
      </div>

      <ChangePasswordModal 
        isOpen={cpModalOpen} 
        onClose={() => setCpModalOpen(false)} 
      />
    </div>
  );
}