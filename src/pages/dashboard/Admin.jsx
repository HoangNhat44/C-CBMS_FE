import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/apiClient";
import "./Dashboard.css";
import Sidebar from "../../components/Sidebar";
import ChangePasswordModal from "../authentication/ChangePasswordModal";
import UserList from "../account/UserList";
import userAPI from "../../services/user.service";

/* ── Sidebar menu ── */
const menuItems = [
  {
    section: "Tổng quan",
    items: [
      { icon: "ti-dashboard", label: "Dashboard", key: "dashboard" },
    ],
  },
  {
    section: "Quản lý người dùng",
    items: [
      { icon: "ti-users",     label: "Tất cả người dùng",  key: "users", badge: "128" },
    ],
  },
  {
    section: "Phân quyền",
    items: [
      { icon: "ti-shield-lock", label: "Vai trò hệ thống", key: "roles" },
      { icon: "ti-lock",        label: "Quyền hạn",        key: "permissions", child: true },
    ],
  },
  {
    section: "Hệ thống",
    items: [
      { icon: "ti-report-analytics", label: "Nhật ký hoạt động", key: "logs" },
      { icon: "ti-settings",         label: "Cài đặt chung",     key: "settings" },
    ],
  },
];

/* ── Metrics ── */
const metrics = [
  { icon: "ti-users",       label: "Tổng người dùng", value: "1,284",  trend: "+32",    up: true,  color: "#e11d48" },
  { icon: "ti-user-check",  label: "Đang hoạt động",  value: "1,089",  trend: "+18",    up: true,  color: "#16a34a" },
  { icon: "ti-user-x",      label: "Bị khóa",         value: "23",     trend: "+2",     up: false, color: "#f59e0b" },
 
];

/* ── User list ── */
const users = [
  { initials: "NQ", name: "Nguyễn Minh Quân",  email: "quan.nm@email.com",  role: "Owner",    status: "on",   statusText: "Hoạt động", bg: "#dbeafe", color: "#1d4ed8", joinDate: "12/01/2025" },
  { initials: "TB", name: "Trần Văn Bình",     email: "binh.tv@email.com",  role: "Staff",    status: "on",   statusText: "Hoạt động", bg: "#dcfce7", color: "#15803d", joinDate: "15/02/2025" },
  { initials: "LH", name: "Lê Hoàng Nam",      email: "nam.lh@email.com",   role: "Customer", status: "on",   statusText: "Hoạt động", bg: "#ede9fe", color: "#5b21b6", joinDate: "20/03/2025" },
  { initials: "PA", name: "Phạm Ngọc Ánh",     email: "anh.pn@email.com",   role: "Customer", status: "warn", statusText: "Cảnh báo",  bg: "#fef3c7", color: "#92400e", joinDate: "05/04/2025" },
  { initials: "VK", name: "Vũ Đình Khải",      email: "khai.vd@email.com",  role: "Staff",    status: "off",  statusText: "Bị khóa",   bg: "#fee2e2", color: "#b91c1c", joinDate: "28/04/2025" },
  { initials: "HT", name: "Hoàng Thị Mai",     email: "mai.ht@email.com",   role: "Owner",    status: "on",   statusText: "Hoạt động", bg: "#dbeafe", color: "#1d4ed8", joinDate: "10/05/2025" },
];

/* ── Roles ── */
const roles = [
  { name: "Admin",    desc: "Toàn quyền quản trị hệ thống",           userCount: 2,   permissions: 24, color: "#e11d48" },
  { name: "Owner",    desc: "Quản lý cơ sở, phòng, doanh thu",        userCount: 12,  permissions: 18, color: "#0f766e" },
  { name: "Staff",    desc: "Quản lý đặt chỗ, sản phẩm, khách hàng", userCount: 34,  permissions: 12, color: "#2563eb" },
  { name: "Customer", desc: "Đặt phòng, xem lịch sử, đánh giá",      userCount: 1236, permissions: 6, color: "#7c3aed" },
  { name: "Guest",    desc: "Chỉ xem trang công khai",                userCount: 0,   permissions: 2,  color: "#64748b" },
];

