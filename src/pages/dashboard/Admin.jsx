import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import UserList from "../account/UserList";
import userAPI from "../../services/user.service";
import roleAPI from "../../services/role.service";

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
      { icon: "ti-users", label: "Tất cả người dùng", key: "users", badge: "128" },
    ],
  },
  {
    section: "Phân quyền",
    items: [
      { icon: "ti-shield-lock", label: "Vai trò hệ thống", key: "roles" },
      { icon: "ti-lock", label: "Quyền hạn", key: "permissions", child: true },
    ],
  },
  {
    section: "Hệ thống",
    items: [
      { icon: "ti-report-analytics", label: "Nhật ký hoạt động", key: "logs" },
      { icon: "ti-settings", label: "Cài đặt chung", key: "settings" },
    ],
  },
];

/* ── Metrics ── */
const metrics = [
  { icon: "ti-users", label: "Tổng người dùng", value: "1,284", trend: "+32", up: true, color: "#e11d48" },
  { icon: "ti-user-check", label: "Đang hoạt động", value: "1,089", trend: "+18", up: true, color: "#16a34a" },
  { icon: "ti-user-x", label: "Bị khóa", value: "23", trend: "+2", up: false, color: "#f59e0b" },

];

/* ── User list ── */
const users = [
  { initials: "NQ", name: "Nguyễn Minh Quân", email: "quan.nm@email.com", role: "Owner", status: "on", statusText: "Hoạt động", bg: "#dbeafe", color: "#1d4ed8", joinDate: "12/01/2025" },
  { initials: "TB", name: "Trần Văn Bình", email: "binh.tv@email.com", role: "Staff", status: "on", statusText: "Hoạt động", bg: "#dcfce7", color: "#15803d", joinDate: "15/02/2025" },
  { initials: "LH", name: "Lê Hoàng Nam", email: "nam.lh@email.com", role: "Customer", status: "on", statusText: "Hoạt động", bg: "#ede9fe", color: "#5b21b6", joinDate: "20/03/2025" },
  { initials: "PA", name: "Phạm Ngọc Ánh", email: "anh.pn@email.com", role: "Customer", status: "warn", statusText: "Cảnh báo", bg: "#fef3c7", color: "#92400e", joinDate: "05/04/2025" },
  { initials: "VK", name: "Vũ Đình Khải", email: "khai.vd@email.com", role: "Staff", status: "off", statusText: "Bị khóa", bg: "#fee2e2", color: "#b91c1c", joinDate: "28/04/2025" },
  { initials: "HT", name: "Hoàng Thị Mai", email: "mai.ht@email.com", role: "Owner", status: "on", statusText: "Hoạt động", bg: "#dbeafe", color: "#1d4ed8", joinDate: "10/05/2025" },
];

/* ── Roles ── */
const roles = [
  { name: "Admin", desc: "Toàn quyền quản trị hệ thống", userCount: 2, permissions: 24, color: "#e11d48" },
  { name: "Owner", desc: "Quản lý cơ sở, phòng, doanh thu", userCount: 12, permissions: 18, color: "#0f766e" },
  { name: "Staff", desc: "Quản lý đặt chỗ, sản phẩm, khách hàng", userCount: 34, permissions: 12, color: "#2563eb" },
  { name: "Customer", desc: "Đặt phòng, xem lịch sử, đánh giá", userCount: 1236, permissions: 6, color: "#7c3aed" },
  { name: "Guest", desc: "Chỉ xem trang công khai", userCount: 0, permissions: 2, color: "#64748b" },
];

