import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const routeMap = {
  facility: "/branches",
  roomtype: "/roomtype",
  room: "/room",
  slot: "/slots",
  roomprice: "/room-prices",
  category: "/categories",
  product: "/products",
  news: "/news",
  review: "/feedbacks",
  bookinghistory: "/bookinghistory",
  walkin: "/walkin",
  profile: "/profile",
};

export default function Sidebar({ menuItems, active, setActive, handleLogout, onLogoClick }) {
  const { hasPermission, user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <aside className="sb">
        <div className="sb-brand">...</div>
      </aside>
    );
  }

function getRoleName(user) {
  if (!user) return "";
  if (typeof user.role === "string") return user.role;
  if (typeof user.role === "object" && user.role?.name) return user.role.name;
  if (typeof user.roleId === "string") return user.roleId;
  if (typeof user.roleId === "object" && user.roleId?.name) return user.roleId.name;
  if (typeof user.roleName === "string") return user.roleName;
  return "";
}

  const handleItemClick = (key) => {
    // 1. Notify parent if custom callback provided
    if (setActive) {
      setActive(key);
    }

    // 2. Perform central route navigation if key maps to a route
    if (routeMap[key]) {
      navigate(routeMap[key]);
    } else if (key === "revenue" || key === "dashboard" || key === "overview" || key === "promotion" || key === "service" || key === "adduser" || key === "rooms" || key === "customers") {
      const roleStr = getRoleName(user).toLowerCase();
      const currentDash = localStorage.getItem("current_dashboard");
      const isStaff = roleStr === "staff" || currentDash === "staff";
      navigate(isStaff ? "/staff-dashboard" : "/owner-dashboard", { state: { activeTab: key } });
    }
  };

  return (
    <aside className="sb">
      <div className="sb-brand">
        <div className="auth-brand__logo" style={{ color: "#ffffff", cursor: "pointer" }} onClick={onLogoClick}>
          <img src="/logo.png" alt="Logo" className="auth-brand__logo-icon" />
          C-CBMS
        </div>
      </div>

      {menuItems.map((group) => {
        const visibleItems = group.items.filter((item) => {
          if (item.requiredPermission) {
            return hasPermission(item.requiredPermission);
          }
          return true;
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={group.section}>
            <div className="sb-section">{group.section}</div>
            {visibleItems.map((item) => (
              <div
                key={item.key}
                className={`sb-item${item.child ? " sb-child" : ""}${active === item.key ? " active" : ""}`}
                onClick={() => handleItemClick(item.key)}
              >
                <i className={`ti ${item.icon}`} aria-hidden="true" />
                {item.label}
                {item.badge && <span className="sb-badge">{item.badge}</span>}
              </div>
            ))}
          </div>
        );
      })}

      <div className="sb-footer">
        <div className="sb-logout" onClick={handleLogout}>
          <i className="ti ti-logout" aria-hidden="true" />
          Đăng xuất
        </div>
      </div>
    </aside>
  );
}
