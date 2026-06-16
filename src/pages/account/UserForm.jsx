import React, { useState, useEffect } from "react";

export default function UserForm({ user, roles, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    roleId: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        roleId: user.roleId?._id || user.roleId || "",
        password: "", // Leave blank on edit, only send if user types it
      });
    } else {
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        roleId: roles.length > 0 ? roles[0]._id : "",
        password: "",
      });
    }
  }, [user, roles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = { ...formData };
    if (user && !dataToSubmit.password) {
      delete dataToSubmit.password; // Do not update password if not provided
    }
    onSubmit(dataToSubmit);
  };

  return (
    <div className="card" style={{ maxWidth: 600, margin: "0 auto" }}>
      <div className="card-head">
        <div className="card-title">
          <i className="ti ti-user" aria-hidden="true" />
          {user ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
        </div>
      </div>
      <form onSubmit={handleSubmit} style={{ padding: 20 }}>
        <div className="form-group" style={{ marginBottom: 15 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13 }}>Họ và tên</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8 }}
            required
          />
        </div>
        
        <div className="form-group" style={{ marginBottom: 15 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13 }}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8 }}
            required
            disabled={!!user} // Email usually can't be changed after creation
          />
        </div>

        <div className="form-group" style={{ marginBottom: 15 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13 }}>Số điện thoại</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8 }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 15 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13 }}>Vai trò (Phân quyền)</label>
          <select
            name="roleId"
            value={formData.roleId}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, backgroundColor: "#fff" }}
            required
          >
            <option value="" disabled>-- Chọn vai trò --</option>
            {roles.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 25 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13 }}>
            {user ? "Mật khẩu mới (Để trống nếu không muốn đổi)" : "Mật khẩu"}
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px 40px 10px 12px", border: "1px solid var(--border)", borderRadius: 8 }}
              required={!user}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                fontSize: 16,
                padding: 0,
                display: "flex",
                alignItems: "center"
              }}
            >
              <i className={showPassword ? "ti ti-eye-off" : "ti ti-eye"} />
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-outline"
              style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", border: "1px solid var(--border)", background: "#fff", fontWeight: 600 }}
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", background: "#1d4ed8", color: "#ffffff", border: "none", fontWeight: 600 }}
          >
            {user ? "Lưu thay đổi" : "Tạo tài khoản"}
          </button>
        </div>
      </form>
    </div>
  );
}
