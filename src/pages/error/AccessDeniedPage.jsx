
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AccessDenied.css";

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // roleId có thể là object (populated) hoặc string (id)
  // role là object được format với trường name
  const roleNameRaw =
    (typeof user?.roleId === "object" ? user?.roleId?.name : null) ||
    user?.role?.name ||
    "";
  const roleName = roleNameRaw || "Khách";

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    const role = roleName.toLowerCase();
    if (role === "admin") navigate("/admin-dashboard");
    else if (role === "owner") navigate("/owner-dashboard");
    else if (role === "staff") navigate("/staff-dashboard");
    else if (role === "customer") navigate("/booking");
    else navigate("/landing-dashboard");
  };

  return (
    <div className="ad-page">
      {/* Animated background blobs */}
      <div className="ad-blob ad-blob-1" />
      <div className="ad-blob ad-blob-2" />
      <div className="ad-blob ad-blob-3" />

      <div className="ad-card">
        {/* Lock icon */}
        <div className="ad-icon-wrap">
          <div className="ad-icon-ring" />
          <div className="ad-icon-core">
            <i className="ti ti-lock" />
          </div>
        </div>

        {/* Error code */}
        <div className="ad-code">403</div>

        {/* Title */}
        <h1 className="ad-title">Truy cập bị từ chối</h1>

        {/* Description */}
        <p className="ad-desc">
          Bạn không có quyền để thực hiện hành động này
        </p>

        {/* Info box */}
        <div className="ad-info-box">
          <i className="ti ti-shield-lock" />
          <span>Trang này yêu cầu quyền truy cập đặc biệt</span>
        </div>

        {/* Actions */}
        <div className="ad-actions">
          <button className="ad-btn-back" onClick={handleGoBack}>
            <i className="ti ti-arrow-left" />
            Quay lại
          </button>
          <button className="ad-btn-home" onClick={handleGoHome}>
            <i className="ti ti-home" />
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