/* ── Permission groups ── */
const permissionGroups = [
  {
    group: "Quản lý người dùng",
    perms: [
      { name: "user.view",   label: "Xem danh sách",   admin: true, owner: true,  staff: false, customer: false },
      { name: "user.create", label: "Tạo tài khoản",   admin: true, owner: true,  staff: false, customer: false },
      { name: "user.edit",   label: "Chỉnh sửa",       admin: true, owner: false, staff: false, customer: false },
      { name: "user.delete", label: "Xóa / Khóa",      admin: true, owner: false, staff: false, customer: false },
    ],
  },
  {
    group: "Quản lý phòng",
    perms: [
      { name: "room.view",   label: "Xem phòng",       admin: true, owner: true,  staff: true,  customer: true  },
      { name: "room.create", label: "Tạo phòng",       admin: true, owner: true,  staff: false, customer: false },
      { name: "room.edit",   label: "Chỉnh sửa phòng", admin: true, owner: true,  staff: false, customer: false },
      { name: "room.delete", label: "Xóa phòng",       admin: true, owner: true,  staff: false, customer: false },
    ],
  },
  {
    group: "Đặt chỗ",
    perms: [
      { name: "booking.view",   label: "Xem đặt chỗ",   admin: true, owner: true, staff: true,  customer: true  },
      { name: "booking.create", label: "Tạo đặt chỗ",   admin: true, owner: true, staff: true,  customer: true  },
      { name: "booking.cancel", label: "Hủy đặt chỗ",   admin: true, owner: true, staff: true,  customer: false },
    ],
  },
];

/* ── Activity log ── */
const activityLogs = [
  { time: "14:23", user: "Nguyễn Minh Quân", action: "Đăng nhập hệ thống",        type: "info" },
  { time: "14:10", user: "Admin",            action: "Khóa tài khoản Vũ Đình Khải", type: "warn" },
  { time: "13:45", user: "Trần Văn Bình",   action: "Tạo đặt phòng #1205",         type: "info" },
  { time: "12:30", user: "Admin",            action: "Thêm vai trò mới: Moderator",  type: "info" },
  { time: "11:15", user: "Phạm Ngọc Ánh",   action: "Cập nhật thông tin cá nhân",    type: "info" },
  { time: "10:00", user: "Admin",            action: "Thay đổi quyền vai trò Staff",  type: "warn" },
];

const pillMap = { on: "pill-on", hot: "pill-hot", off: "pill-off", blue: "pill-blue", warn: "pill-warn" };
const rolePill = { Admin: "pill-hot", Owner: "pill-on", Staff: "pill-blue", Customer: "pill-warn", Guest: "pill-off" };

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

