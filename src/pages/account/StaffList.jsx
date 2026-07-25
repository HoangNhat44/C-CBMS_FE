import React, { useState, useEffect } from "react";
import userAPI from "../../services/user.service";
import AddUserModal from "./AddUserModal";

function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

export default function StaffList() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchStaffUsers = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getAllUsers();
      if (res.data?.success) {
        // Only list users with role name 'staff'
        const allUsers = res.data.data || [];
        const staffOnly = allUsers.filter(
          (u) => (u.roleId?.name || u.role || "").toLowerCase() === "staff"
        );
        setUsersList(staffOnly);
      }
    } catch (err) {
      console.error("Fetch staff failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffUsers();
  }, []);

  const handleToggleState = async (id, currentState) => {
    try {
      const res = await userAPI.updateUser(id, { isActive: !currentState });
      if (res.data?.success) {
        fetchStaffUsers();
      }
    } catch (err) {
      console.error("Toggle staff state failed", err);
      alert("Cập nhật trạng thái thất bại: " + (err.response?.data?.message || err.message));
    }
  };

  const activeStaffCount = usersList.filter((u) => u.isActive).length;
  const lockedStaffCount = usersList.filter((u) => !u.isActive).length;

  const metrics = [
    { icon: "ti-users",       label: "Tổng nhân viên", value: usersList.length,    trend: "Thực tế", color: "#0f766e" },
    { icon: "ti-user-check",  label: "Đang làm việc",  value: activeStaffCount,     trend: "Hoạt động", color: "#10b981" },
    { icon: "ti-user-x",      label: "Đã tạm khóa",    value: lockedStaffCount,     trend: "Bị khóa", color: "#ef4444" },
  ];

  if (loading) {
    return <div style={{ padding: 20 }}>Đang tải dữ liệu nhân viên...</div>;
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="pg-title">Quản lý tài khoản nhân viên</div>
          <div className="pg-sub">Xem, tạo mới và quản lý trạng thái hoạt động của nhân viên các chi nhánh</div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
          style={{ padding: "8px 16px", borderRadius: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}
        >
          <i className="ti ti-plus" /> Thêm nhân viên
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
            <div style={{ fontSize: 12, color: m.color, fontWeight: 700 }}>
              {m.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Staff Table */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-head">
          <div className="card-title">
            <i className="ti ti-users" aria-hidden="true" />
            Danh sách nhân viên hệ thống
          </div>
        </div>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Chi nhánh</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: "right" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {usersList.map((u) => {
              const statusText = u.isActive ? "Đang làm việc" : "Đã khóa";
              const statusMap = u.isActive ? "pill-on" : "pill-off";

              return (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="user-av" style={{ background: "#ccfbf1", color: "#0f766e", width: 28, height: 28, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: 700 }}>
                        {getInitials(u.fullName)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.fullName}</span>
                    </div>
                  </td>
                  <td className="td-muted">{u.email}</td>
                  <td className="td-muted">{u.phone || "—"}</td>
                  <td className="td-muted" style={{ fontWeight: 600 }}>{u.branchId?.name || "Chưa phân bổ"}</td>
                  <td><span className={`pill ${statusMap}`}>{statusText}</span></td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={() => handleToggleState(u._id, u.isActive)}
                      className="btn-outline"
                      style={{ 
                        padding: "6px 12px", 
                        fontSize: 12, 
                        borderRadius: 6, 
                        cursor: "pointer", 
                        border: "1px solid var(--border)", 
                        fontWeight: 700, 
                        color: u.isActive ? "#b91c1c" : "#15803d", 
                        background: "#fff",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = u.isActive ? "#fef2f2" : "#f0fdf4";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                      }}
                    >
                      {u.isActive ? "Khóa tài khoản" : "Kích hoạt lại"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {usersList.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)" }}>
                  Chưa có nhân viên nào trong hệ thống.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showAddForm && (
        <AddUserModal
          onClose={() => setShowAddForm(false)}
          onSuccess={() => fetchStaffUsers()}
          defaultRole="staff"
        />
      )}
    </div>
  );
}
