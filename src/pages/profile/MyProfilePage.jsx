import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import ChangePasswordModal from "../authentication/ChangePasswordModal";
import Topbar from "../../components/Topbar";
import profileService from "../../services/profile.service";

import { ownerMenuItems } from "../dashboard/Owner";
import { staffMenuItems } from "../dashboard/Staff";
import "../dashboard/Dashboard.css";
import "./MyProfilePage.css";

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

export default function MyProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Layout states
  const [cpModalOpen, setCpModalOpen] = useState(false);
  const navigate = useNavigate();



  // Fetch profile details
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const res = await profileService.getProfile();
      if (res.data?.success) {
        const u = res.data.data;
        setUser(u);
        setFullName(u.fullName || "");
        setPhone(u.phone || "");
      } else {
        setError("Không thể tải thông tin cá nhân.");
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
      setError("Có lỗi xảy ra khi tải thông tin cá nhân.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const decoded = decodeToken(token);
    if (!decoded || decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }
    fetchProfile();
  }, [fetchProfile, navigate]);

  // Auto-hide messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login", { replace: true });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Họ và tên không được để trống.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await profileService.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
      });

      if (res.data?.success) {
        setSuccess("Cập nhật thông tin cá nhân thành công!");
        setIsEditing(false);
        fetchProfile();
      } else {
        setError(res.data?.message || "Cập nhật thất bại.");
      }
    } catch (err) {
      console.error("Failed to update profile", err);
      setError(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật thông tin.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFullName(user.fullName || "");
      setPhone(user.phone || "");
    }
    setIsEditing(false);
    setError("");
  };

  const handleMenuChange = (key) => {
    if (key === "room") navigate("/room");
    else if (key === "roomtype") navigate("/roomtype");
    else if (key === "news") navigate("/news");
    else if (key === "category") navigate("/categories");
    else if (key === "product") navigate("/products");
    else if (key === "review") navigate("/feedbacks");
    else if (key === "bookinghistory") navigate("/bookinghistory");
    else if (key === "facility") navigate("/branches");
    else if (key === "slot") navigate("/slots");
    else if (key === "promotion" || key === "revenue" || key === "service" || key === "adduser") {
      navigate("/owner-dashboard", { state: { activeTab: key } });
    }
    else navigate("/owner-dashboard");
  };

  if (loading && !user) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Đang tải thông tin cá nhân...</div>;
  }

  if (!user) {
    return <div style={{ padding: "40px", textAlign: "center", color: "red" }}>{error || "Không tìm thấy hồ sơ."}</div>;
  }

  const roleName = (user.roleId?.name || user.roleName || "").toLowerCase();
  const isDashboardRole = roleName === "owner" || roleName === "staff" || roleName === "admin";
  const initials = getInitials(user.fullName || user.email || "");

  // Main Form Component
  const renderFormContent = () => (
    <form onSubmit={handleSave} className="profile-form-section">
      <div className="profile-form-grid">
        <div className="profile-field-group">
          <label className="profile-field-label">Email đăng nhập</label>
          <input
            type="email"
            value={user.email || ""}
            disabled
            className="profile-field-input"
          />
        </div>

        <div className="profile-field-group">
          <label className="profile-field-label">Vai trò hệ thống</label>
          <input
            type="text"
            value={user.roleId?.name ? user.roleId.name.toUpperCase() : ""}
            disabled
            className="profile-field-input"
          />
        </div>

        {roleName === "staff" && user.branchId && (
          <div className="profile-field-group">
            <label className="profile-field-label">Cơ sở làm việc</label>
            <input
              type="text"
              value={user.branchId.name || ""}
              disabled
              className="profile-field-input"
            />
          </div>
        )}

        <div className="profile-field-group">
          <label className="profile-field-label">Họ và tên *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={!isEditing}
            required
            className="profile-field-input"
            placeholder="Nhập họ và tên"
          />
        </div>

        <div className="profile-field-group">
          <label className="profile-field-label">Số điện thoại</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={!isEditing}
            className="profile-field-input"
            placeholder="Nhập số điện thoại"
          />
        </div>
      </div>

      <div className="profile-actions-row">
        <button
          type="button"
          className="profile-btn-password"
          onClick={() => setCpModalOpen(true)}
        >
          <i className="ti ti-key" /> Thay đổi mật khẩu
        </button>

        {!isEditing ? (
          <button
            type="button"
            className="profile-btn-save"
            onClick={() => setIsEditing(true)}
          >
            <i className="ti ti-edit" /> Chỉnh sửa hồ sơ
          </button>
        ) : (
          <>
            <button
              type="button"
              className="profile-btn-cancel"
              onClick={handleCancel}
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="profile-btn-save"
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </>
        )}
      </div>
    </form>
  );

  // Render Dashboard Layout for Owner/Staff/Admin
  if (isDashboardRole) {
    const menuItems = roleName === "staff" ? staffMenuItems : ownerMenuItems;
    return (
      <div className={`dash ${roleName === "staff" ? "dash--staff" : ""}`}>
        <Sidebar
          menuItems={menuItems}
          active=""
          setActive={handleMenuChange}
          handleLogout={handleLogout}
          onLogoClick={() => navigate(roleName === "staff" ? "/staff-dashboard" : "/owner-dashboard")}
        />

        <div className="main">
          {/* Topbar */}
          <Topbar user={user} breadcrumbs={[{ label: "Trang chủ", link: roleName === "staff" ? "/staff-dashboard" : "/owner-dashboard" }, { label: "Hồ sơ cá nhân" }]} />

          {/* Scrollable content */}
          <div className="content" style={{ overflowY: "auto", flex: 1 }}>
            <header className="profile-header">
              <div>
                <h1 className="pg-title">Thông tin cá nhân</h1>
                <p className="pg-sub">Xem và cập nhật thông tin tài khoản của bạn trên hệ thống.</p>
              </div>
            </header>

            {success && <div className="message-alert success">{success}</div>}
            {error && <div className="message-alert error">{error}</div>}

            <div className="profile-card">
              <div className="profile-avatar-section">
                <div className="profile-big-avatar">{initials}</div>
                <div className="profile-username">{user.fullName}</div>
                <div className="profile-userrole">{user.roleId?.name}</div>
              </div>

              {renderFormContent()}
            </div>
          </div>
        </div>

        <ChangePasswordModal isOpen={cpModalOpen} onClose={() => setCpModalOpen(false)} />
      </div>
    );
  }

  // Render Customer/Public Layout with Header
  return (
    <>
      <Header />
      <div className="public-profile-container">
        <header>
          <h1 className="public-profile-title">Thông tin cá nhân</h1>
          <p className="public-profile-sub">Quản lý thông tin tài khoản thành viên của bạn.</p>
        </header>

        {success && <div className="message-alert success" style={{ marginBottom: "20px" }}>{success}</div>}
        {error && <div className="message-alert error" style={{ marginBottom: "20px" }}>{error}</div>}

        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-big-avatar">{initials}</div>
            <div className="profile-username">{user.fullName}</div>
            <div className="profile-userrole">Khách hàng</div>
          </div>

          {renderFormContent()}
        </div>
      </div>
      <ChangePasswordModal isOpen={cpModalOpen} onClose={() => setCpModalOpen(false)} />
    </>
  );
}