export default function AdminDashboard() {
  const [active, setActive]     = useState("dashboard");
  const [user, setUser]         = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [cpModalOpen, setCpModalOpen] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  
  const dropRef                 = useRef(null);
  const navigate                = useNavigate();

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

    const fetchTotalUsers = async () => {
      try {
        const uRes = await userAPI.getAllUsers();
        if (uRes.data?.success) {
          setTotalUsers(uRes.data.data.length);
        }
      } catch (err) {
        console.error("Fetch total users failed", err);
      }
    };
    fetchTotalUsers();
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
    <div className="dash dash--admin">

      {/* ── SIDEBAR ── */}
      <Sidebar 
        menuItems={menuItems.map(section => {
          if (section.section === "Quản lý người dùng") {
            return {
              ...section,
              items: section.items.map(item => item.key === "users" ? { ...item, badge: totalUsers > 0 ? totalUsers.toString() : undefined } : item)
            };
          }
          return section;
        })}
        active={active} 
        setActive={setActive} 
        handleLogout={handleLogout} 
        onLogoClick={() => navigate("/admin-dashboard")}
      />

      {/* ── MAIN ── */}
      <div className="main">

        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <span className="breadcrumb">Admin&nbsp;/&nbsp;</span>
            <span className="breadcrumb-active">Quản trị hệ thống</span>
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
          {active === "users" ? (
            <UserList />
          ) : (
            <>
              <div>
                <div className="pg-title">Quản trị hệ thống</div>
                <div className="pg-sub">Quản lý người dùng & phân quyền · Tháng 6, 2025</div>
              </div>

          <div className="metrics" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
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

          <div className="row2">
            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-users" aria-hidden="true" />
                  Danh sách người dùng
                </div>
                <span className="card-more">Xem tất cả</span>
              </div>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: "right" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.email}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="user-av" style={{ background: u.bg, color: u.color, width: 28, height: 28, fontSize: 10 }}>
                            {u.initials}
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td className="td-muted">{u.email}</td>
                      <td><span className={`pill ${rolePill[u.role]}`}>{u.role}</span></td>
                      <td><span className={`pill ${pillMap[u.status]}`}>{u.statusText}</span></td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 13, color: "var(--text-faint)", fontStyle: "italic" }}>Demo</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-report-analytics" aria-hidden="true" />
                  Nhật ký hoạt động
                </div>
                <span className="card-more">Xem tất cả</span>
              </div>
              {activityLogs.map((log, idx) => (
                <div className="user-row" key={idx}>
                  <div
                    className="user-av"
                    style={{
                      background: log.type === "warn" ? "#fef3c7" : "#dbeafe",
                      color:      log.type === "warn" ? "#92400e" : "#1d4ed8",
                      width: 32, height: 32, fontSize: 12,
                    }}
                  >
                    <i className={`ti ${log.type === "warn" ? "ti-alert-triangle" : "ti-activity"}`} style={{ fontSize: 14 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="user-name">
                      {log.action}
                    </div>
                    <div className="user-meta">
                      {log.user} · {log.time}
                    </div>
                  </div>
                  <span className={`pill ${log.type === "warn" ? "pill-warn" : "pill-blue"}`}>
                    {log.type === "warn" ? "Cảnh báo" : "Thông tin"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="row2">
            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-shield-lock" aria-hidden="true" />
                  Vai trò hệ thống
                </div>
                <span className="card-more">Thêm vai trò</span>
              </div>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Vai trò</th>
                    <th>Mô tả</th>
                    <th>Người dùng</th>
                    <th>Quyền</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r) => (
                    <tr key={r.name}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 8, height: 8, borderRadius: "50%",
                              background: r.color, flexShrink: 0,
                            }}
                          />
                          <span style={{ fontWeight: 800 }}>{r.name}</span>
                        </div>
                      </td>
                      <td className="td-muted">{r.desc}</td>
                      <td>
                        <span className="stat-chip">
                          <i className="ti ti-users" style={{ fontSize: 12 }} />
                          {r.userCount}
                        </span>
                      </td>
                      <td>
                        <span className="stat-chip">
                          <i className="ti ti-lock" style={{ fontSize: 12 }} />
                          {r.permissions}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-lock" aria-hidden="true" />
                  Ma trận quyền hạn
                </div>
                <span className="card-more">Chỉnh sửa</span>
              </div>
              {permissionGroups.map((pg) => (
                <div key={pg.group} style={{ marginBottom: 16 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 800, color: "var(--text-muted)",
                    textTransform: "uppercase", letterSpacing: ".07em",
                    marginBottom: 8, paddingBottom: 6,
                    borderBottom: "1px solid var(--border-light)",
                  }}>
                    {pg.group}
                  </div>
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Quyền</th>
                        <th style={{ textAlign: "center" }}>Admin</th>
                        <th style={{ textAlign: "center" }}>Owner</th>
                        <th style={{ textAlign: "center" }}>Staff</th>
                        <th style={{ textAlign: "center" }}>Customer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pg.perms.map((p) => (
                        <tr key={p.name}>
                          <td style={{ fontSize: 12, fontWeight: 600 }}>{p.label}</td>
                          {["admin", "owner", "staff", "customer"].map((role) => (
                            <td key={role} style={{ textAlign: "center" }}>
                              {p[role]
                                ? <i className="ti ti-circle-check" style={{ color: "#16a34a", fontSize: 16 }} />
                                : <i className="ti ti-circle-x"     style={{ color: "#d1d5db", fontSize: 16 }} />
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>

          <div className="row2">
            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-chart-bar" aria-hidden="true" />
                  Phân bổ người dùng theo vai trò
                </div>
              </div>
              {roles.filter(r => r.userCount > 0).map((r) => {
                const maxCount = Math.max(...roles.map(x => x.userCount));
                const pct = Math.round((r.userCount / maxCount) * 100);
                return (
                  <div className="bar-row" key={r.name}>
                    <div className="bar-lbl">{r.name}</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%`, background: r.color }} />
                    </div>
                    <div className="bar-val">{r.userCount}</div>
                  </div>
                );
              })}
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-user-x" aria-hidden="true" />
                  Tài khoản bị khóa
                </div>
                <span className="card-more">Quản lý</span>
              </div>
              {users.filter(u => u.status === "off").length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "32px 0",
                  color: "var(--text-faint)", fontSize: 13, fontWeight: 600,
                }}>
                  <i className="ti ti-mood-smile" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />
                  Không có tài khoản bị khóa
                </div>
              ) : (
                users.filter(u => u.status === "off").map((u) => (
                  <div className="user-row" key={u.email}>
                    <div className="user-av" style={{ background: u.bg, color: u.color }}>
                      {u.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="user-name">{u.name}</div>
                      <div className="user-meta">{u.email} · Tham gia {u.joinDate}</div>
                    </div>
                    <button
                      className="pill pill-on"
                      style={{ cursor: "pointer", border: "none", fontFamily: "inherit" }}
                    >
                      Mở khóa
                    </button>
                  </div>
                ))
              )}
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