/* ── Permission groups ── */
const permissionGroups = [
  {
    group: "Quản lý người dùng",
    perms: [
      { name: "user.view", label: "Xem danh sách", admin: true, owner: true, staff: false, customer: false },
      { name: "user.create", label: "Tạo tài khoản", admin: true, owner: true, staff: false, customer: false },
      { name: "user.edit", label: "Chỉnh sửa", admin: true, owner: false, staff: false, customer: false },
      { name: "user.delete", label: "Xóa / Khóa", admin: true, owner: false, staff: false, customer: false },
    ],
  },
  {
    group: "Quản lý phòng",
    perms: [
      { name: "room.view", label: "Xem phòng", admin: true, owner: true, staff: true, customer: true },
      { name: "room.create", label: "Tạo phòng", admin: true, owner: true, staff: false, customer: false },
      { name: "room.edit", label: "Chỉnh sửa phòng", admin: true, owner: true, staff: false, customer: false },
      { name: "room.delete", label: "Xóa phòng", admin: true, owner: true, staff: false, customer: false },
    ],
  },
  {
    group: "Đặt chỗ",
    perms: [
      { name: "booking.view", label: "Xem đặt chỗ", admin: true, owner: true, staff: true, customer: true },
      { name: "booking.create", label: "Tạo đặt chỗ", admin: true, owner: true, staff: true, customer: true },
      { name: "booking.cancel", label: "Hủy đặt chỗ", admin: true, owner: true, staff: true, customer: false },
    ],
  },
];

