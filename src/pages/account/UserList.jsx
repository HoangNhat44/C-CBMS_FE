import React, { useState, useEffect } from "react";
import userAPI from "../../services/user.service";
import roleAPI from "../../services/role.service";
import AddUserModal from "./AddUserModal";
import { useAuth } from "../../context/AuthContext";

function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

export default function UserList() {
  const { user: currentUser } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchUsersAndRoles = async () => {
    try {
      setLoading(true);
      const [uRes, rRes] = await Promise.all([
        userAPI.getAllUsers(),
        roleAPI.getAllRoles()
      ]);
      if (uRes.data?.success) setUsersList(uRes.data.data || []);
      if (rRes.data?.success) setRolesList(rRes.data.data || []);
    } catch (err) {
      console.error("Fetch data failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const handleToggleState = async (id, currentState) => {
    try {
      const res = await userAPI.updateUser(id, { isActive: !currentState });
      if (res.data?.success) {
        fetchUsersAndRoles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (id, newRoleId) => {
    try {
      const res = await userAPI.updateUser(id, { roleId: newRoleId });
      if (res.data?.success) {
        fetchUsersAndRoles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeUsersCount = usersList.filter(u => u.isActive).length;
  const lockedUsersCount = usersList.filter(u => !u.isActive).length;

  const metrics = [
    { icon: "ti-users",       label: "Tổng người dùng", value: usersList.length,    trend: "Thực tế", up: true,  color: "#e11d48" },
    { icon: "ti-user-check",  label: "Hoạt động",       value: activeUsersCount,     trend: "Thực tế", up: true,  color: "#10b981" },
    { icon: "ti-user-x",      label: "Bị khóa",         value: lockedUsersCount,     trend: "Thực tế", up: false, color: "#f59e0b" },
  ];

  const currentRoleName = currentUser?.role?.name?.toLowerCase() || currentUser?.roleId?.name?.toLowerCase() || "";
  let allowedRoles = rolesList.filter(r => r.name?.toLowerCase() !== "admin");
  if (currentRoleName === "staff") {
    allowedRoles = allowedRoles.filter(r => r.name?.toLowerCase() === "customer");
  } else if (currentRoleName === "owner") {
    allowedRoles = allowedRoles.filter(r => ["customer", "staff"].includes(r.name?.toLowerCase()));
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="pg-title">Quản lý người dùng</div>
          <div className="pg-sub">Xem và phân quyền người dùng trong hệ thống</div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
          style={{ padding: "8px 16px", borderRadius: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}
        >
          <i className="ti ti-plus" /> Thêm tài khoản
        </button>
      </div>

      {/* Metrics */}
      <div className="metrics" style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {metrics.map((m) => (
          <div className="metric" key={m.label} style={{ background: "#fff", padding: 16, borderRadius: 12, border: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
            <div className="metric-accent" style={{ background: m.color, width: 4, height: "100%", position: "absolute", left: 0, top: 0 }} />
            <div className="metric-lbl" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
              <i className={`ti ${m.icon}`} aria-hidden="true" />
              {m.label}
            </div>
            <div className="metric-val" style={{ fontSize: 24, fontWeight: 800, margin: "8px 0" }}>{m.value}</div>
            <div className={`metric-trend ${m.up ? "trend-up" : "trend-dn"}`} style={{ fontSize: 12, color: m.up ? "#16a34a" : "#ea580c" }}>
              {m.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="card" style={{ marginTop: 24 }}>
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
              <th style={{ textAlign: "right" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {usersList.map((u) => {
              const statusText = u.isActive ? "Hoạt động" : "Bị khóa";
              const statusMap = u.isActive ? "pill-on" : "pill-off";

              return (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="user-av" style={{ background: "#dbeafe", color: "#1d4ed8", width: 28, height: 28, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: 700 }}>
                        {getInitials(u.fullName)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.fullName}</span>
                    </div>
                  </td>
                  <td className="td-muted">{u.email}</td>
                  <td>
                    {/* Inline Role Edit Dropdown */}
                    {(u.roleId?.name || "").toLowerCase() === "admin" ? (
                      <span style={{ textTransform: "capitalize", fontWeight: 600, color: "var(--text-dark)", fontSize: 13 }}>
                        {u.roleId?.name || "Admin"}
                      </span>
                    ) : (
                      <select
                        value={u.roleId?._id || u.roleId || ""}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid var(--border)", fontSize: 13, cursor: "pointer", textTransform: "capitalize", background: "#fff" }}
                      >
                        <option value="" disabled>-- Chọn vai trò --</option>
                        {rolesList.map((r) => {
                          const isAllowed = allowedRoles.some(ar => ar._id === r._id);
                          return (
                            <option 
                              key={r._id} 
                              value={r._id} 
                              disabled={!isAllowed}
                            >
                              {r.name}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </td>
                  <td><span className={`pill ${statusMap}`}>{statusText}</span></td>
                  <td style={{ textAlign: "right" }}>
                    {currentUser && currentUser._id !== u._id && (u.roleId?.name || "").toLowerCase() !== "admin" && (
                      <button
                        onClick={() => handleToggleState(u._id, u.isActive)}
                        className="btn-outline"
                        style={{ padding: "6px 12px", fontSize: 12, borderRadius: 6, cursor: "pointer", border: "1px solid var(--border)", fontWeight: 600, color: u.isActive ? "#b91c1c" : "#15803d", background: "#fff" }}
                      >
                        {u.isActive ? "Khóa tài khoản" : "Mở khóa"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddForm && (
        <AddUserModal
          onClose={() => setShowAddForm(false)}
          onSuccess={() => fetchUsersAndRoles()}
        />
      )}
    </div>
  );
}