/* ── Activity log ── */
const activityLogs = [
  { time: "14:23", user: "Nguyễn Minh Quân", action: "Đăng nhập hệ thống", type: "info" },
  { time: "14:10", user: "Admin", action: "Khóa tài khoản Vũ Đình Khải", type: "warn" },
  { time: "13:45", user: "Trần Văn Bình", action: "Tạo đặt phòng #1205", type: "info" },
  { time: "12:30", user: "Admin", action: "Thêm vai trò mới: Moderator", type: "info" },
  { time: "11:15", user: "Phạm Ngọc Ánh", action: "Cập nhật thông tin cá nhân", type: "info" },
  { time: "10:00", user: "Admin", action: "Thay đổi quyền vai trò Staff", type: "warn" },
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


export default function AdminDashboard() {
  const [active, setActive] = useState("dashboard");
  const [usersList, setUsersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [lockedUsers, setLockedUsers] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        // Valid token logic
      } else {
        localStorage.removeItem("token");
      }
    }

    const fetchAllUsers = async () => {
      try {
        const uRes = await userAPI.getAllUsers();
        if (uRes.data?.success) {
          const list = uRes.data.data;
          setUsersList(list);
          setTotalUsers(list.length);
          setActiveUsers(list.filter(u => u.isActive).length);
          setLockedUsers(list.filter(u => !u.isActive).length);
        }
      } catch (err) {
        console.error("Fetch users failed", err);
      }
    };

    const fetchAllRoles = async () => {
      try {
        const res = await roleAPI.getAllRoles();
        if (res.data?.success) {
          setRolesList(res.data.data);
        }
      } catch (err) {
        console.error("Fetch roles failed", err);
      }
    };

    fetchAllUsers();
    fetchAllRoles();
  }, []);



  const handleLogout = () => {
    localStorage.removeItem("token");
    // Logout logic
    navigate("/login", { replace: true });
  };

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

      <div className="main">
        {/* Topbar */}
        <Topbar breadcrumbs={[{ label: "Admin", link: "/admin-dashboard" }, { label: "Quản trị hệ thống" }]} />

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
                <div className="metric">
                  <div className="metric-accent" style={{ background: "#e11d48" }} />
                  <div className="metric-lbl">
                    <i className="ti ti-users" aria-hidden="true" />
                    Tổng người dùng
                  </div>
                  <div className="metric-val">{totalUsers}</div>
                </div>
                <div className="metric">
                  <div className="metric-accent" style={{ background: "#16a34a" }} />
                  <div className="metric-lbl">
                    <i className="ti ti-user-check" aria-hidden="true" />
                    Đang hoạt động
                  </div>
                  <div className="metric-val">{activeUsers}</div>
                </div>
                <div className="metric">
                  <div className="metric-accent" style={{ background: "#f59e0b" }} />
                  <div className="metric-lbl">
                    <i className="ti ti-user-x" aria-hidden="true" />
                    Bị khóa
                  </div>
                  <div className="metric-val">{lockedUsers}</div>
                </div>
              </div>

              <div className="row2">
                <div className="card">
                  <div className="card-head">
                    <div className="card-title">
                      <i className="ti ti-users" aria-hidden="true" />
                      Danh sách người dùng
                    </div>
                  </div>
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Người dùng</th>
                        <th>Email</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.slice(0, 5).map((u) => {
                        const roleName = u.roleId?.name || "Customer";
                        const initials = u.fullName ? u.fullName.substring(0, 2).toUpperCase() : "U";
                        const bg = u.isActive ? "#dbeafe" : "#fee2e2";
                        const color = u.isActive ? "#1d4ed8" : "#b91c1c";
                        const statusPill = u.isActive ? "pill-on" : "pill-off";
                        const statusText = u.isActive ? "Hoạt động" : "Bị khóa";
                        const roleP = rolePill[roleName] || "pill-blue";

                        return (
                          <tr key={u._id}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div className="user-av" style={{ background: bg, color: color, width: 28, height: 28, fontSize: 10 }}>
                                  {initials}
                                </div>
                                {u.fullName}
                              </div>
                            </td>
                            <td className="td-muted">{u.email}</td>
                            <td><span className={`pill ${roleP}`}>{roleName}</span></td>
                            <td><span className={`pill ${statusPill}`}>{statusText}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="card">
                  <div className="card-head">
                    <div className="card-title">
                      <i className="ti ti-user-x" aria-hidden="true" />
                      Tài khoản bị khóa
                    </div>
                   
                  </div>
                  {usersList.filter(u => !u.isActive).length === 0 ? (
                    <div style={{
                      textAlign: "center", padding: "32px 0",
                      color: "var(--text-faint)", fontSize: 13, fontWeight: 600,
                    }}>
                      <i className="ti ti-mood-smile" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />
                      Không có tài khoản bị khóa
                    </div>
                  ) : (
                    usersList.filter(u => !u.isActive).map((u) => {
                      const initials = u.fullName ? u.fullName.substring(0, 2).toUpperCase() : "U";
                      const bg = "#fee2e2";
                      const color = "#b91c1c";
                      const joinDate = new Date(u.createdAt).toLocaleDateString("vi-VN");
                      return (
                        <div className="user-row" key={u._id}>
                          <div className="user-av" style={{ background: bg, color: color }}>
                            {initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="user-name">{u.fullName}</div>
                            <div className="user-meta">{u.email} · Tham gia {joinDate}</div>
                          </div>
                          <button
                            className="pill pill-on"
                            style={{ cursor: "pointer", border: "none", fontFamily: "inherit" }}
                          >
                            Mở khóa
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="row2">
                <div className="card">
                  <div className="card-head">
                    <div className="card-title">
                      <i className="ti ti-shield-lock" aria-hidden="true" />
                      Vai trò hệ thống
                    </div>
                  </div>
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Vai trò</th>
                        <th>Mô tả</th>
                        <th>Người dùng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rolesList.concat([{ name: "guest", description: "Xem trang công khai và đặt phòng", _id: "guest-mock" }]).map((r) => {
                        const nameDisplay = r.name.charAt(0).toUpperCase() + r.name.slice(1);
                        const roleColor = { admin: "#e11d48", owner: "#16a34a", staff: "#4f8ef7", customer: "#f59e0b", user: "#f59e0b" }[r.name] || "#9ca3af";

                        let uCount = 0;
                        if (r.name !== "guest") {
                          uCount = usersList.filter(u => u.roleId?._id === r._id || (u.roleId?.name || "").toLowerCase() === r.name).length;
                        }

                        return (
                          <tr key={r.name}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div
                                  style={{
                                    width: 8, height: 8, borderRadius: "50%",
                                    background: roleColor, flexShrink: 0,
                                  }}
                                />
                                <span style={{ fontWeight: 800 }}>{nameDisplay}</span>
                              </div>
                            </td>
                            <td className="td-muted">{r.description || (r.name === "guest" ? "Xem trang công khai và đặt phòng" : "Chưa có mô tả")}</td>
                            <td>
                              {r.name === "guest" ? null : (
                                <span className="stat-chip">
                                  <i className="ti ti-users" style={{ fontSize: 12 }} />
                                  {uCount}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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
                                    : <i className="ti ti-circle-x" style={{ color: "#d1d5db", fontSize: 16 }} />
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


            </>
          )}
        </div>
      </div>



    </div>
  );
}